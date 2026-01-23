import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 8000;

// JSON middleware
app.use(express.json());

// Root route
app.get("/", (_req, res) => {
  res.json({ message: "Classroom backend is up and running!" });
});

// Start server
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server started at ${url}`);
});
