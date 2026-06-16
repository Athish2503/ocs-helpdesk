"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kb_controller_js_1 = require("./kb.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const jwt_js_1 = require("../../utils/jwt.js");
const uploadMiddleware_js_1 = require("../../middleware/uploadMiddleware.js");
const publicSecurity_js_1 = require("../../middleware/publicSecurity.js");
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
// --- CATEGORY ROUTING ---
router.get("/categories", optionalAuth, kb_controller_js_1.listCategoriesHandler);
router.post("/categories", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.createCategoryHandler);
router.patch("/categories/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.updateCategoryHandler);
router.delete("/categories/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.deleteCategoryHandler);
// --- TAG ROUTING ---
router.get("/tags", optionalAuth, kb_controller_js_1.listTagsHandler);
// --- PUBLIC ROUTING ---
router.get("/public/sitemap.xml", kb_controller_js_1.getPublicSitemapHandler);
router.get("/public/articles/:slug", (0, publicSecurity_js_1.publicSecurityMiddleware)(), publicSecurity_js_1.logPublicAccess, publicSecurity_js_1.validateSlug, kb_controller_js_1.getPublicArticleBySlugHandler);
router.post("/public/articles/:articleId/read", (0, publicSecurity_js_1.publicSecurityMiddleware)(), kb_controller_js_1.recordArticleReadHandler);
// --- ARTICLE ROUTING ---
router.get("/", optionalAuth, kb_controller_js_1.listArticlesHandler);
router.get("/:idOrSlug", optionalAuth, kb_controller_js_1.getArticleByIdOrSlugHandler);
router.post("/", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.createArticleHandler);
router.patch("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.updateArticleHandler);
router.delete("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.deleteArticleHandler);
// --- VERSION ROUTING ---
router.get("/articles/:articleId/versions", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.listVersionsHandler);
// --- ANALYTICS ROUTING ---
router.get("/articles/:articleId/analytics", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.getArticleAnalyticsHandler);
// --- SEO MANAGEMENT ROUTING ---
router.get("/articles/:articleId/seo", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.getArticleSEOHandler);
router.patch("/articles/:articleId/seo", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.updateArticleSEOHandler);
// --- SECURITY INCIDENTS ROUTING ---
router.get("/security/events", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN"), kb_controller_js_1.listSecurityEventsHandler);
// --- ATTACHMENTS (IMAGE FILE ROUTING) ---
router.post("/articles/:articleId/attachments", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), uploadMiddleware_js_1.uploadKBImage.single("file"), kb_controller_js_1.uploadKBImageHandler);
router.get("/articles/:articleId/attachments", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.listAttachmentsHandler);
router.delete("/attachments/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.deleteAttachmentHandler);
router.post("/articles/:articleId/attachments/:attachmentId/featured", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.setFeaturedImageHandler);
router.post("/articles/:articleId/attachments/reorder", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.reorderAttachmentsHandler);
// --- ADAPTED TICKET PROMOTION ROUTING ---
router.post("/tickets/:ticketId/promote", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), kb_controller_js_1.promoteTicketToKbHandler);
exports.default = router;
