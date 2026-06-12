"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
const enums_js_1 = require("../../generated/prisma/enums.js");
exports.updateUserSchema = zod_1.z.object({
    role: zod_1.z.nativeEnum(enums_js_1.Role).optional(),
    isActive: zod_1.z.boolean().optional(),
});
