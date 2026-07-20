import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../config/prisma.js", () => ({
  prisma: {
    crmSyncLog: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    crmEventQueue: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("./crm.service.js", () => ({}));
vi.mock("./crm-cache.service.js", () => ({
  CrmCacheManager: {
    invalidateDomains: vi.fn(),
    invalidateSubscriptions: vi.fn(),
  },
  getOrFetchCustomerCredits: vi.fn().mockResolvedValue({}),
}));
vi.mock("./sse.service.js", () => ({
  sseManager: {
    broadcastToAll: vi.fn(),
    sendToUser: vi.fn(),
  },
}));

import { prisma } from "../config/prisma.js";
import { enqueueEvent } from "./crm-queue.service.js";

describe("CRM Queue Service - Idempotency & Ingestion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("enqueueEvent should ignore duplicate events with identical eventId", async () => {
    (prisma.crmSyncLog.findUnique as any).mockResolvedValue({ id: "log1", eventId: "evt_dup_1" });

    const result = await enqueueEvent("evt_dup_1", "customer.updated", { crmCustomerId: "cust_1" });

    expect(result).toBe(false);
    expect(prisma.crmEventQueue.create).not.toHaveBeenCalled();
  });

  it("enqueueEvent should insert new event into queue and log receipt", async () => {
    (prisma.crmSyncLog.findUnique as any).mockResolvedValue(null);
    (prisma.crmEventQueue.create as any).mockResolvedValue({ id: "q1" });
    (prisma.crmSyncLog.create as any).mockResolvedValue({ id: "log1" });
    (prisma.crmEventQueue.findMany as any).mockResolvedValue([]);

    const result = await enqueueEvent("evt_new_1", "customer.created", { crmCustomerId: "cust_1" });

    expect(result).toBe(true);
    expect(prisma.crmEventQueue.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt_new_1",
          status: "PENDING",
        }),
      })
    );
    expect(prisma.crmSyncLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: "evt_new_1",
          status: "QUEUED",
        }),
      })
    );
  });
});
