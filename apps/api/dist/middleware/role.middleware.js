"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PERMISSIONS = void 0;
exports.requireRole = requireRole;
exports.requirePermission = requirePermission;
const prisma_js_1 = require("../config/prisma.js");
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
function requireRole(...roles) {
    return function roleGuard(req, res, next) {
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
exports.DEFAULT_PERMISSIONS = {
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
function requirePermission(permission) {
    return async function permissionGuard(req, res, next) {
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
            const rolePerm = await prisma_js_1.prisma.rolePermission.findUnique({
                where: { role: req.user.role },
            });
            const userPermissions = rolePerm?.permissions ?? exports.DEFAULT_PERMISSIONS[req.user.role] ?? [];
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
        }
        catch (err) {
            next(err);
        }
    };
}
