"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kb_controller_js_1 = require("./kb.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const jwt_js_1 = require("../../utils/jwt.js");
/**
 * Checks for a Bearer token but does NOT fail the request if it is missing or invalid.
 * Used for endpoints that serve different content to guests vs logged-in agents/admins.
 */
function optionalAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        try {
            const payload = (0, jwt_js_1.verifyAccessToken)(token);
            req.user = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };
        }
        catch { }
    }
    next();
}
const router = (0, express_1.Router)();
// Public / Optional auth routes
router.get("/", optionalAuth, kb_controller_js_1.listArticlesHandler);
router.get("/:idOrSlug", optionalAuth, kb_controller_js_1.getArticleByIdOrSlugHandler);
// Management routes (restricted to admins and agents)
router.post("/", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.createArticleHandler);
router.patch("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.updateArticleHandler);
router.delete("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.deleteArticleHandler);
exports.default = router;
