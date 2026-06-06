import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import "../modules/auth/auth.types.js"; // ensure Express.Request augmentation is loaded

/**
 * requireAuth — verifies the JWT access token in the Authorization header.
 *
 * On success, attaches the decoded user to `req.user` and calls next().
 * On failure, responds with 401 Unauthorized.
 *
 * Usage:
 *   router.get("/protected", requireAuth, handler)
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
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
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_INVALID",
        message: "Access token is invalid or has expired.",
      },
    });
  }
}
