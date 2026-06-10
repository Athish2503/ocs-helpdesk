import { z } from "zod";

const TicketStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]);
const TicketPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be at most 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  categoryId: z.string().uuid("Invalid category ID"),
  priority: TicketPriorityEnum.optional().default("MEDIUM"),
});

export const addMessageSchema = z.object({
  message: z.string().min(1, "Message content cannot be empty"),
});

export const updateTicketSchema = z.object({
  status: TicketStatusEnum.optional(),
  priority: TicketPriorityEnum.optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type AddMessageInput = z.infer<typeof addMessageSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
