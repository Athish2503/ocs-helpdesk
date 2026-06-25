"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.magicLoginSchema = exports.requestMagicLinkSchema = exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),
    email: zod_1.z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    password: zod_1.z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});
// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ error: "Email or phone number is required" })
        .trim()
        .min(1, "Email or phone number is required"),
    password: zod_1.z.string({ error: "Password is required" }).min(1, "Password is required"),
});
// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z
        .string({ error: "Refresh token is required" })
        .min(1, "Refresh token is required"),
});
// ---------------------------------------------------------------------------
// Magic Link
// ---------------------------------------------------------------------------
exports.requestMagicLinkSchema = zod_1.z.object({
    email: zod_1.z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .optional(),
});
exports.magicLoginSchema = zod_1.z.object({
    token: zod_1.z
        .string({ error: "Magic token is required" })
        .min(1, "Magic token is required"),
});
// ---------------------------------------------------------------------------
// Forgot Password & Reset Password
// ---------------------------------------------------------------------------
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z
        .string({ error: "Reset token is required" })
        .min(1, "Reset token is required"),
    password: zod_1.z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});
