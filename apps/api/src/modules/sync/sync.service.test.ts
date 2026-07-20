import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/prisma.js", () => {
  const mockTx = {
    crmCustomer: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    crmDomain: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    crmService: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    crmSubscription: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  };

  return {
    prisma: {
      $transaction: vi.fn((fn) => fn(mockTx)),
      __mockTx: mockTx,
    },
  };
});

import { prisma } from "../../config/prisma.js";
import { handleCustomerCreated, handleCustomerDeactivated } from "./sync.service.js";

describe("Sync Service - CRM Webhook Ingestion Logic", () => {
  const mockTx = (prisma as any).__mockTx;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handleCustomerCreated should create new CRM customer and inactive user if user doesn't exist", async () => {
    mockTx.crmCustomer.findFirst.mockResolvedValue(null);
    mockTx.crmCustomer.create.mockResolvedValue({ id: "crm_1", crmCustomerId: "CUST100" });
    mockTx.user.findUnique.mockResolvedValue(null);
    mockTx.user.create.mockResolvedValue({ id: "u100", email: "newcust@example.com" });

    const res = await handleCustomerCreated({
      crmCustomerId: "CUST100",
      displayName: "New Cust",
      primaryEmail: "newcust@example.com",
    });

    expect(res.userId).toBe("u100");
    expect(mockTx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "newcust@example.com",
          isActive: false, // inactive until password setup
        }),
      })
    );
  });

  it("handleCustomerDeactivated should deactivate linked helpdesk user", async () => {
    mockTx.crmCustomer.updateMany.mockResolvedValue({ count: 1 });
    mockTx.user.findUnique.mockResolvedValue({ id: "u100", crmCustomerId: "CUST100", isActive: true });
    mockTx.user.update.mockResolvedValue({ id: "u100", isActive: false });

    const res = await handleCustomerDeactivated("CUST100");

    expect(res.userDeactivated).toBe(true);
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: "u100" },
      data: { isActive: false },
    });
  });
});
