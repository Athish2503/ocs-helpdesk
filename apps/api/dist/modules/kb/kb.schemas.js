"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateArticleSchema = exports.createArticleSchema = void 0;
const zod_1 = require("zod");
exports.createArticleSchema = zod_1.z.object({
    title: zod_1.z.string({ error: "Title is required" }).trim().min(2).max(200),
    content: zod_1.z.string({ error: "Content is required" }).trim().min(10),
    isPublished: zod_1.z.boolean().optional(),
    isInternal: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
});
exports.updateArticleSchema = zod_1.z.object({
    title: zod_1.z.string().trim().min(2).max(200).optional(),
    content: zod_1.z.string().trim().min(10).optional(),
    isPublished: zod_1.z.boolean().optional(),
    isInternal: zod_1.z.boolean().optional(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
});
