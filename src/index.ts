import express from "express";
import subjectsRouter from "./routes/subject";
import usersRouter from "./routes/users";
import cors from "cors";
import securityMiddleware from "./middleware/security";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import classesRouter from "./routes/classes";
import departmentsRouter from "./routes/departments.js";
import statsRouter from "./routes/stats.js";
import enrollmentsRouter from "./routes/enrollments.js";
const app = express();
const PORT = Number(process.env.PORT) || 8000;

const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
    throw new Error("FRONTEND_URL is not defined");
}
app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// Dev-only: if Origin header is missing/null on auth routes, set it to FRONTEND_URL
if (process.env.NODE_ENV !== 'production') {
    app.use((req, _res, next) => {
        if (req.path.startsWith('/api/auth/')) {
            const origin = req.headers.origin as string | undefined;
            if (!origin || origin === 'null') {
                req.headers.origin = FRONTEND_URL;
            }
        }
        next();
    });
}

app.all('/api/auth/*splat', toNodeHandler(auth));
// JSON middleware
import authMiddleware from "./middleware/auth";

// ... existing code ...

app.use(express.json());

app.use(authMiddleware);
app.use(securityMiddleware);

app.use('/api/subjects', subjectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/classes', classesRouter)
app.use("/api/departments", departmentsRouter);
app.use("/api/stats", statsRouter);
app.use("/api/enrollments", enrollmentsRouter);
// Root route
app.get("/", (_req, res) => {
    res.json({ message: "Classroom backend is up and running!" });
});

// Start server
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Server started at ${url}`);
});
