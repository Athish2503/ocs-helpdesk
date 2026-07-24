import { z } from "zod";
const TicketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const TicketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const createTicketSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    categoryId: z.string().uuid("Invalid category ID").optional().nullable(),
    priority: TicketPriorityEnum.optional().default("MEDIUM"),
    affectedDomain: z.string().optional().nullable(),
    issueCategory: z.string().optional().nullable(),
    domainId: z.union([z.string(), z.number()]).transform(val => String(val)).optional().nullable(),
    subscriptionId: z.union([z.string(), z.number()]).transform(val => String(val)).optional().nullable(),
    serviceId: z.union([z.string(), z.number()]).transform(val => String(val)).optional().nullable(),
});
export const addMessageSchema = z.object({
    message: z.string().min(1, "Message content cannot be empty"),
});
export const updateTicketSchema = z.object({
    status: TicketStatusEnum.optional(),
    priority: TicketPriorityEnum.optional(),
    teamId: z.string().uuid().nullable().optional(),
    agentId: z.string().uuid().nullable().optional(),
    hoursConsumed: z.number().optional().nullable(),
    isEscalated: z.boolean().optional(),
    escalationReason: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
});
