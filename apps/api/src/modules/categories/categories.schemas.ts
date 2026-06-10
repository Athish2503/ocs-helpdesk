import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
  description: z.string().max(250, "Description must be at most 250 characters").optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
