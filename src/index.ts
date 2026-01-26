import express from "express";
import subjectsRouter from "./routes/subject";
import cors from "cors";

const app = express();
const PORT = Number(process.env.PORT) || 8000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

// JSON middleware
app.use(express.json());

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
