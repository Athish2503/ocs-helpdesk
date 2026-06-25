"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.getMe = getMe;
exports.logout = logout;
exports.logoutAll = logoutAll;
exports.requestMagicLink = requestMagicLink;
exports.magicLogin = magicLogin;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
exports.sendInvitation = sendInvitation;
exports.resendInvitation = resendInvitation;
exports.setupPassword = setupPassword;
exports.verifyInvitationToken = verifyInvitationToken;
const crypto_1 = __importDefault(require("crypto"));
const prisma_js_1 = require("../../config/prisma.js");
const password_js_1 = require("../../utils/password.js");
const jwt_js_1 = require("../../utils/jwt.js");
const email_service_js_1 = require("../../services/email.service.js");
function toPublicUser(user) {
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
function buildTokens(user) {
    const accessToken = (0, jwt_js_1.signAccessToken)({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = (0, jwt_js_1.signRefreshToken)(user.id);
    return { accessToken, refreshToken };
}
// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------
async function register(input) {
    const error = new Error("Self-registration is disabled. Customer accounts must be created in the CRM and invited.");
    error.statusCode = 400;
    throw error;
}
// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------
async function login(input) {
    // 1. Look up user by email or phone format
    const identifier = input.email.trim();
    const isEmail = identifier.includes("@");
    let user = null;
    if (isEmail) {
        user = await prisma_js_1.prisma.user.findUnique({ where: { email: identifier.toLowerCase() } });
    }
    else {
        // Search by user's direct phone number
        user = await prisma_js_1.prisma.user.findFirst({
            where: { phoneNumber: identifier }
        });
        // Fallback: search crm customer records
        if (!user) {
            const crmCustomer = await prisma_js_1.prisma.crmCustomer.findFirst({
                where: {
                    OR: [
                        { primaryPhone: identifier },
                        { secondaryPhone: identifier }
                    ]
                },
                include: { user: true }
            });
            if (crmCustomer?.user) {
                user = crmCustomer.user;
            }
        }
    }
    // Use a generic message to prevent user enumeration attacks
    const invalidCredentials = new Error("Invalid email/phone or password");
    invalidCredentials.statusCode = 401;
    if (!user)
        throw invalidCredentials;
    // 2. Verify password
    if (!user.passwordHash) {
        const err = new Error("This account is not set up. Please use your setup password link or contact an administrator.");
        err.statusCode = 401;
        throw err;
    }
    const passwordValid = await (0, password_js_1.verifyPassword)(input.password, user.passwordHash);
    if (!passwordValid)
        throw invalidCredentials;
    // 3. Ensure email is verified (only for non-customers)
    if (!user.emailVerified && user.role !== "CUSTOMER") {
        const err = new Error("Please verify your email address before logging in. Check your inbox for the verification link.");
        err.statusCode = 403;
        throw err;
    }
    // 4. Ensure account is active
    if (!user.isActive) {
        const err = new Error("Your account has been deactivated. Please contact support.");
        err.statusCode = 403;
        throw err;
    }
    // Update lastLoginAt
    await prisma_js_1.prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
    });
    // 5. Issue tokens
    const { accessToken, refreshToken } = buildTokens(user);
    // 6. Persist refresh token
    await prisma_js_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: (0, jwt_js_1.refreshTokenExpiresAt)(),
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
async function refresh(token) {
    // 1. Verify the JWT signature & expiry
    let payload;
    try {
        payload = (0, jwt_js_1.verifyRefreshToken)(token);
    }
    catch {
        const err = new Error("Invalid or expired refresh token");
        err.statusCode = 401;
        throw err;
    }
    // 2. Check the token exists in the DB (rotation check)
    const stored = await prisma_js_1.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
        const err = new Error("Refresh token not found or has expired");
        err.statusCode = 401;
        throw err;
    }
    // 3. Fetch the user
    const user = await prisma_js_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
        const err = new Error("User not found or account deactivated");
        err.statusCode = 401;
        throw err;
    }
    // 4. Issue a fresh access token (refresh token is NOT rotated here — single rotation strategy)
    const accessToken = (0, jwt_js_1.signAccessToken)({ sub: user.id, email: user.email, role: user.role });
    return { accessToken };
}
// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------
async function getMe(userId) {
    const user = await prisma_js_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    return toPublicUser(user);
}
// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------
async function logout(token) {
    // Delete the specific refresh token. Silently ignore if already gone.
    await prisma_js_1.prisma.refreshToken.deleteMany({ where: { token } });
}
// ---------------------------------------------------------------------------
// Logout all sessions
// ---------------------------------------------------------------------------
async function logoutAll(userId) {
    await prisma_js_1.prisma.refreshToken.deleteMany({ where: { userId } });
}
// ---------------------------------------------------------------------------
// Magic Link Actions
// ---------------------------------------------------------------------------
async function requestMagicLink(input) {
    // 1. Check if it's register vs login
    const existingUser = await prisma_js_1.prisma.user.findUnique({ where: { email: input.email } });
    if (!existingUser) {
        const error = new Error("Account does not exist. Public self-registration is disabled.");
        error.statusCode = 400;
        throw error;
    }
    if (existingUser && input.name) {
        const error = new Error("An account with this email already exists. Please sign in instead.");
        error.statusCode = 400;
        throw error;
    }
    // 2. Generate secure token
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    // 3. Persist the magic token
    await prisma_js_1.prisma.magicToken.create({
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
    await (0, email_service_js_1.sendMagicLinkEmail)(input.email, magicLink, input.name || existingUser?.name);
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
async function magicLogin(token) {
    // 1. Retrieve the token details
    const magicToken = await prisma_js_1.prisma.magicToken.findUnique({ where: { token } });
    if (!magicToken) {
        const err = new Error("Invalid or expired magic link token");
        err.statusCode = 401;
        throw err;
    }
    // 2. Check expiration
    if (magicToken.expiresAt < new Date()) {
        // Clean up expired token
        await prisma_js_1.prisma.magicToken.delete({ where: { id: magicToken.id } }).catch(() => { });
        const err = new Error("This magic link has expired. Please request a new one.");
        err.statusCode = 401;
        throw err;
    }
    // Consume the token immediately (single-use constraint)
    await prisma_js_1.prisma.magicToken.delete({ where: { id: magicToken.id } });
    // 3. Find or create the user
    let user = await prisma_js_1.prisma.user.findUnique({ where: { email: magicToken.email } });
    if (!user) {
        // Must be registration flow. Name should be present, otherwise fallback
        const name = magicToken.name || magicToken.email.split("@")[0] || "User";
        user = await prisma_js_1.prisma.user.create({
            data: {
                name,
                email: magicToken.email,
                passwordHash: null, // Passwordless
                role: "CUSTOMER",
                emailVerified: true,
            },
        });
    }
    else {
        // If user exists, ensure they are active
        if (!user.isActive) {
            const err = new Error("Your account has been deactivated. Please contact support.");
            err.statusCode = 403;
            throw err;
        }
        // Mark email as verified if it wasn't
        if (!user.emailVerified) {
            user = await prisma_js_1.prisma.user.update({
                where: { id: user.id },
                data: { emailVerified: true },
            });
        }
    }
    // 4. Issue tokens
    const { accessToken, refreshToken } = buildTokens(user);
    // 5. Persist refresh token
    await prisma_js_1.prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: (0, jwt_js_1.refreshTokenExpiresAt)(),
        },
    });
    return {
        user: toPublicUser(user),
        tokens: { accessToken, refreshToken },
    };
}
async function forgotPassword(input) {
    // 1. Check if user exists
    const user = await prisma_js_1.prisma.user.findUnique({ where: { email: input.email } });
    // For security, return a success message even if the user doesn't exist
    // to prevent email enumeration.
    const successResponse = {
        message: "If an account exists with this email, a password reset link has been sent.",
    };
    if (!user) {
        return successResponse;
    }
    // 2. Generate secure token
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // 3. Persist the reset token (delete any existing ones first to prevent clutter)
    await prisma_js_1.prisma.passwordResetToken.deleteMany({ where: { email: input.email } });
    await prisma_js_1.prisma.passwordResetToken.create({
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
    await (0, email_service_js_1.sendPasswordResetEmail)(input.email, resetLink, user.name);
    // In development, return the link in the response body for easier manual verification
    if (process.env["NODE_ENV"] === "development") {
        return {
            message: "If an account exists with this email, a password reset link has been sent (logged to console).",
            resetLink,
        };
    }
    return successResponse;
}
async function resetPassword(input) {
    // 1. Retrieve the token record
    const resetToken = await prisma_js_1.prisma.passwordResetToken.findUnique({
        where: { token: input.token },
    });
    if (!resetToken) {
        const err = new Error("Invalid or expired password reset token");
        err.statusCode = 400;
        throw err;
    }
    // 2. Check expiration
    if (resetToken.expiresAt < new Date()) {
        await prisma_js_1.prisma.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(() => { });
        const err = new Error("This password reset link has expired. Please request a new one.");
        err.statusCode = 400;
        throw err;
    }
    // 3. Find user
    const user = await prisma_js_1.prisma.user.findUnique({ where: { email: resetToken.email } });
    if (!user) {
        const err = new Error("User not found");
        err.statusCode = 404;
        throw err;
    }
    // 4. Hash new password & update user password + make sure email is verified
    const passwordHash = await (0, password_js_1.hashPassword)(input.password);
    await prisma_js_1.prisma.$transaction([
        prisma_js_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                emailVerified: true, // Resetting password counts as email verification if they weren't verified
            },
        }),
        // Consume the token (single use)
        prisma_js_1.prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
        // Revoke all sessions for security
        prisma_js_1.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
    return { message: "Password reset successful. You can now log in with your new password." };
}
async function sendInvitation(userId, currentUserId, generateTempPassword = false) {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: userId },
        include: { crmCustomer: true }
    });
    if (!user) {
        const error = new Error("User not found.");
        error.statusCode = 404;
        throw error;
    }
    if (!user.crmCustomerId) {
        const error = new Error("Only CRM-synced customers can be invited.");
        error.statusCode = 400;
        throw error;
    }
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    let tempPassword = undefined;
    if (generateTempPassword) {
        tempPassword = crypto_1.default.randomBytes(6).toString("hex"); // e.g. "a1b2c3"
    }
    // Create Invitation record
    const invitation = await prisma_js_1.prisma.invitation.create({
        data: {
            crmCustomerId: user.crmCustomerId,
            email: user.email,
            temporaryPassword: tempPassword,
            setupToken: token,
            expiresAt,
            sentByAdminId: currentUserId
        }
    });
    // Compose invitation setup link
    const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
    const invitationLink = `${frontendUrl}/setup-password?token=${token}`;
    // Send Email
    await (0, email_service_js_1.sendInvitationEmail)(user.email, invitationLink, tempPassword, user.name);
    // Log in AuditLog
    await prisma_js_1.prisma.auditLog.create({
        data: {
            action: "INVITATION_SENT",
            entity: "User",
            entityId: user.id,
            actorId: currentUserId,
            payload: JSON.stringify({ invitationId: invitation.id, timestamp: new Date() })
        }
    });
    return invitation;
}
async function resendInvitation(userId, currentUserId) {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id: userId },
        include: { crmCustomer: true }
    });
    if (!user || !user.crmCustomerId) {
        const error = new Error("CRM-linked Customer user not found.");
        error.statusCode = 404;
        throw error;
    }
    // Find latest invitation
    const lastInvite = await prisma_js_1.prisma.invitation.findFirst({
        where: { crmCustomerId: user.crmCustomerId },
        orderBy: { createdAt: "desc" }
    });
    if (!lastInvite) {
        const error = new Error("No previous invitation exists to resend. Please create a new invitation.");
        error.statusCode = 400;
        throw error;
    }
    const token = crypto_1.default.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const invitation = await prisma_js_1.prisma.invitation.create({
        data: {
            crmCustomerId: user.crmCustomerId,
            email: user.email,
            temporaryPassword: lastInvite.temporaryPassword,
            setupToken: token,
            expiresAt,
            sentByAdminId: currentUserId
        }
    });
    const frontendUrl = process.env["FRONTEND_URL"] || "http://localhost:3000";
    const invitationLink = `${frontendUrl}/setup-password?token=${token}`;
    await (0, email_service_js_1.sendInvitationEmail)(user.email, invitationLink, lastInvite.temporaryPassword || undefined, user.name);
    await prisma_js_1.prisma.auditLog.create({
        data: {
            action: "INVITATION_RESENT",
            entity: "User",
            entityId: user.id,
            actorId: currentUserId,
            payload: JSON.stringify({ invitationId: invitation.id, timestamp: new Date() })
        }
    });
    return invitation;
}
async function setupPassword(token, passwordString) {
    const invitation = await prisma_js_1.prisma.invitation.findUnique({
        where: { setupToken: token },
        include: { crmCustomer: true }
    });
    if (!invitation) {
        const error = new Error("Invalid invitation setup token.");
        error.statusCode = 400;
        throw error;
    }
    if (invitation.usedAt) {
        const error = new Error("This invitation setup link has already been used.");
        error.statusCode = 400;
        throw error;
    }
    if (new Date(invitation.expiresAt) < new Date()) {
        const error = new Error("This invitation setup link has expired. Please request a new one.");
        error.statusCode = 400;
        throw error;
    }
    const user = await prisma_js_1.prisma.user.findFirst({
        where: { crmCustomerId: invitation.crmCustomerId }
    });
    if (!user) {
        const error = new Error("No Helpdesk user record is linked to this CRM Customer.");
        error.statusCode = 404;
        throw error;
    }
    const passwordHash = await (0, password_js_1.hashPassword)(passwordString);
    await prisma_js_1.prisma.$transaction([
        prisma_js_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash,
                isActive: true,
                emailVerified: true
            }
        }),
        prisma_js_1.prisma.invitation.update({
            where: { id: invitation.id },
            data: { usedAt: new Date() }
        }),
        prisma_js_1.prisma.auditLog.create({
            data: {
                action: "PASSWORD_SETUP",
                entity: "User",
                entityId: user.id,
                payload: JSON.stringify({ invitationId: invitation.id, timestamp: new Date() })
            }
        })
    ]);
    return { email: invitation.email };
}
async function verifyInvitationToken(token) {
    const invitation = await prisma_js_1.prisma.invitation.findUnique({
        where: { setupToken: token },
        include: { crmCustomer: true }
    });
    if (!invitation) {
        const error = new Error("Invalid invitation setup token.");
        error.statusCode = 400;
        throw error;
    }
    if (invitation.usedAt) {
        const error = new Error("This invitation setup link has already been used.");
        error.statusCode = 400;
        throw error;
    }
    if (new Date(invitation.expiresAt) < new Date()) {
        const error = new Error("This invitation setup link has expired. Please request a new one.");
        error.statusCode = 400;
        throw error;
    }
    return { email: invitation.email, success: true };
}
