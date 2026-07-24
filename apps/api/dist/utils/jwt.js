import jwt from "jsonwebtoken";
import crypto from "crypto";
// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
function getSecret() {
    const secret = process.env["JWT_SECRET"];
    if (!secret)
        throw new Error("JWT_SECRET environment variable is not set");
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
export function signAccessToken(payload) {
    return jwt.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}
/**
 * Verify and decode an access token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
export function verifyAccessToken(token) {
    return jwt.verify(token, getSecret());
}
// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------
/**
 * Sign a long-lived refresh token (7 days).
 * Embeds the userId (sub) and a unique jti identifier to prevent generation collisions.
 */
export function signRefreshToken(userId) {
    const jti = crypto.randomUUID();
    return jwt.sign({ sub: userId, jti }, getSecret(), { expiresIn: REFRESH_TOKEN_TTL });
}
/**
 * Verify a refresh token and return the userId (sub).
 */
export function verifyRefreshToken(token) {
    return jwt.verify(token, getSecret());
}
/**
 * Calculate the absolute expiry Date for a refresh token (7 days from now).
 */
export function refreshTokenExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}
