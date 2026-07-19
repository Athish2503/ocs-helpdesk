"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSlaPolicySchema = exports.createSlaPolicySchema = void 0;
const zod_1 = require("zod");
exports.createSlaPolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(100),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "ALL"]),
    firstResponseHours: zod_1.z.number().positive("First response hours must be positive"),
    resolutionHours: zod_1.z.number().positive("Resolution hours must be positive"),
    isActive: zod_1.z.boolean().optional().default(true),
});
exports.updateSlaPolicySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    priority: zod_1.z.enum(["LOW", "MEDIUM", "HIGH", "URGENT", "ALL"]).optional(),
    firstResponseHours: zod_1.z.number().positive().optional(),
    resolutionHours: zod_1.z.number().positive().optional(),
    isActive: zod_1.z.boolean().optional(),
});
