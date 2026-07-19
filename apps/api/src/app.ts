import express from "express";
import cors from "cors";
import authRouter from "./modules/auth/auth.routes.js";
import categoriesRouter from "./modules/categories/categories.routes.js";
import ticketsRouter from "./modules/tickets/tickets.routes.js";
import usersRouter from "./modules/users/users.routes.js";
import teamsRouter from "./modules/teams/teams.routes.js";
import kbRouter from "./modules/kb/kb.routes.js";
import syncRouter from "./modules/sync/sync.routes.js";
import integrationsRouter from "./modules/integrations/integrations.routes.js";
import slaRouter from "./modules/sla/sla.router.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

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
app.use("/api/sync", syncRouter);
app.use("/api/integrations", integrationsRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/users", usersRouter);
app.use("/api/teams", teamsRouter);
app.use("/api/kb", kbRouter);
app.use("/api/sla", slaRouter);

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