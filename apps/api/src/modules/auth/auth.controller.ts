import type { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema, refreshSchema, requestMagicLinkSchema, magicLoginSchema } from "./auth.schemas.js";
import * as AuthService from "./auth.service.js";

// ---------------------------------------------------------------------------
// Helper — uniform success response
// ---------------------------------------------------------------------------

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

export async function registerHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await AuthService.register(input);
    ok(res, result, 201);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

export async function loginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await AuthService.login(input);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------

export async function refreshHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const result = await AuthService.refresh(refreshToken);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me   (protected — requireAuth middleware must run first)
// ---------------------------------------------------------------------------

export async function meHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user is guaranteed by requireAuth middleware
    const user = await AuthService.getMe(req.user!.id);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export async function logoutHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    await AuthService.logout(refreshToken);
    ok(res, { message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/magic-link
// ---------------------------------------------------------------------------

export async function requestMagicLinkHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = requestMagicLinkSchema.parse(req.body);
    const result = await AuthService.requestMagicLink(input);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/magic-login
// ---------------------------------------------------------------------------

export async function magicLoginHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = magicLoginSchema.parse(req.body);
    const result = await AuthService.magicLogin(token);
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

