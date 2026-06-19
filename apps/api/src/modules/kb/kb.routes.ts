import { Router } from "express";
import {
  listArticlesHandler,
  getArticleByIdOrSlugHandler,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
  listTagsHandler,
  listVersionsHandler,
  recordArticleReadHandler,
  getArticleAnalyticsHandler,
  getArticleSEOHandler,
  updateArticleSEOHandler,
  listSecurityEventsHandler,
  uploadKBImageHandler,
  listAttachmentsHandler,
  deleteAttachmentHandler,
  setFeaturedImageHandler,
  reorderAttachmentsHandler,
  promoteTicketToKbHandler,
  getPublicSitemapHandler,
  getPublicArticleBySlugHandler,
  getArticleSuggestionsHandler,
} from "./kb.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { verifyAccessToken } from "../../utils/jwt.js";
import type { Request, Response, NextFunction } from "express";
import { uploadKBImage } from "../../middleware/uploadMiddleware.js";
import {
  publicSecurityMiddleware,
  logPublicAccess,
  validateSlug,
} from "../../middleware/publicSecurity.js";

/**
 * Checks for a Bearer token but does NOT fail the request if it is missing or invalid.
 * Used for endpoints that serve different content to guests vs logged-in agents/admins.
 */
function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const payload = verifyAccessToken(token);
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      };
    } catch {}
  }
  next();
}

const router = Router();

// --- CATEGORY ROUTING ---
router.get("/categories", optionalAuth, listCategoriesHandler);
router.post("/categories", requireAuth, requireRole("ADMIN", "AGENT"), createCategoryHandler);
router.patch("/categories/:id", requireAuth, requireRole("ADMIN", "AGENT"), updateCategoryHandler);
router.delete("/categories/:id", requireAuth, requireRole("ADMIN", "AGENT"), deleteCategoryHandler);

// --- TAG ROUTING ---
router.get("/tags", optionalAuth, listTagsHandler);

// --- PUBLIC ROUTING ---
router.get("/public/sitemap.xml", getPublicSitemapHandler);
router.get(
  "/public/articles/:slug",
  publicSecurityMiddleware(),
  logPublicAccess,
  validateSlug,
  getPublicArticleBySlugHandler
);
router.post(
  "/public/articles/:articleId/read",
  publicSecurityMiddleware(),
  recordArticleReadHandler
);

// --- ARTICLE ROUTING ---
router.get("/", optionalAuth, listArticlesHandler);
router.get("/suggest", optionalAuth, getArticleSuggestionsHandler);
router.get("/:idOrSlug", optionalAuth, getArticleByIdOrSlugHandler);
router.post("/", requireAuth, requireRole("ADMIN", "AGENT"), createArticleHandler);
router.patch("/:id", requireAuth, requireRole("ADMIN", "AGENT"), updateArticleHandler);
router.delete("/:id", requireAuth, requireRole("ADMIN", "AGENT"), deleteArticleHandler);

// --- VERSION ROUTING ---
router.get("/articles/:articleId/versions", requireAuth, requireRole("ADMIN", "AGENT"), listVersionsHandler);

// --- ANALYTICS ROUTING ---
router.get("/articles/:articleId/analytics", requireAuth, requireRole("ADMIN", "AGENT"), getArticleAnalyticsHandler);

// --- SEO MANAGEMENT ROUTING ---
router.get("/articles/:articleId/seo", requireAuth, requireRole("ADMIN", "AGENT"), getArticleSEOHandler);
router.patch("/articles/:articleId/seo", requireAuth, requireRole("ADMIN", "AGENT"), updateArticleSEOHandler);

// --- SECURITY INCIDENTS ROUTING ---
router.get("/security/events", requireAuth, requireRole("ADMIN"), listSecurityEventsHandler);

// --- ATTACHMENTS (IMAGE FILE ROUTING) ---
router.post(
  "/articles/:articleId/attachments",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  uploadKBImage.single("file"),
  uploadKBImageHandler
);
router.get("/articles/:articleId/attachments", requireAuth, requireRole("ADMIN", "AGENT"), listAttachmentsHandler);
router.delete("/attachments/:id", requireAuth, requireRole("ADMIN", "AGENT"), deleteAttachmentHandler);
router.post(
  "/articles/:articleId/attachments/:attachmentId/featured",
  requireAuth,
  requireRole("ADMIN", "AGENT"),
  setFeaturedImageHandler
);
router.post("/articles/:articleId/attachments/reorder", requireAuth, requireRole("ADMIN", "AGENT"), reorderAttachmentsHandler);

// --- ADAPTED TICKET PROMOTION ROUTING ---
router.post("/tickets/:ticketId/promote", requireAuth, requireRole("ADMIN", "AGENT"), promoteTicketToKbHandler);

export default router;
