"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategorySchema = void 0;
const zod_1 = require("zod");
exports.createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be at most 50 characters"),
    description: zod_1.z.string().max(250, "Description must be at most 250 characters").optional(),
});
