import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../../config/prisma.js", () => ({
    prisma: {
        slaPolicy: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
    },
}));
import { prisma } from "../../config/prisma.js";
import { listSlaPolicies, getSlaPolicyById, createSlaPolicy, computeSlaDeadlines, } from "./sla.service.js";
describe("SLA Service - Business Logic & Edge Cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("listSlaPolicies should return policies ordered by priority tier", async () => {
        prisma.slaPolicy.findMany.mockResolvedValue([
            { id: "1", priority: "LOW", createdAt: new Date() },
            { id: "2", priority: "URGENT", createdAt: new Date() },
        ]);
        const res = await listSlaPolicies();
        expect(res[0].priority).toBe("URGENT");
        expect(res[1].priority).toBe("LOW");
    });
    it("getSlaPolicyById should throw 404 if policy not found", async () => {
        prisma.slaPolicy.findUnique.mockResolvedValue(null);
        await expect(getSlaPolicyById("nonexistent")).rejects.toMatchObject({ statusCode: 404 });
    });
    it("createSlaPolicy should throw 409 if policy already exists for priority tier", async () => {
        prisma.slaPolicy.findFirst.mockResolvedValue({ id: "existing", priority: "HIGH" });
        await expect(createSlaPolicy({ name: "High Policy", priority: "HIGH", firstResponseHours: 2, resolutionHours: 8, isActive: true })).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("already exists") });
    });
    it("computeSlaDeadlines should return correct deadlines when policy exists", async () => {
        prisma.slaPolicy.findFirst.mockResolvedValue({
            id: "p1",
            priority: "URGENT",
            firstResponseHours: 1,
            resolutionHours: 4,
            isActive: true,
        });
        const now = new Date("2026-01-01T12:00:00Z");
        const deadlines = await computeSlaDeadlines("URGENT", now);
        expect(deadlines.slaResponseDeadline).toEqual(new Date("2026-01-01T13:00:00Z"));
        expect(deadlines.slaResolutionDeadline).toEqual(new Date("2026-01-01T16:00:00Z"));
    });
    it("computeSlaDeadlines should return nulls if no policy matches", async () => {
        prisma.slaPolicy.findFirst.mockResolvedValue(null);
        const deadlines = await computeSlaDeadlines("UNKNOWN", new Date());
        expect(deadlines.slaResponseDeadline).toBeNull();
        expect(deadlines.slaResolutionDeadline).toBeNull();
    });
});
