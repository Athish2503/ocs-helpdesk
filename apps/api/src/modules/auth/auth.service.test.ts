import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies before importing the service
vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    crmCustomer: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
    },
    magicToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    invitation: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    rolePermission: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((fns) => Promise.all(fns)),
  },
}));

vi.mock("../../utils/password.js", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_pwd_123"),
  verifyPassword: vi.fn().mockImplementation(async (pwd, hash) => pwd === "valid_password" && hash === "hashed_pwd_123"),
}));

vi.mock("../../utils/jwt.js", () => ({
  signAccessToken: vi.fn().mockReturnValue("mock_access_token"),
  signRefreshToken: vi.fn().mockReturnValue("mock_refresh_token"),
  verifyRefreshToken: vi.fn().mockReturnValue({ sub: "user_123" }),
  refreshTokenExpiresAt: vi.fn().mockReturnValue(new Date(Date.now() + 7 * 86400000)),
}));

vi.mock("../../services/email.service.js", () => ({
  sendMagicLinkEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendInvitationEmail: vi.fn().mockResolvedValue(true),
}));

import { prisma } from "../../config/prisma.js";
import {
  register,
  login,
  refresh,
  getMe,
  logout,
  logoutAll,
  requestMagicLink,
  magicLogin,
  forgotPassword,
  resetPassword,
  sendInvitation,
  setupPassword,
  verifyInvitationToken,
} from "./auth.service.js";

describe("Auth Module - Business Logic & Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register()", () => {
    it("should throw 400 because self-registration is disabled", async () => {
      await expect(register({ name: "John", email: "john@example.com", password: "pwd" })).rejects.toThrow(
        "Self-registration is disabled"
      );
    });
  });

  describe("login()", () => {
    it("should fail with 401 when user is not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (prisma.crmCustomer.findFirst as any).mockResolvedValue(null);

      await expect(login({ email: "nonexistent@example.com", password: "password" })).rejects.toMatchObject({
        statusCode: 401,
        message: "Invalid email/phone or password",
      });
    });

    it("should fail with 401 if user has no password set up", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        passwordHash: null,
      });

      await expect(login({ email: "user@example.com", password: "password" })).rejects.toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("account is not set up"),
      });
    });

    it("should fail with 401 if password does not match", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        passwordHash: "hashed_pwd_123",
      });

      await expect(login({ email: "user@example.com", password: "wrong_password" })).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("should fail with 403 if account is deactivated", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        passwordHash: "hashed_pwd_123",
        role: "CUSTOMER",
        isActive: false,
        emailVerified: true,
      });

      await expect(login({ email: "user@example.com", password: "valid_password" })).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining("deactivated"),
      });
    });

    it("should fail with 403 if non-customer user email is not verified", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "agent@example.com",
        passwordHash: "hashed_pwd_123",
        role: "AGENT",
        isActive: true,
        emailVerified: false,
      });

      await expect(login({ email: "agent@example.com", password: "valid_password" })).rejects.toMatchObject({
        statusCode: 403,
        message: expect.stringContaining("verify your email"),
      });
    });

    it("should successfully log in active customer and return tokens", async () => {
      const mockUser = {
        id: "user_1",
        name: "Test User",
        email: "user@example.com",
        passwordHash: "hashed_pwd_123",
        role: "CUSTOMER",
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.user.update as any).mockResolvedValue(mockUser);
      (prisma.rolePermission.findUnique as any).mockResolvedValue(null);

      const result = await login({ email: "user@example.com", password: "valid_password" });
      expect(result.tokens.accessToken).toBe("mock_access_token");
      expect(result.tokens.refreshToken).toBe("mock_refresh_token");
      expect(result.user.email).toBe("user@example.com");
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it("should support login via secondary CRM email", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      const mockUser = {
        id: "user_1",
        name: "Test User",
        email: "primary@example.com",
        passwordHash: "hashed_pwd_123",
        role: "CUSTOMER",
        isActive: true,
        emailVerified: true,
        createdAt: new Date(),
      };
      (prisma.crmCustomer.findFirst as any).mockResolvedValue({
        secondaryEmail: "secondary@example.com",
        user: mockUser,
      });
      (prisma.user.update as any).mockResolvedValue(mockUser);

      const result = await login({ email: "secondary@example.com", password: "valid_password" });
      expect(result.tokens.accessToken).toBe("mock_access_token");
      expect(result.user.id).toBe("user_1");
    });
  });

  describe("refresh()", () => {
    it("should throw 401 if refresh token is missing in DB or expired", async () => {
      (prisma.refreshToken.findUnique as any).mockResolvedValue(null);

      await expect(refresh("mock_refresh_token")).rejects.toMatchObject({
        statusCode: 401,
        message: expect.stringContaining("not found or has expired"),
      });
    });

    it("should issue new access token for valid refresh token", async () => {
      (prisma.refreshToken.findUnique as any).mockResolvedValue({
        token: "mock_refresh_token",
        userId: "user_123",
        expiresAt: new Date(Date.now() + 100000),
      });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_123",
        email: "user@example.com",
        role: "CUSTOMER",
        isActive: true,
      });

      const res = await refresh("mock_refresh_token");
      expect(res.accessToken).toBe("mock_access_token");
    });
  });

  describe("getMe()", () => {
    it("should throw 404 if user not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      await expect(getMe("nonexistent")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("forgotPassword() & resetPassword()", () => {
    it("should issue password reset token for existing user", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
        name: "User One",
      });

      const res = await forgotPassword({ email: "USER@EXAMPLE.COM" });
      expect(res.message).toBeDefined();
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
    });

    it("should fail resetPassword if token is expired", async () => {
      (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
        id: "token_1",
        token: "exp_token",
        email: "user@example.com",
        expiresAt: new Date(Date.now() - 1000),
      });

      await expect(resetPassword({ token: "exp_token", password: "newpassword" })).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("expired"),
      });
    });

    it("should reset password successfully and delete sessions", async () => {
      (prisma.passwordResetToken.findUnique as any).mockResolvedValue({
        id: "token_1",
        token: "valid_token",
        email: "user@example.com",
        expiresAt: new Date(Date.now() + 100000),
      });
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user_1",
        email: "user@example.com",
      });

      const res = await resetPassword({ token: "valid_token", password: "new_valid_password" });
      expect(res.message).toContain("successful");
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe("setupPassword() & verifyInvitationToken()", () => {
    it("should throw 400 if invitation token is expired", async () => {
      (prisma.invitation.findUnique as any).mockResolvedValue({
        id: "inv_1",
        setupToken: "exp_invite",
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      });

      await expect(verifyInvitationToken("exp_invite")).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining("expired"),
      });
    });

    it("should set up password successfully when valid token is provided", async () => {
      (prisma.invitation.findUnique as any).mockResolvedValue({
        id: "inv_1",
        setupToken: "valid_invite",
        crmCustomerId: "crm_cust_1",
        email: "invited@example.com",
        expiresAt: new Date(Date.now() + 100000),
        usedAt: null,
      });
      (prisma.user.findFirst as any).mockResolvedValue({
        id: "user_crm_1",
        crmCustomerId: "crm_cust_1",
      });

      const res = await setupPassword("valid_invite", "new_password");
      expect(res.email).toBe("invited@example.com");
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
