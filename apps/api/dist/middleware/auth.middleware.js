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
    // SSE connections (EventSource) cannot set custom headers.
    // Allow token via query parameter ?t= exclusively for SSE streaming endpoints.
    // This is safe because SSE is a GET endpoint and the token is short-lived (15 min).
    const queryToken = req.query.t || null;
    if (!authHeader?.startsWith("Bearer ") && !queryToken) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication required. Provide a Bearer token.",
            },
        });
        return;
    }
    const token = queryToken || authHeader.slice(7); // strip "Bearer " or use query token
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
