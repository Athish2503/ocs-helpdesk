import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmCustomer: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../services/crm-cache.service.js", () => ({
  getOrFetchDomains: vi.fn().mockResolvedValue([]),
  getOrFetchServices: vi.fn().mockResolvedValue([]),
  getOrFetchSubscriptions: vi.fn().mockResolvedValue([]),
  syncUserCredits: vi.fn().mockResolvedValue({ id: "cred_1" }),
}));

vi.mock("../../services/crm.service.js", () => ({
  syncCustomerData: vi.fn().mockResolvedValue(true),
}));

import { prisma } from "../../config/prisma.js";
import {
  listUsers,
  getUserById,
  createUser,
  getAgents,
  updateProfile,
} from "./users.service.js";

describe("Users Service - Business Logic & Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getUserById should throw 404 if user not found", async () => {
    (prisma.user.findUnique as any).mockResolvedValue(null);
    await expect(getUserById("nonexistent")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createUser should throw 409 if email already exists", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ id: "u1", email: "existing@example.com" });

    await expect(
      createUser({ name: "Existing", email: "existing@example.com", password: "pwd", role: "CUSTOMER" })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("already exists"),
    });
  });

  it("getAgents should query only staff roles", async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "a1", name: "Agent 1", role: "AGENT" },
    ]);

    const agents = await getAgents();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          role: { in: ["AGENT", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "ADMIN"] },
        },
      })
    );
    expect(agents).toHaveLength(1);
  });
});
