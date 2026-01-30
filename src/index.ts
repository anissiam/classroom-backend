import express from "express";
import subjectsRouter from "./routes/subject";
import cors from "cors";
import securityMiddleware from "./middleware/security";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";

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
app.all('/api/auth/*splat', toNodeHandler(auth));
// JSON middleware
app.use(express.json());

app.use(securityMiddleware)

app.use('/api/subjects', subjectsRouter)

// Root route
app.get("/", (_req, res) => {
    res.json({message: "Classroom backend is up and running!"});
});

// Start server
app.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Server started at ${url}`);
});
