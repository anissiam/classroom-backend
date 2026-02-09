# 🏫 Classroom Backend

A robust **TypeScript/Express REST API** for managing the Classroom Management System. Built with performance and security in mind, utilizing **Drizzle ORM** for database interactions and **Arcjet** for advanced security.

## 🚀 Key Features

-   **RESTful API**: Clean and consistent endpoints under `/api/*`.
-   **Authentication**: Secure email/password login via **Better Auth**.
-   **Role-Based Access**: Granular permissions for **Admin**, **Teacher**, and **Student**.
-   **Advanced Security**: Bot protection and role-aware rate limiting powered by **Arcjet**.
-   **Data Integrity**: Type-safe database interactions with **Drizzle ORM** and **PostgreSQL**.
-   **Relationships**: Efficient data fetching with inline relational joins.

---

## 🛠️ Tech Stack

-   **Runtime**: [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/)
-   **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
-   **Auth**: [Better Auth](https://better-auth.com/)
-   **Security**: [Arcjet](https://arcjet.com/)

---

## ⚡ Getting Started

### Prerequisites

-   **Node.js**: v18 or higher
-   **PostgreSQL**: v14 or higher

### Environment Setup

Create a `.env` file in the `classroom-backend/` directory with the following variables:

```env
PORT=8000
FRONTEND_URL=http://localhost:5173
BETTER_AUTH_SECRET=your_secret_key
DATABASE_URL=postgresql://user:password@localhost:5432/classroom_db
ARCJET_KEY=ajk_...
NODE_ENV=development
```

> **Note**: In `NODE_ENV=test`, security middleware is automatically skipped.

### Installation & Running

1.  **Install Dependencies**:
    ```bash
    npm install
    # or
    yarn install
    ```

2.  **Database Migration**:
    ```bash
    npm run db:generate
    npm run db:migrate
    ```

3.  **Start Server**:
    ```bash
    npm run dev
    ```
    The server will start on `http://localhost:8000`.

---

## 🔒 Security & Middleware

### Authentication Middleware
Located in `src/middleware/auth.ts`.
-   Intercepts requests to populate `req.user` from the session.
-   Ensures downstream middleware (like rate limiting) has access to user roles.

### Arcjet Security
Located in `src/middleware/security.ts`.
-   **Bot Protection**: Denies automated bot traffic.
-   **Rate Limiting**: Sliding window limits based on user role:
    -   🛡️ **Admin**: 20 requests/min
    -   👨‍🏫 **Teacher / Student**: 10 requests/min
    -   👤 **Guest**: 60 requests/min (Increased from 5)

---

## 📂 Application Structure

```
src/
├── config/         # Configuration files (Arcjet, etc.)
├── db/             # Drizzle instance and schema definitions
│   └── schema/     # Database tables for App and Auth
├── lib/            # Shared utilities (Better Auth instance)
├── middleware/     # Custom middleware (Auth, Security)
├── routes/         # Express route handlers
│   ├── classes.ts
│   ├── departments.ts
│   ├── enrollments.ts
│   ├── stats.ts
│   ├── subject.ts
│   └── users.ts
└── index.ts        # App entry point
```

---

## 📖 API Documentation

All routes are prefixed with `/api`.

### 📚 Subjects (`/api/subjects`)
-   `GET /` - List subjects (supports pagination & search)
-   `POST /` - Create a new subject
-   `GET /:id` - Get subject details

### 🎓 Classes (`/api/classes`)
-   `GET /` - List classes (filter by subject, teacher)
-   `POST /` - Create a new class
-   `GET /:id` - Get class details & roster

### 🏢 Departments (`/api/departments`)
-   `GET /` - List departments
-   `POST /` - Create a new department
-   `GET /:id` - Get department details

### 👥 Users (`/api/users`)
-   `GET /` - List users (filter by role)
-   `GET /:id` - Get user profile

### 📝 Enrollments (`/api/enrollments`)
-   `POST /` - Enroll a student in a class
-   `POST /join` - Join via invite code

### 📊 Stats (`/api/stats`)
-   `GET /overview` - System-wide counts
-   `GET /charts` - Data for dashboard visualizations

---

## 🧪 Development

### Database Schema
Schemas are defined in `src/db/schema/`.
-   **Auth**: `user`, `session`, `account`, `verification`
-   **App**: `departments`, `subjects`, `classes`, `enrollments`

### API Response Format
Standardized JSON response envelope:

```json
{
  "data": { ... },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 📜 Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Start development server with watch mode |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Apply migrations to database |

---

*Verified Updates: 2026-02-09*