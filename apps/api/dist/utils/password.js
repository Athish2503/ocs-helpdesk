import bcrypt from "bcrypt";
const SALT_ROUNDS = 12;
/**
 * Hash a plain-text password using bcrypt.
 * Uses 12 salt rounds — a good balance between security and performance.
 */
export async function hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
}
/**
 * Compare a plain-text password against a stored bcrypt hash.
 * Returns true when they match; false otherwise.
 */
export async function verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}
