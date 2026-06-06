import express from "express";
import cors from "cors";

const app = express();

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/health", (_, res) => {
  res.json({
    success: true,
    message: "API running",
  });
});

export default app;