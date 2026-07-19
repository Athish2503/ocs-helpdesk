import { z } from "zod";

export const createSlaPolicySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "ALL"]),
  firstResponseHours: z.number().positive("First response hours must be positive"),
  resolutionHours: z.number().positive("Resolution hours must be positive"),
  isActive: z.boolean().optional().default(true),
});

export const updateSlaPolicySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "ALL"]).optional(),
  firstResponseHours: z.number().positive().optional(),
  resolutionHours: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSlaPolicyInput = z.infer<typeof createSlaPolicySchema>;
export type UpdateSlaPolicyInput = z.infer<typeof updateSlaPolicySchema>;
