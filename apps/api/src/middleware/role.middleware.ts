import type { Request, Response, NextFunction } from "express";
import type { Role } from "../generated/prisma/enums.js";

/**
 * requireRole — authorisation middleware factory.
 * Must be used AFTER requireAuth (which populates req.user).
 *
 * @param roles - One or more roles that are allowed to access the route.
 *
 * Usage:
 *   router.get("/admin", requireAuth, requireRole("ADMIN"), handler)
 *   router.get("/staff", requireAuth, requireRole("ADMIN", "AGENT"), handler)
 */
export function requireRole(...roles: Role[]) {
  return function roleGuard(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      // Should never happen if requireAuth is applied first — defensive check
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Requires one of: ${roles.join(", ")}.`,
        },
      });
      return;
    }

    next();
  };
}
