import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string({ error: "Title is required" }).trim().min(2).max(200),
  content: z.string({ error: "Content is required" }).trim().min(10),
  isPublished: z.boolean().optional(),
  isInternal: z.boolean().optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const updateArticleSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  content: z.string().trim().min(10).optional(),
  isPublished: z.boolean().optional(),
  isInternal: z.boolean().optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
