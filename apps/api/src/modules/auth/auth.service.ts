import crypto from "crypto";
import { prisma } from "../../config/prisma.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
} from "../../utils/jwt.js";
import type { Role } from "../../generated/prisma/enums.js";
import type { AuthResponse, UserPublic } from "./auth.types.js";
import type { RegisterInput, LoginInput, RequestMagicLinkInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schemas.js";
import { sendMagicLinkEmail, sendPasswordResetEmail } from "../../services/email.service.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
};

function toPublicUser(user: UserRow): UserPublic {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

function buildTokens(user: { id: string; email: string; role: Role }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken(user.id);
  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

export async function register(input: RegisterInput): Promise<{ message: string; magicLink?: string }> {
  // 1. Check for existing account
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("An account with this email already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  // 2. Hash password
  const passwordHash = await hashPassword(input.password);

  // 3. Create user (emailVerified defaults to false)
  await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "CUSTOMER",
      emailVerified: false,
    },
  });

  // 4. Generate secure token for email verification
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 5. Persist the magic token
  await prisma.magicToken.create({
    data: {
      token,
      email: input.email,
      name: null,
      expiresAt,
    },
  });

  // 6. Compose verification URL pointing to the frontend callback page
  const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
  const magicLink = `${frontendUrl}/auth/callback?token=${token}`;

  // 7. Send verification email
  await sendMagicLinkEmail(input.email, magicLink, input.name);

  // In development, return the link in the response body for easier manual verification
  if (process.env["NODE_ENV"] === "development") {
    return {
      message: "Registration successful. Verification email sent (logged to console).",
      magicLink,
    };
  }

  return {
    message: "Registration successful. Please check your inbox to verify your email.",
  };
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export async function login(input: LoginInput): Promise<AuthResponse> {
  // 1. Look up user
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Use a generic message to prevent user enumeration attacks
  const invalidCredentials = new Error("Invalid email or password") as Error & { statusCode: number };
  invalidCredentials.statusCode = 401;

  if (!user) throw invalidCredentials;

  // 2. Verify password
  if (!user.passwordHash) {
    const err = new Error("This account is passwordless. Please sign in using Magic Link.") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) throw invalidCredentials;

  // 3. Ensure email is verified
  if (!user.emailVerified) {
    const err = new Error("Please verify your email address before logging in. Check your inbox for the verification link.") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  // 4. Ensure account is active
  if (!user.isActive) {
    const err = new Error("Your account has been deactivated. Please contact support.") as Error & { statusCode: number };
    err.statusCode = 403;
    throw err;
  }

  // 4. Issue tokens
  const { accessToken, refreshToken } = buildTokens(user);

  // 5. Persist refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return {
    user: toPublicUser(user),
    tokens: { accessToken, refreshToken },
  };
}

// ---------------------------------------------------------------------------
// Refresh
// ---------------------------------------------------------------------------

export async function refresh(token: string): Promise<{ accessToken: string }> {
  // 1. Verify the JWT signature & expiry
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    const err = new Error("Invalid or expired refresh token") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // 2. Check the token exists in the DB (rotation check)
  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    const err = new Error("Refresh token not found or has expired") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // 3. Fetch the user
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) {
    const err = new Error("User not found or account deactivated") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // 4. Issue a fresh access token (refresh token is NOT rotated here — single rotation strategy)
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });

  return { accessToken };
}

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------

export async function getMe(userId: string): Promise<UserPublic> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }
  return toPublicUser(user);
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logout(token: string): Promise<void> {
  // Delete the specific refresh token. Silently ignore if already gone.
  await prisma.refreshToken.deleteMany({ where: { token } });
}

// ---------------------------------------------------------------------------
// Logout all sessions
// ---------------------------------------------------------------------------

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ---------------------------------------------------------------------------
// Magic Link Actions
// ---------------------------------------------------------------------------

export async function requestMagicLink(
  input: RequestMagicLinkInput
): Promise<{ message: string; magicLink?: string }> {
  // 1. Check if it's register vs login
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });

  // If registering, name is required
  if (!existingUser && !input.name) {
    const error = new Error("Account does not exist. Please register by providing your name.") as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  if (existingUser && input.name) {
    const error = new Error("An account with this email already exists. Please sign in instead.") as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  // 2. Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // 3. Persist the magic token
  await prisma.magicToken.create({
    data: {
      token,
      email: input.email,
      name: input.name || null,
      expiresAt,
    },
  });

  // 4. Compose frontend callback url
  const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
  const magicLink = `${frontendUrl}/auth/callback?token=${token}`;

  // 5. Send email
  await sendMagicLinkEmail(input.email, magicLink, input.name || existingUser?.name);

  // In development, return the link in the response body for easier manual verification
  if (process.env["NODE_ENV"] === "development") {
    return {
      message: "Magic link sent successfully (logged to console)",
      magicLink,
    };
  }

  return {
    message: "Magic link sent successfully. Please check your inbox.",
  };
}

export async function magicLogin(token: string): Promise<AuthResponse> {
  // 1. Retrieve the token details
  const magicToken = await prisma.magicToken.findUnique({ where: { token } });
  if (!magicToken) {
    const err = new Error("Invalid or expired magic link token") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // 2. Check expiration
  if (magicToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.magicToken.delete({ where: { id: magicToken.id } }).catch(() => {});
    const err = new Error("This magic link has expired. Please request a new one.") as Error & { statusCode: number };
    err.statusCode = 401;
    throw err;
  }

  // Consume the token immediately (single-use constraint)
  await prisma.magicToken.delete({ where: { id: magicToken.id } });

  // 3. Find or create the user
  let user = await prisma.user.findUnique({ where: { email: magicToken.email } });

  if (!user) {
    // Must be registration flow. Name should be present, otherwise fallback
    const name = magicToken.name || magicToken.email.split("@")[0] || "User";
    user = await prisma.user.create({
      data: {
        name,
        email: magicToken.email,
        passwordHash: null, // Passwordless
        role: "CUSTOMER",
        emailVerified: true,
      },
    });
  } else {
    // If user exists, ensure they are active
    if (!user.isActive) {
      const err = new Error("Your account has been deactivated. Please contact support.") as Error & { statusCode: number };
      err.statusCode = 403;
      throw err;
    }

    // Mark email as verified if it wasn't
    if (!user.emailVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }
  }

  // 4. Issue tokens
  const { accessToken, refreshToken } = buildTokens(user);

  // 5. Persist refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshTokenExpiresAt(),
    },
  });

  return {
    user: toPublicUser(user),
    tokens: { accessToken, refreshToken },
  };
}

export async function forgotPassword(
  input: ForgotPasswordInput
): Promise<{ message: string; resetLink?: string }> {
  // 1. Check if user exists
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // For security, return a success message even if the user doesn't exist
  // to prevent email enumeration.
  const successResponse = {
    message: "If an account exists with this email, a password reset link has been sent.",
  };

  if (!user) {
    return successResponse;
  }

  // 2. Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // 3. Persist the reset token (delete any existing ones first to prevent clutter)
  await prisma.passwordResetToken.deleteMany({ where: { email: input.email } });
  await prisma.passwordResetToken.create({
    data: {
      token,
      email: input.email,
      expiresAt,
    },
  });

  // 4. Compose reset link
  const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  // 5. Send email
  await sendPasswordResetEmail(input.email, resetLink, user.name);

  // In development, return the link in the response body for easier manual verification
  if (process.env["NODE_ENV"] === "development") {
    return {
      message: "If an account exists with this email, a password reset link has been sent (logged to console).",
      resetLink,
    };
  }

  return successResponse;
}

export async function resetPassword(
  input: ResetPasswordInput
): Promise<{ message: string }> {
  // 1. Retrieve the token record
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
  });

  if (!resetToken) {
    const err = new Error("Invalid or expired password reset token") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // 2. Check expiration
  if (resetToken.expiresAt < new Date()) {
    await prisma.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(() => {});
    const err = new Error("This password reset link has expired. Please request a new one.") as Error & { statusCode: number };
    err.statusCode = 400;
    throw err;
  }

  // 3. Find user
  const user = await prisma.user.findUnique({ where: { email: resetToken.email } });
  if (!user) {
    const err = new Error("User not found") as Error & { statusCode: number };
    err.statusCode = 404;
    throw err;
  }

  // 4. Hash new password & update user password + make sure email is verified
  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        emailVerified: true, // Resetting password counts as email verification if they weren't verified
      },
    }),
    // Consume the token (single use)
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
    // Revoke all sessions for security
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ]);

  return { message: "Password reset successful. You can now log in with your new password." };
}

