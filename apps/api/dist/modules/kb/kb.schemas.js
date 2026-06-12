"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = exports.updateArticleSEOSchema = exports.updateArticleSchema = exports.createArticleSchema = void 0;
const zod_1 = require("zod");
exports.createArticleSchema = zod_1.z.object({
    title: zod_1.z.string({ error: "Title is required" }).trim().min(2).max(200),
    content: zod_1.z.string({ error: "Content is required" }).trim().min(10),
    isPublished: zod_1.z.boolean().optional(),
    isInternal: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().trim()).optional(),
    source: zod_1.z
        .object({
        type: zod_1.z.string(),
        id: zod_1.z.string(),
    })
        .optional()
        .nullable(),
    metaTitle: zod_1.z.string().trim().max(60).optional().nullable(),
    metaDescription: zod_1.z.string().trim().max(160).optional().nullable(),
    keywords: zod_1.z.string().trim().optional().nullable(),
    canonicalUrl: zod_1.z.string().trim().url().optional().nullable(),
    ogImage: zod_1.z.string().trim().url().optional().nullable(),
});
exports.updateArticleSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200).optional(),
    content: zod_1.z.string().trim().min(10).optional(),
    isPublished: zod_1.z.boolean().optional(),
    isInternal: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
    tags: zod_1.z.array(zod_1.z.string().trim()).optional(),
    metaTitle: zod_1.z.string().trim().max(60).optional().nullable(),
    metaDescription: zod_1.z.string().trim().max(160).optional().nullable(),
    keywords: zod_1.z.string().trim().optional().nullable(),
    canonicalUrl: zod_1.z.string().trim().url().or(zod_1.z.string().length(0)).optional().nullable(),
    ogImage: zod_1.z.string().trim().url().or(zod_1.z.string().length(0)).optional().nullable(),
});
exports.updateArticleSEOSchema = zod_1.z.object({
    metaTitle: zod_1.z.string().trim().max(60).optional().nullable(),
    metaDescription: zod_1.z.string().trim().max(160).optional().nullable(),
    keywords: zod_1.z.string().trim().optional().nullable(),
    canonicalUrl: zod_1.z.string().trim().url().or(zod_1.z.string().length(0)).optional().nullable(),
    ogImage: zod_1.z.string().trim().url().or(zod_1.z.string().length(0)).optional().nullable(),
});
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string({ error: "Name is required" }).trim().min(2).max(100),
    description: zod_1.z.string().trim().optional().nullable(),
    parentId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    description: zod_1.z.string().trim().optional().nullable(),
    parentId: zod_1.z.string().uuid().optional().nullable(),
});
