import { z } from "zod";
export const createArticleSchema = z.object({
    title: z.string({ error: "Title is required" }).trim().min(2).max(200),
    content: z.string({ error: "Content is required" }).trim().min(10),
    isPublished: z.boolean().optional(),
    isInternal: z.boolean().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    tags: z.array(z.string().trim()).optional(),
    source: z
        .object({
        type: z.string(),
        id: z.string(),
    })
        .optional()
        .nullable(),
    metaTitle: z.string().trim().max(60).optional().nullable(),
    metaDescription: z.string().trim().max(160).optional().nullable(),
    keywords: z.string().trim().optional().nullable(),
    canonicalUrl: z.string().trim().url().optional().nullable(),
    ogImage: z.string().trim().url().optional().nullable(),
});
export const updateArticleSchema = z.object({
    title: z.string().trim().min(2).max(200).optional(),
    content: z.string().trim().min(10).optional(),
    isPublished: z.boolean().optional(),
    isInternal: z.boolean().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    tags: z.array(z.string().trim()).optional(),
    metaTitle: z.string().trim().max(60).optional().nullable(),
    metaDescription: z.string().trim().max(160).optional().nullable(),
    keywords: z.string().trim().optional().nullable(),
    canonicalUrl: z.string().trim().url().or(z.string().length(0)).optional().nullable(),
    ogImage: z.string().trim().url().or(z.string().length(0)).optional().nullable(),
});
export const updateArticleSEOSchema = z.object({
    metaTitle: z.string().trim().max(60).optional().nullable(),
    metaDescription: z.string().trim().max(160).optional().nullable(),
    keywords: z.string().trim().optional().nullable(),
    canonicalUrl: z.string().trim().url().or(z.string().length(0)).optional().nullable(),
    ogImage: z.string().trim().url().or(z.string().length(0)).optional().nullable(),
});
export const createCategorySchema = z.object({
    name: z.string({ error: "Name is required" }).trim().min(2).max(100),
    description: z.string().trim().optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
});
export const updateCategorySchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().optional().nullable(),
    parentId: z.string().uuid().optional().nullable(),
});
