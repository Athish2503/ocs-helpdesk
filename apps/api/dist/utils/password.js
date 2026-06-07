"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const SALT_ROUNDS = 12;
/**
 * Hash a plain-text password using bcrypt.
 * Uses 12 salt rounds — a good balance between security and performance.
 */
async function hashPassword(plain) {
    return bcrypt_1.default.hash(plain, SALT_ROUNDS);
}
/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true when they match; false otherwise.
 */
async function verifyPassword(plain, hash) {
    return bcrypt_1.default.compare(plain, hash);
}
