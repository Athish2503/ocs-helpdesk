"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_js_1 = require("../utils/jwt.js");
require("../modules/auth/auth.types.js"); // ensure Express.Request augmentation is loaded
/**
 * requireAuth — verifies the JWT access token in the Authorization header.
 *
 * On success, attaches the decoded user to `req.user` and calls next().
 * On failure, responds with 401 Unauthorized.
 *
 * Usage:
 *   router.get("/protected", requireAuth, handler)
 */
function requireAuth(req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required. Provide a Bearer token.",
            },
        });
        return;
    }
    const token = authHeader.slice(7); // strip "Bearer "
    try {
        const payload = (0, jwt_js_1.verifyAccessToken)(token);
        req.user = {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: {
                code: "TOKEN_INVALID",
                message: "Access token is invalid or has expired.",
            },
        });
    }
}
