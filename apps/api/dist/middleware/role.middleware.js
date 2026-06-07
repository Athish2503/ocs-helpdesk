"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
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
