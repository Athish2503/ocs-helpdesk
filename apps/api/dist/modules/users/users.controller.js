"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserHandler = createUserHandler;
exports.listUsersHandler = listUsersHandler;
exports.getAgentsHandler = getAgentsHandler;
exports.getUserByIdHandler = getUserByIdHandler;
exports.updateUserHandler = updateUserHandler;
exports.updateProfileHandler = updateProfileHandler;
exports.getMyCreditsHandler = getMyCreditsHandler;
exports.updateCustomerCreditsHandler = updateCustomerCreditsHandler;
exports.listRoutingRulesHandler = listRoutingRulesHandler;
exports.updateRoutingRuleHandler = updateRoutingRuleHandler;
exports.createRoutingRuleHandler = createRoutingRuleHandler;
exports.deleteRoutingRuleHandler = deleteRoutingRuleHandler;
exports.listRolePermissionsHandler = listRolePermissionsHandler;
exports.updateRolePermissionsHandler = updateRolePermissionsHandler;
const users_schemas_js_1 = require("./users.schemas.js");
const UsersService = __importStar(require("./users.service.js"));
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const enums_js_1 = require("../../generated/prisma/enums.js");
function ok(res, data) {
    res.status(200).json({ success: true, data });
}
async function createUserHandler(req, res, next) {
    try {
        const input = users_schemas_js_1.createUserSchema.parse(req.body);
        const user = await UsersService.createUser(input);
        ok(res, { user });
    }
    catch (err) {
        next(err);
    }
}
async function listUsersHandler(req, res, next) {
    try {
        const { search, role, isActive } = req.query;
        const users = await UsersService.listUsers({
            search: search,
            role: role,
            isActive: isActive,
        });
        ok(res, { users });
    }
    catch (err) {
        next(err);
    }
}
async function getAgentsHandler(req, res, next) {
    try {
        const agents = await UsersService.getAgents();
        ok(res, { agents });
    }
    catch (err) {
        next(err);
    }
}
async function getUserByIdHandler(req, res, next) {
    try {
        const { id } = req.params;
        const user = await UsersService.getUserById(id);
        ok(res, { user });
    }
    catch (err) {
        next(err);
    }
}
async function updateUserHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = users_schemas_js_1.updateUserSchema.parse(req.body);
        const user = await UsersService.updateUser(id, input);
        ok(res, { user });
    }
    catch (err) {
        next(err);
    }
}
async function updateProfileHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const { name, password } = req.body;
        const user = await UsersService.updateProfile(userId, { name, password });
        ok(res, { user });
    }
    catch (err) {
        next(err);
    }
}
const prisma_js_1 = require("../../config/prisma.js");
async function getMyCreditsHandler(req, res, next) {
    try {
        const customerId = req.user.id;
        let credits = await prisma_js_1.prisma.customerCredits.findUnique({
            where: { customerId },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        if (!credits) {
            credits = await prisma_js_1.prisma.customerCredits.create({
                data: {
                    customerId,
                    allocatedHours: 20.0,
                    usedHours: 0.0,
                    remainingHours: 20.0,
                    billableHours: 0.0,
                },
                include: {
                    transactions: true,
                },
            });
        }
        ok(res, { credits });
    }
    catch (err) {
        next(err);
    }
}
async function updateCustomerCreditsHandler(req, res, next) {
    try {
        const id = req.params.id; // customer user ID
        const { allocatedHours, usedHours, remainingHours, billableHours, description } = req.body;
        const currentCredits = await prisma_js_1.prisma.customerCredits.findUnique({
            where: { customerId: id },
        });
        const oldAllocated = currentCredits?.allocatedHours ?? 0;
        const diff = (allocatedHours ?? oldAllocated) - oldAllocated;
        const credits = await prisma_js_1.prisma.customerCredits.upsert({
            where: { customerId: id },
            update: {
                ...(allocatedHours !== undefined ? { allocatedHours } : {}),
                ...(usedHours !== undefined ? { usedHours } : {}),
                ...(remainingHours !== undefined ? { remainingHours } : {}),
                ...(billableHours !== undefined ? { billableHours } : {}),
            },
            create: {
                customerId: id,
                allocatedHours: allocatedHours ?? 20.0,
                usedHours: usedHours ?? 0.0,
                remainingHours: remainingHours ?? 20.0,
                billableHours: billableHours ?? 0.0,
            },
        });
        if (diff !== 0) {
            // Record transaction
            await prisma_js_1.prisma.creditTransaction.create({
                data: {
                    customerCreditsId: credits.id,
                    hours: diff,
                    type: "ALLOCATION",
                    description: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
                },
            });
        }
        ok(res, { credits });
    }
    catch (err) {
        next(err);
    }
}
async function listRoutingRulesHandler(req, res, next) {
    try {
        const rules = await prisma_js_1.prisma.routingRule.findMany({
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                secondaryAssignee: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
            },
            orderBy: { issueCategory: "asc" },
        });
        ok(res, { rules });
    }
    catch (err) {
        next(err);
    }
}
async function updateRoutingRuleHandler(req, res, next) {
    try {
        const id = req.params.id;
        const { assigneeId, teamId, secondaryAssigneeId } = req.body;
        const rule = await prisma_js_1.prisma.routingRule.update({
            where: { id },
            data: {
                assigneeId: assigneeId !== undefined ? assigneeId : undefined,
                teamId: teamId !== undefined ? teamId : undefined,
                secondaryAssigneeId: secondaryAssigneeId !== undefined ? secondaryAssigneeId : undefined,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                secondaryAssignee: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
            },
        });
        ok(res, { rule });
    }
    catch (err) {
        next(err);
    }
}
async function createRoutingRuleHandler(req, res, next) {
    try {
        const { issueCategory, assigneeId, teamId, secondaryAssigneeId } = req.body;
        if (!issueCategory || !issueCategory.trim()) {
            res.status(400).json({ success: false, error: { message: "Issue category name is required" } });
            return;
        }
        const rule = await prisma_js_1.prisma.routingRule.create({
            data: {
                issueCategory: issueCategory.trim(),
                assigneeId: assigneeId || null,
                teamId: teamId || null,
                secondaryAssigneeId: secondaryAssigneeId || null,
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } },
                secondaryAssignee: { select: { id: true, name: true, email: true } },
                team: { select: { id: true, name: true } },
            },
        });
        ok(res, { rule });
    }
    catch (err) {
        if (err.code === "P2002") {
            res.status(409).json({ success: false, error: { message: "A routing rule for this category already exists" } });
            return;
        }
        next(err);
    }
}
async function deleteRoutingRuleHandler(req, res, next) {
    try {
        const id = req.params.id;
        await prisma_js_1.prisma.routingRule.delete({
            where: { id },
        });
        ok(res, { message: "Routing rule deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
async function listRolePermissionsHandler(req, res, next) {
    try {
        const dbPermissions = await prisma_js_1.prisma.rolePermission.findMany();
        const rolesList = Object.values(enums_js_1.Role);
        const permissions = rolesList.map(role => {
            const dbRecord = dbPermissions.find(p => p.role === role);
            return {
                role,
                permissions: dbRecord?.permissions ?? role_middleware_js_1.DEFAULT_PERMISSIONS[role] ?? [],
            };
        });
        ok(res, { permissions });
    }
    catch (err) {
        next(err);
    }
}
async function updateRolePermissionsHandler(req, res, next) {
    try {
        const { role, permissions } = req.body;
        if (!role || !Object.values(enums_js_1.Role).includes(role)) {
            res.status(400).json({ success: false, error: { message: "Invalid role specified" } });
            return;
        }
        if (!Array.isArray(permissions)) {
            res.status(400).json({ success: false, error: { message: "Permissions must be an array of strings" } });
            return;
        }
        const record = await prisma_js_1.prisma.rolePermission.upsert({
            where: { role },
            update: { permissions },
            create: { role, permissions },
        });
        ok(res, { record });
    }
    catch (err) {
        next(err);
    }
}
