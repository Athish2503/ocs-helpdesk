import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../utils/jwt.js", () => ({
    verifyAccessToken: vi.fn(),
}));
vi.mock("../config/prisma.js", () => ({
    prisma: {
        rolePermission: {
            findUnique: vi.fn(),
        },
    },
}));
import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import { requireAuth } from "./auth.middleware.js";
import { requireRole, requirePermission } from "./role.middleware.js";
describe("Middleware & Security Tests", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("requireAuth", () => {
        it("should return 401 if no Authorization header or query token is provided", () => {
            const req = { headers: {}, query: {} };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code: "UNAUTHORIZED" }) }));
            expect(next).not.toHaveBeenCalled();
        });
        it("should authenticate successfully with valid Bearer token", () => {
            verifyAccessToken.mockReturnValue({
                sub: "user_123",
                email: "user@example.com",
                role: "CUSTOMER",
            });
            const req = {
                headers: { authorization: "Bearer valid_token" },
                query: {},
            };
            const res = {};
            const next = vi.fn();
            requireAuth(req, res, next);
            expect(req.user).toEqual({
                id: "user_123",
                email: "user@example.com",
                role: "CUSTOMER",
            });
            expect(next).toHaveBeenCalled();
        });
    });
    describe("requireRole", () => {
        it("should allow request if user has allowed role", () => {
            const req = { user: { role: "ADMIN" } };
            const res = {};
            const next = vi.fn();
            const guard = requireRole("ADMIN", "AGENT");
            guard(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it("should return 403 if user does not have allowed role", () => {
            const req = { user: { role: "CUSTOMER" } };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            const guard = requireRole("ADMIN", "AGENT");
            guard(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
    describe("requirePermission", () => {
        it("should allow request if user role has required permission", async () => {
            prisma.rolePermission.findUnique.mockResolvedValue(null);
            const req = { user: { role: "ADMIN" } };
            const res = {};
            const next = vi.fn();
            const guard = requirePermission("manage_teams");
            await guard(req, res, next);
            expect(next).toHaveBeenCalled();
        });
        it("should deny request if user role does not have required permission", async () => {
            prisma.rolePermission.findUnique.mockResolvedValue(null);
            const req = { user: { role: "AGENT" } };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            };
            const next = vi.fn();
            const guard = requirePermission("manage_teams");
            await guard(req, res, next);
            expect(res.status).toHaveBeenCalledWith(403);
            expect(next).not.toHaveBeenCalled();
        });
    });
});
