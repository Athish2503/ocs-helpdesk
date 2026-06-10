import express from "express";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import ticketsRouter from "./modules/tickets/tickets.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
setupSwagger(app);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_, res) => {
  res.json({ success: true, message: "API running" });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tickets", ticketsRouter);

// ---------------------------------------------------------------------------
// 404 handler — must be after all routes
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

// ---------------------------------------------------------------------------
// Centralised error handler — must be last
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;