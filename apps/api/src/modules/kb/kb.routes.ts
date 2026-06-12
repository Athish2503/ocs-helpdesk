import { Router } from "express";
import {
  listArticlesHandler,
  getArticleByIdOrSlugHandler,
  createArticleHandler,
  updateArticleHandler,
  deleteArticleHandler,
} from "./kb.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";
import { verifyAccessToken } from "../../utils/jwt.js";
import type { Request, Response, NextFunction } from "express";

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

// Public / Optional auth routes
router.get("/", optionalAuth, listArticlesHandler);
router.get("/:idOrSlug", optionalAuth, getArticleByIdOrSlugHandler);

// Management routes (restricted to admins and agents)
router.post("/", requireAuth, requireRole("ADMIN", "AGENT"), createArticleHandler);
router.patch("/:id", requireAuth, requireRole("ADMIN", "AGENT"), updateArticleHandler);
router.delete("/:id", requireAuth, requireRole("ADMIN", "AGENT"), deleteArticleHandler);

export default router;
