import { z } from "zod";
// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
export const registerSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters"),
    email: z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});
// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
    email: z
        .string({ error: "Email or phone number is required" })
        .trim()
        .min(1, "Email or phone number is required"),
    password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});
// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------
export const refreshSchema = z.object({
    refreshToken: z
        .string({ error: "Refresh token is required" })
        .min(1, "Refresh token is required"),
});
// ---------------------------------------------------------------------------
// Magic Link
// ---------------------------------------------------------------------------
export const requestMagicLinkSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .optional(),
});
export const magicLoginSchema = z.object({
    token: z
        .string({ error: "Magic token is required" })
        .min(1, "Magic token is required"),
});
// ---------------------------------------------------------------------------
// Forgot Password & Reset Password
// ---------------------------------------------------------------------------
export const forgotPasswordSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Please provide a valid email address"),
});
export const resetPasswordSchema = z.object({
    token: z
        .string({ error: "Reset token is required" })
        .min(1, "Reset token is required"),
    password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(128, "Password must be at most 128 characters")
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});
