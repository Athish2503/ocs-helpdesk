"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_js_1 = __importDefault(require("./modules/auth/auth.routes.js"));
const categories_routes_js_1 = __importDefault(require("./modules/categories/categories.routes.js"));
const tickets_routes_js_1 = __importDefault(require("./modules/tickets/tickets.routes.js"));
const users_routes_js_1 = __importDefault(require("./modules/users/users.routes.js"));
const teams_routes_js_1 = __importDefault(require("./modules/teams/teams.routes.js"));
const kb_routes_js_1 = __importDefault(require("./modules/kb/kb.routes.js"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const swagger_js_1 = require("./config/swagger.js");
const app = (0, express_1.default)();
// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use("/uploads", express_1.default.static("uploads"));
// Swagger documentation
(0, swagger_js_1.setupSwagger)(app);
// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/health", (_, res) => {
    res.json({ success: true, message: "API running" });
});
// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use("/api/auth", auth_routes_js_1.default);
app.use("/api/categories", categories_routes_js_1.default);
app.use("/api/tickets", tickets_routes_js_1.default);
app.use("/api/users", users_routes_js_1.default);
app.use("/api/teams", teams_routes_js_1.default);
app.use("/api/kb", kb_routes_js_1.default);
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
app.use(error_middleware_js_1.errorHandler);
exports.default = app;
