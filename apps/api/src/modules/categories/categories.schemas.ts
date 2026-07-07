import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120, "Name must be at most 120 characters"),
  description: z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
  parentId: z.string().uuid("Invalid parent category ID").optional().nullable(),
  isActive: z.boolean().optional().default(true),
  credits: z.number().nonnegative().optional().default(0.0),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

