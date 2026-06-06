import jwt from "jsonwebtoken";
import type { Role } from "../generated/prisma/enums.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JwtAccessPayload {
  sub: string;   // userId
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

function getSecret(): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
}

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

// ---------------------------------------------------------------------------
// Access Token
// ---------------------------------------------------------------------------

/**
 * Sign a short-lived access token (15 minutes).
 */
export function signAccessToken(payload: Omit<JwtAccessPayload, "iat" | "exp">): string {
  return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * Verify and decode an access token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
export function verifyAccessToken(token: string): JwtAccessPayload {
  return jwt.verify(token, getSecret()) as JwtAccessPayload;
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/**
 * Sign a long-lived refresh token (7 days).
 * Only embeds the userId — the full payload is fetched from the DB on refresh.
 */
export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId }, getSecret(), { expiresIn: REFRESH_TOKEN_TTL });
}

/**
 * Verify a refresh token and return the userId (sub).
 */
export function verifyRefreshToken(token: string): { sub: string } {
  return jwt.verify(token, getSecret()) as { sub: string };
}

/**
 * Calculate the absolute expiry Date for a refresh token (7 days from now).
 */
export function refreshTokenExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}
