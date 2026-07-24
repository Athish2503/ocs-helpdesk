import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../../config/prisma.js", () => ({
    prisma: {
        category: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        },
        routingRule: {
            findUnique: vi.fn(),
        },
        user: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            update: vi.fn(),
        },
        ticket: {
            create: vi.fn(),
            findMany: vi.fn(),
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        ticketStatusHistory: {
            create: vi.fn(),
        },
        ticketMessage: {
            create: vi.fn(),
        },
        auditLog: {
            create: vi.fn(),
        },
        crmCustomer: {
            findUnique: vi.fn(),
        },
        crmDomain: {
            findFirst: vi.fn(),
        },
        creditUsage: {
            create: vi.fn(),
        },
        creditTransaction: {
            create: vi.fn(),
        },
        team: {
            findFirst: vi.fn(),
        },
        rolePermission: {
            findUnique: vi.fn(),
        },
        slaPolicy: {
            findFirst: vi.fn(),
        },
    },
}));
vi.mock("../../services/crm-cache.service.js", () => ({
    syncUserCredits: vi.fn().mockResolvedValue({ id: "credits_1" }),
}));
vi.mock("../../services/email.service.js", () => ({
    sendTicketNotificationEmail: vi.fn().mockResolvedValue(true),
    sendCustomerTicketCreatedEmail: vi.fn().mockResolvedValue(true),
    sendCustomerTicketResolvedEmail: vi.fn().mockResolvedValue(true),
}));
import { prisma } from "../../config/prisma.js";
import { createTicket, getTicketById, updateTicket, } from "./tickets.service.js";
describe("Tickets Service - Business Logic & Edge Cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    describe("createTicket()", () => {
        it("should throw 400 if category is inactive or missing", async () => {
            prisma.category.findUnique.mockResolvedValue({ id: "cat1", isActive: false });
            await expect(createTicket({ title: "Help me", description: "Details", priority: "MEDIUM", categoryId: "cat1" }, "cust1", "CUSTOMER")).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("Invalid or inactive category"),
            });
        });
        it("should fallback to 'Other Services' category if categoryId is omitted", async () => {
            prisma.category.findFirst.mockResolvedValue({ id: "cat_default", name: "Other Services", isActive: true });
            prisma.category.findUnique.mockResolvedValue({ id: "cat_default", name: "Other Services", isActive: true });
            prisma.routingRule.findUnique.mockResolvedValue(null);
            prisma.user.findUnique.mockResolvedValue({ crmCustomerId: "crm1", email: "cust@example.com" });
            prisma.slaPolicy.findFirst.mockResolvedValue(null);
            prisma.ticket.create.mockResolvedValue({
                id: "t1",
                title: "Help me",
                description: "Details",
                priority: "MEDIUM",
                status: "OPEN",
                category: { name: "Other Services" },
                customer: { name: "Cust", email: "cust@example.com" },
            });
            prisma.ticketStatusHistory.create.mockResolvedValue({});
            const ticket = await createTicket({ title: "Help me", description: "Details", priority: "MEDIUM" }, "cust1", "CUSTOMER");
            expect(ticket.id).toBe("t1");
            expect(prisma.ticket.create).toHaveBeenCalled();
        });
        it("should append secondary email note when created by secondary email", async () => {
            prisma.category.findUnique.mockResolvedValue({ id: "cat1", name: "Billing", isActive: true });
            prisma.routingRule.findUnique.mockResolvedValue(null);
            prisma.user.findUnique.mockResolvedValue({ id: "cust1", crmCustomerId: "crm1", email: "primary@example.com" });
            prisma.crmCustomer.findUnique.mockResolvedValue({ secondaryEmail: "sec@example.com" });
            prisma.slaPolicy.findFirst.mockResolvedValue(null);
            prisma.ticket.create.mockResolvedValue({
                id: "t2",
                title: "Billing issue",
                description: "Details\n\n[Created via secondary email: sec@example.com]",
                category: { name: "Billing" },
                customer: { name: "Cust", email: "primary@example.com" },
            });
            await createTicket({ title: "Billing issue", description: "Details", priority: "MEDIUM", categoryId: "cat1" }, "cust1", "CUSTOMER", "sec@example.com");
            expect(prisma.ticket.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    createdBySecondaryEmail: "sec@example.com",
                    description: expect.stringContaining("Created via secondary email: sec@example.com"),
                }),
            }));
        });
    });
    describe("getTicketById() & ABAC Security", () => {
        it("should throw 404 if ticket does not exist", async () => {
            prisma.ticket.findUnique.mockResolvedValue(null);
            await expect(getTicketById("nonexistent", { id: "cust1", email: "c@e.com", role: "CUSTOMER" })).rejects.toMatchObject({ statusCode: 404 });
        });
        it("should throw 403 if customer tries to access another customer's ticket", async () => {
            prisma.ticket.findUnique.mockResolvedValue({
                id: "t1",
                customerId: "owner_id",
            });
            await expect(getTicketById("t1", { id: "attacker_id", email: "att@e.com", role: "CUSTOMER" })).rejects.toMatchObject({ statusCode: 403, message: expect.stringContaining("Access denied") });
        });
        it("should throw 403 if agent tries to access a ticket assigned to a team they do not belong to", async () => {
            prisma.ticket.findUnique.mockResolvedValue({
                id: "t1",
                customerId: "owner_id",
                agentId: "other_agent",
                teamId: "team_alpha",
            });
            prisma.team.findFirst.mockResolvedValue(null);
            await expect(getTicketById("t1", { id: "agent_bravo", email: "a@e.com", role: "AGENT" })).rejects.toMatchObject({ statusCode: 403, message: expect.stringContaining("do not belong to the team") });
        });
    });
    describe("updateTicket()", () => {
        it("should throw 403 if customer attempts to change priority or status", async () => {
            prisma.ticket.findUnique.mockResolvedValue({
                id: "t1",
                customerId: "cust1",
            });
            await expect(updateTicket("t1", { priority: "URGENT" }, { id: "cust1", email: "c@e.com", role: "CUSTOMER" })).rejects.toMatchObject({ statusCode: 403, message: expect.stringContaining("Customers cannot change ticket priority") });
        });
        it("should throw 409 on optimistic lock conflict if updatedAt is outdated", async () => {
            prisma.ticket.findUnique.mockResolvedValue({
                id: "t1",
                customerId: "cust1",
                updatedAt: new Date("2026-01-01T12:00:00Z"),
            });
            await expect(updateTicket("t1", { status: "IN_PROGRESS", updatedAt: "2026-01-01T10:00:00Z" }, { id: "agent1", email: "a@e.com", role: "AGENT" })).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("Conflict") });
        });
        it("should calculate credit consumption when resolving ticket with outside OCS domain rate", async () => {
            prisma.ticket.findUnique.mockResolvedValue({
                id: "t1",
                title: "DNS fix",
                status: "OPEN",
                priority: "MEDIUM",
                customerId: "cust1",
                createdAt: new Date("2026-01-01T10:00:00Z"),
                updatedAt: new Date("2026-01-01T10:00:00Z"),
                affectedDomain: "external-domain.com",
                customer: {
                    crmCustomerId: "crm1",
                    crmCustomer: { domains: [] },
                },
            });
            prisma.crmDomain.findFirst.mockResolvedValue(null); // Not in OCS
            prisma.user.findUnique.mockResolvedValue({ crmCustomerId: "crm1" });
            prisma.ticketStatusHistory.create.mockResolvedValue({});
            prisma.creditUsage.create.mockResolvedValue({});
            prisma.creditTransaction.create.mockResolvedValue({});
            prisma.ticket.update.mockResolvedValue({
                id: "t1",
                title: "DNS fix",
                status: "RESOLVED",
                priority: "MEDIUM",
                category: { name: "Tech" },
                customer: { name: "Cust", email: "cust@e.com" },
            });
            const updated = await updateTicket("t1", { status: "RESOLVED", hoursConsumed: 1 }, { id: "agent1", email: "a@e.com", role: "AGENT" });
            expect(updated.status).toBe("RESOLVED");
            expect(prisma.creditUsage.create).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({
                    hoursConsumed: 750, // 1 hr * 750 rate
                }),
            }));
        });
    });
});
