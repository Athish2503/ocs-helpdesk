import { registerSchema, loginSchema, refreshSchema, requestMagicLinkSchema, magicLoginSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schemas.js";
import * as AuthService from "./auth.service.js";
// ---------------------------------------------------------------------------
// Helper — uniform success response
// ---------------------------------------------------------------------------
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
export async function registerHandler(req, res, next) {
    try {
        const input = registerSchema.parse(req.body);
        const result = await AuthService.register(input);
        ok(res, result, 201);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function loginHandler(req, res, next) {
    try {
        const input = loginSchema.parse(req.body);
        const result = await AuthService.login(input);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
export async function refreshHandler(req, res, next) {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        const result = await AuthService.refresh(refreshToken);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// GET /api/auth/me   (protected — requireAuth middleware must run first)
// ---------------------------------------------------------------------------
export async function meHandler(req, res, next) {
    try {
        // req.user is guaranteed by requireAuth middleware
        const user = await AuthService.getMe(req.user.id);
        ok(res, { user });
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
export async function logoutHandler(req, res, next) {
    try {
        const { refreshToken } = refreshSchema.parse(req.body);
        await AuthService.logout(refreshToken);
        ok(res, { message: "Logged out successfully" });
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/magic-link
// ---------------------------------------------------------------------------
export async function requestMagicLinkHandler(req, res, next) {
    try {
        const input = requestMagicLinkSchema.parse(req.body);
        const result = await AuthService.requestMagicLink(input);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/magic-login
// ---------------------------------------------------------------------------
export async function magicLoginHandler(req, res, next) {
    try {
        const { token } = magicLoginSchema.parse(req.body);
        const result = await AuthService.magicLogin(token);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/forgot-password
// ---------------------------------------------------------------------------
export async function forgotPasswordHandler(req, res, next) {
    try {
        const input = forgotPasswordSchema.parse(req.body);
        const result = await AuthService.forgotPassword(input);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
// ---------------------------------------------------------------------------
// POST /api/auth/reset-password
// ---------------------------------------------------------------------------
export async function resetPasswordHandler(req, res, next) {
    try {
        const input = resetPasswordSchema.parse(req.body);
        const result = await AuthService.resetPassword(input);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
export async function setupPasswordHandler(req, res, next) {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            res.status(400).json({ success: false, error: "Missing token or password" });
            return;
        }
        const result = await AuthService.setupPassword(token, password);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
export async function verifyInvitationTokenHandler(req, res, next) {
    try {
        const token = req.query.token;
        if (!token) {
            res.status(400).json({ success: false, error: "Missing token" });
            return;
        }
        const result = await AuthService.verifyInvitationToken(token);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
