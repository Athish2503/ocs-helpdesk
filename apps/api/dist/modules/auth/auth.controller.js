"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHandler = registerHandler;
exports.loginHandler = loginHandler;
exports.refreshHandler = refreshHandler;
exports.meHandler = meHandler;
exports.logoutHandler = logoutHandler;
exports.requestMagicLinkHandler = requestMagicLinkHandler;
exports.magicLoginHandler = magicLoginHandler;
exports.forgotPasswordHandler = forgotPasswordHandler;
exports.resetPasswordHandler = resetPasswordHandler;
exports.setupPasswordHandler = setupPasswordHandler;
exports.verifyInvitationTokenHandler = verifyInvitationTokenHandler;
const auth_schemas_js_1 = require("./auth.schemas.js");
const AuthService = __importStar(require("./auth.service.js"));
// ---------------------------------------------------------------------------
// Helper — uniform success response
// ---------------------------------------------------------------------------
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
async function registerHandler(req, res, next) {
    try {
        const input = auth_schemas_js_1.registerSchema.parse(req.body);
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
async function loginHandler(req, res, next) {
    try {
        const input = auth_schemas_js_1.loginSchema.parse(req.body);
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
async function refreshHandler(req, res, next) {
    try {
        const { refreshToken } = auth_schemas_js_1.refreshSchema.parse(req.body);
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
async function meHandler(req, res, next) {
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
async function logoutHandler(req, res, next) {
    try {
        const { refreshToken } = auth_schemas_js_1.refreshSchema.parse(req.body);
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
async function requestMagicLinkHandler(req, res, next) {
    try {
        const input = auth_schemas_js_1.requestMagicLinkSchema.parse(req.body);
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
async function magicLoginHandler(req, res, next) {
    try {
        const { token } = auth_schemas_js_1.magicLoginSchema.parse(req.body);
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
async function forgotPasswordHandler(req, res, next) {
    try {
        const input = auth_schemas_js_1.forgotPasswordSchema.parse(req.body);
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
async function resetPasswordHandler(req, res, next) {
    try {
        const input = auth_schemas_js_1.resetPasswordSchema.parse(req.body);
        const result = await AuthService.resetPassword(input);
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
async function setupPasswordHandler(req, res, next) {
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
async function verifyInvitationTokenHandler(req, res, next) {
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
