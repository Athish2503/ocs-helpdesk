import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import type { Role } from "../types/role.js";

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

export const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    "view_tickets",
    "reply_tickets",
    "assign_tickets",
    "manage_teams",
    "manage_kb",
    "adjust_credits",
    "manage_categories_rules",
    "manage_permissions",
  ],
  SUPERVISOR: ["view_tickets", "reply_tickets", "assign_tickets", "manage_kb", "manage_teams"],
  SUPPORT_L2: ["view_tickets", "reply_tickets", "assign_tickets", "manage_kb"],
  SUPPORT_L1: ["view_tickets", "reply_tickets", "assign_tickets"],
  AGENT: ["view_tickets", "reply_tickets"],
  BILLING: ["view_tickets", "reply_tickets", "adjust_credits"],
  CUSTOMER: ["view_tickets", "reply_tickets"],
};

/**
 * requirePermission — dynamic permission authorization middleware.
 * Must be used AFTER requireAuth.
 */
export function requirePermission(permission: string) {
  return async function permissionGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      });
      return;
    }

    try {
      const rolePerm = await prisma.rolePermission.findUnique({
        where: { role: req.user.role },
      });

      const userPermissions = rolePerm?.permissions ?? DEFAULT_PERMISSIONS[req.user.role] ?? [];

      if (!userPermissions.includes(permission)) {
        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: `Access denied. Requires permission: ${permission}`,
          },
        });
        return;
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

