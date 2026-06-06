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
import type { RegisterInput, LoginInput } from "./auth.schemas.js";

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

export async function register(input: RegisterInput): Promise<AuthResponse> {
  // 1. Check for existing account
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const error = new Error("An account with this email already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  // 2. Hash password
  const passwordHash = await hashPassword(input.password);

  // 3. Create user
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: "CUSTOMER",
    },
  });

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
  const passwordValid = await verifyPassword(input.password, user.passwordHash);
  if (!passwordValid) throw invalidCredentials;

  // 3. Ensure account is active
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
