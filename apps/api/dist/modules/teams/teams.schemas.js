"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeamSchema = exports.createTeamSchema = void 0;
const zod_1 = require("zod");
exports.createTeamSchema = zod_1.z.object({
    name: zod_1.z.string({ error: "Team name is required" }).trim().min(2).max(100),
    description: zod_1.z.string().trim().optional(),
    memberIds: zod_1.z.array(zod_1.z.string()).optional(),
});
exports.updateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    description: zod_1.z.string().trim().optional(),
    memberIds: zod_1.z.array(zod_1.z.string()).optional(),
});
