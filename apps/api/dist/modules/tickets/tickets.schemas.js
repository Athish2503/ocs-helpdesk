"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketSchema = exports.addMessageSchema = exports.createTicketSchema = void 0;
const zod_1 = require("zod");
const TicketStatusEnum = zod_1.z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const TicketPriorityEnum = zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
exports.createTicketSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
    description: zod_1.z.string().min(10, "Description must be at least 10 characters"),
    categoryId: zod_1.z.string().uuid("Invalid category ID"),
    priority: TicketPriorityEnum.optional().default("MEDIUM"),
});
exports.addMessageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, "Message content cannot be empty"),
});
exports.updateTicketSchema = zod_1.z.object({
    status: TicketStatusEnum.optional(),
    priority: TicketPriorityEnum.optional(),
});
