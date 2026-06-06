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
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    ),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const loginSchema = z.object({
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),

  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

export const refreshSchema = z.object({
  refreshToken: z
    .string({ error: "Refresh token is required" })
    .min(1, "Refresh token is required"),
});

export type RefreshInput = z.infer<typeof refreshSchema>;
