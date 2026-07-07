"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCategorySchema = exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(120, "Name must be at most 120 characters"),
    description: zod_1.z.string().max(500, "Description must be at most 500 characters").optional().nullable(),
    parentId: zod_1.z.string().uuid("Invalid parent category ID").optional().nullable(),
    isActive: zod_1.z.boolean().optional().default(true),
    credits: zod_1.z.number().nonnegative().optional().default(0.0),
});
exports.updateCategorySchema = exports.createCategorySchema.partial();
