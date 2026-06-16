"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../../generated/prisma/enums.js");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    role: zod_1.z.nativeEnum(enums_js_1.Role),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    role: zod_1.z.nativeEnum(enums_js_1.Role).optional(),
    isActive: zod_1.z.boolean().optional(),
    password: zod_1.z.string().min(6).optional(),
});
