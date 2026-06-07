"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.refreshTokenExpiresAt = refreshTokenExpiresAt;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
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
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, getSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}
/**
 * Verify and decode an access token.
 * Throws JsonWebTokenError / TokenExpiredError on failure.
 */
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, getSecret());
}
// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------
/**
 * Sign a long-lived refresh token (7 days).
 * Embeds the userId (sub) and a unique jti identifier to prevent generation collisions.
 */
function signRefreshToken(userId) {
    const jti = crypto_1.default.randomUUID();
    return jsonwebtoken_1.default.sign({ sub: userId, jti }, getSecret(), { expiresIn: REFRESH_TOKEN_TTL });
}
/**
 * Verify a refresh token and return the userId (sub).
 */
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, getSecret());
}
/**
 * Calculate the absolute expiry Date for a refresh token (7 days from now).
 */
function refreshTokenExpiresAt() {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
}
