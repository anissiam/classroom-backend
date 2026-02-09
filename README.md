### Classroom Backend

A TypeScript/Express REST API for managing departments, subjects, classes, users, enrollments, and stats. It uses Drizzle ORM (PostgreSQL) and integrates authentication via Better Auth. Security and rate‑limiting are enforced with Arcjet.


#### Key features
- RESTful endpoints under `/api/*`
- Consistent response envelope: `{ data: ... }` and `{ data: ..., pagination: ... }`
- Pagination, filtering support on list endpoints
- Relational joins returned inline (e.g., `class.teacher`, `class.subject`, etc.)
- Email/password auth with Better Auth under `/api/auth/*`
- Role‑aware rate limiting (admin/teacher/student/guest) via Arcjet


### Tech stack
- Runtime: Node.js + Express
- Language: TypeScript
- Database: PostgreSQL
- ORM: Drizzle ORM
- Auth: Better Auth (Drizzle adapter)
- Security / Rate limiting: Arcjet
- CORS: `cors` middleware


### Requirements
- Node.js 18+
- PostgreSQL 14+


### Environment variables
Create a `.env` file in `classroom-backend/` with at least:

- `PORT` — API port (default 8000)
- `FRONTEND_URL` — allowed origin for CORS and Better Auth trusted origin (e.g., `http://localhost:5173`)
- `BETTER_AUTH_SECRET` — secret for Better Auth
- `DATABASE_URL` — PostgreSQL connection string (used by Drizzle `db`)
- `ARCJET_KEY` — Arcjet API key (if required by your `config/arcjet.js`)
- `NODE_ENV` — `development` | `production` | `test`

Notes:
- In development, if requests to `/api/auth/*` have no `Origin` header, the server sets it to `FRONTEND_URL` automatically to satisfy Better Auth’s CSRF/origin checks.
- In `NODE_ENV=test`, security middleware is skipped.


### Application structure
```
classroom-backend/
  src/
    index.ts                      # Express app, routers mounting, CORS, JSON, auth handler
    lib/
      auth.ts                     # Better Auth config (email/password, extra user fields)
    middleware/
      security.ts                 # Arcjet rate limiting & bot/shield protection
    routes/
      users.ts                    # /api/users
      subject.ts                  # /api/subjects
      classes.ts                  # /api/classes
      departments.ts              # /api/departments
      enrollments.ts              # /api/enrollments
      stats.ts                    # /api/stats
    db/
      index.(ts|js)               # Drizzle DB instance (imports DATABASE_URL)
      schema/
        auth.ts                   # Auth tables (user, session, account, verification)
        app.ts                    # App tables (departments, subjects, classes, enrollments)
        index.(ts|js)             # Re-exports
    config/
      arcjet.(ts|js)              # Arcjet client configuration
```


### Database schema (Drizzle ORM)

Auth schema (`src/db/schema/auth.ts`):
- `user`
  - `id` (pk, text)
  - `name` (text, required)
  - `email` (text, required)
  - `emailVerified` (boolean, required)
  - `image` (text, optional)
  - `role` (enum: `student` | `teacher` | `admin`, default `student`)
  - `imageCldPubId` (text, optional)
  - timestamps
- `session`
  - `id` (pk)
  - `userId` → `user.id`
  - `token`, `expiresAt`, `ipAddress`, `userAgent`
  - indexes on `userId`, unique on `token`
  - timestamps
- `account`
  - `id` (pk)
  - `userId` → `user.id`
  - `accountId`, `providerId`, tokens, scopes
  - unique on `(providerId, accountId)`
  - timestamps
- `verification`
  - `id` (pk)
  - `identifier`, `value`, `expiresAt`
  - index on `identifier`
  - timestamps

App schema (`src/db/schema/app.ts`):
- `departments`
  - `id` (pk, identity), `code` (unique), `name`, `description`
  - timestamps
- `subjects`
  - `id` (pk, identity), `departmentId` → `departments.id`
  - `name`, `code` (unique), `description`
  - timestamps
- `classes`
  - `id` (pk, identity)
  - `subjectId` → `subjects.id` (cascade)
  - `teacherId` → `user.id` (restrict)
  - `inviteCode` (unique), `name`, optional `banner*`, `capacity` (default 50)
  - `status` enum: `active` | `inactive` | `archived`
  - `schedules` JSONB: `Schedule[]`
  - timestamps
- `enrollments`
  - `id` (pk, identity), `studentId` → `user.id` (cascade), `classId` → `classes.id` (cascade)
  - indexes on `studentId`, `classId`, composite index on `(studentId, classId)`
  - timestamps

Relations are declared via `relations(...)` and used throughout the routes to embed related entities (e.g., class includes `subject`, `teacher`; subject includes `department`).


### Authentication
- All Better Auth endpoints are mounted under: `ALL /api/auth/*` via `toNodeHandler(auth)`.
- Default flow: email/password enabled.
- User extras on signup: `role` (default `student`), `imageCldPubId` (optional).
- The backend trusts requests from `FRONTEND_URL` origin. Ensure the frontend uses that base URL.


### Security & rate limiting
Middleware `src/middleware/security.ts` is applied globally:
- Role‑aware sliding window limits per minute:
  - admin: 20
  - teacher/student: 10
  - guest (no `req.user`): 5
- Denies obvious bots and shielded traffic with 403.
- Returns `429 Too Many Requests` when over limit. Skipped when `NODE_ENV=test`.


### API conventions
- Base URL: `http://localhost:${PORT}/api`
- Response envelope:
  - List endpoints: `{ data: T[], pagination: { page, limit, total, totalPages } }`
  - Single‑record endpoints: `{ data: T }` or composite `{ data: { ... } }`
- Pagination: query params `page` (>=1), `limit` (>=1)
- Filtering: resource‑specific (see below)
- Errors: `{ error: string, message?: string }` with appropriate HTTP status


### Routes reference
Below is a concise but complete reference of implemented routes with parameters and sample responses.

Note: All paths here are prefixed with `/api` in the running server.


#### Subjects — `/api/subjects`
- GET `/` — list subjects
  - Query: `search?` (matches name/code), `department?` (name ilike), `page?`, `limit?`
  - Response: `{ data: SubjectWithDepartment[], pagination }`
- POST `/` — create subject
  - Body: `{ departmentId: number, name: string, code: string, description?: string }`
  - Response: `{ data: { id: number } }`
- GET `/:id` — subject details + totals
  - Response: `{ data: { subject: SubjectWithDepartment, totals: { classes: number } } }`
- GET `/:id/classes` — classes in subject
  - Query: `page?`, `limit?`
  - Response: `{ data: ClassWithTeacher[], pagination }`
- GET `/:id/users` — users related to subject (teachers or students)
  - Query: `role=teacher|student`, `page?`, `limit?`
  - Response: `{ data: User[], pagination }`


#### Classes — `/api/classes`
- GET `/` — list classes
  - Query: `search?` (name/inviteCode), `subject?` (subject name ilike), `teacher?` (teacher name ilike), `page?`, `limit?`
  - Response: `{ data: ClassWithSubjectAndTeacher[], pagination }`
- POST `/` — create class
  - Body: `{ name, teacherId, subjectId, capacity, description?, status, bannerUrl?, bannerCldPubId? }`
  - Response: `{ data: { id: number } }`
- GET `/:id` — class details
  - Response: `{ data: ClassWithSubjectDepartmentTeacher }`
- GET `/:id/users` — users in a class by role
  - Query: `role=teacher|student`, `page?`, `limit?`
  - Response: `{ data: User[], pagination }`


#### Departments — `/api/departments`
- GET `/` — list departments with subject counts
  - Query: `search?` (name/code), `page?`, `limit?`
  - Response: `{ data: (Department & { totalSubjects: number })[], pagination }`
- POST `/` — create department
  - Body: `{ code: string, name: string, description?: string }`
  - Response: `{ data: { id: number } }`
- GET `/:id` — department details with totals
  - Response: `{ data: { department: Department, totals: { subjects: number, classes: number, enrolledStudents: number } } }`
- GET `/:id/subjects` — subjects in department
  - Query: `page?`, `limit?`
  - Response: `{ data: SubjectWithDepartment[], pagination }`
- GET `/:id/classes` — classes in department
  - Query: `page?`, `limit?`
  - Response: `{ data: ClassWithSubjectAndTeacher[], pagination }`
- GET `/:id/users` — users in department by role
  - Query: `role=teacher|student`, `page?`, `limit?`
  - Response: `{ data: User[], pagination }`


#### Users — `/api/users`
- GET `/` — list users
  - Query: `search?` (name/email), `role?` (`student|teacher|admin`), `page?`, `limit?`
  - Response: `{ data: User[], pagination }`
- GET `/:id` — user details
  - Response: `{ data: User }`
- GET `/:id/departments` — departments associated with a user
  - Query: `page?`, `limit?`
  - Response: `{ data: Department[], pagination }`
- GET `/:id/subjects` — subjects associated with a user
  - Query: `page?`, `limit?`
  - Response: `{ data: SubjectWithDepartment[], pagination }`
- GET `/:id/classes` — classes associated with a user (by role)
  - Query: `role=teacher|student`, `page?`, `limit?`
  - Response: `{ data: ClassWithSubjectAndTeacher[], pagination }`


#### Enrollments — `/api/enrollments`
- POST `/` — create enrollment
  - Body: `{ classId: number, studentId: string }`
  - Response: `{ data: EnrollmentWithJoins }`
- POST `/join` — join class by invite code
  - Body: `{ inviteCode: string, studentId: string }`
  - Response: `{ data: EnrollmentWithJoins }`


#### Stats — `/api/stats`
- GET `/overview` — entity counts
  - Response: `{ data: { users, teachers, admins, subjects, departments, classes } }`
- GET `/latest` — latest classes and teachers (with limit)
  - Query: `limit?` (default 5)
  - Response: `{ data: { latestClasses: ClassWithSubjectAndTeacher[], latestTeachers: User[] } }`
- GET `/charts` — aggregates for charts
  - Response: `{ data: { usersByRole, subjectsByDepartment, classesBySubject } }`


#### Auth — `/api/auth/*`
Powered by Better Auth. Common endpoints include (exact list depends on your Better Auth config/version):
- `POST /api/auth/sign-in/email` — sign in with email & password
- `POST /api/auth/sign-up/email` — sign up with email & password (supports `role`, `imageCldPubId` fields per `auth.ts`)
- `POST /api/auth/sign-out` — sign out
- `GET  /api/auth/session` — get current session

Make sure to send credentials and proper origin headers from the frontend. CORS is configured to allow `FRONTEND_URL`.


### Example requests
- List classes (first page, 10 per page):
```
curl -s "http://localhost:8000/api/classes?page=1&limit=10"
```
- Show class by id:
```
curl -s "http://localhost:8000/api/classes/1"
```
- Create department:
```
curl -s -X POST http://localhost:8000/api/departments \
  -H 'Content-Type: application/json' \
  -d '{"code":"CS","name":"Computer Science","description":"CS dept"}'
```


### Development
- Install deps: run the package manager you use (npm, pnpm, yarn)
- Ensure PostgreSQL is running and `DATABASE_URL` is set
- Run migrations/DDL as per your Drizzle setup (not included here)
- Start server:
```
npm run dev
# or
npm run start
```
The server starts on `http://localhost:${PORT}` and mounts API routes under `/api`.


### Deployment notes
- Set all environment variables in your platform (PORT, FRONTEND_URL, BETTER_AUTH_SECRET, DATABASE_URL, ARCJET_KEY)
- Ensure CORS origin matches your production frontend URL
- Use a persistent PostgreSQL instance
- Consider configuring HTTPS/Reverse proxy in front of the Node.js app


### Changelog
- 2026‑02‑09: Initial comprehensive backend README added (routes, schema, security, auth, conventions).