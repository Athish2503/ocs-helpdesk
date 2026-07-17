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
exports.deleteRolePermissionHandler = deleteRolePermissionHandler;
exports.inviteUserHandler = inviteUserHandler;
exports.resendInviteUserHandler = resendInviteUserHandler;
exports.sendResetPasswordLinkHandler = sendResetPasswordLinkHandler;
exports.getCrmCustomersHandler = getCrmCustomersHandler;
exports.getMyCrmDetailsHandler = getMyCrmDetailsHandler;
const users_schemas_js_1 = require("./users.schemas.js");
const UsersService = __importStar(require("./users.service.js"));
const crmService = __importStar(require("../../services/crm.service.js"));
const AuthService = __importStar(require("../auth/auth.service.js"));
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const crm_cache_service_js_1 = require("../../services/crm-cache.service.js");
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
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: customerId },
            select: { crmCustomerId: true }
        });
        await (0, crm_cache_service_js_1.syncUserCredits)(customerId, user?.crmCustomerId || null).catch(err => {
            console.error(`[Users Controller] Error syncing user credits:`, err);
        });
        const credits = await prisma_js_1.prisma.customerCredits.findUnique({
            where: { customerId },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" },
                },
            },
        });
        ok(res, { credits });
    }
    catch (err) {
        next(err);
    }
}
async function updateCustomerCreditsHandler(req, res, next) {
    try {
        const id = req.params.id; // customer user ID
        const { allocatedHours, description } = req.body;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id },
            select: { crmCustomerId: true }
        });
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        const crmCustomerId = user.crmCustomerId;
        if (!crmCustomerId) {
            const error = new Error("User does not have a CRM customer ID");
            error.statusCode = 400;
            throw error;
        }
        // Sync first to get the most updated base allocated credits from CRM
        const syncedCredits = await (0, crm_cache_service_js_1.syncUserCredits)(id, crmCustomerId);
        const oldAllocated = syncedCredits.allocatedHours;
        const diff = (allocatedHours ?? oldAllocated) - oldAllocated;
        if (diff !== 0) {
            // Retain manual adjustments as separate audit entries only
            await prisma_js_1.prisma.creditUsage.create({
                data: {
                    crmCustomerId,
                    hoursConsumed: 0.0,
                    adjustments: diff,
                    reason: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
                }
            });
        }
        // Recalculate everything and sync to database
        const credits = await (0, crm_cache_service_js_1.syncUserCredits)(id, crmCustomerId);
        if (diff !== 0) {
            // Record transaction for backward compatibility/history
            await prisma_js_1.prisma.creditTransaction.create({
                data: {
                    customerCreditsId: credits.id,
                    hours: diff,
                    type: "ALLOCATION",
                    description: description || `Credits adjusted by administrator. Change: ${diff > 0 ? "+" : ""}${diff} hours.`,
                },
            });
        }
        const updatedCredits = await prisma_js_1.prisma.customerCredits.findUnique({
            where: { id: credits.id },
            include: {
                transactions: {
                    orderBy: { createdAt: "desc" }
                }
            }
        });
        ok(res, { credits: updatedCredits });
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
        const systemRoles = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"];
        // Get unique list of all roles in DB + system roles
        const allRoles = Array.from(new Set([...systemRoles, ...dbPermissions.map(p => p.role)]));
        const permissions = allRoles.map(role => {
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
        if (!role || typeof role !== "string" || role.trim() === "") {
            res.status(400).json({ success: false, error: { message: "Invalid role specified" } });
            return;
        }
        if (!Array.isArray(permissions)) {
            res.status(400).json({ success: false, error: { message: "Permissions must be an array of strings" } });
            return;
        }
        const trimmedRole = role.trim();
        const record = await prisma_js_1.prisma.rolePermission.upsert({
            where: { role: trimmedRole },
            update: { permissions },
            create: { role: trimmedRole, permissions },
        });
        ok(res, { record });
    }
    catch (err) {
        next(err);
    }
}
async function deleteRolePermissionHandler(req, res, next) {
    try {
        const role = req.params.role;
        if (!role) {
            res.status(400).json({ success: false, error: { message: "Role is required" } });
            return;
        }
        const systemRoles = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"];
        if (systemRoles.includes(role)) {
            res.status(400).json({ success: false, error: { message: "Cannot delete system roles" } });
            return;
        }
        // Delete role permission record
        await prisma_js_1.prisma.rolePermission.delete({
            where: { role },
        });
        // Fall back all users with this role to 'AGENT'
        await prisma_js_1.prisma.user.updateMany({
            where: { role },
            data: { role: "AGENT" },
        });
        ok(res, { message: `Role ${role} deleted successfully. Affected staff fell back to AGENT.` });
    }
    catch (err) {
        next(err);
    }
}
async function inviteUserHandler(req, res, next) {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const { generateTempPassword } = req.body;
        const result = await AuthService.sendInvitation(id, currentUserId, !!generateTempPassword);
        ok(res, { invitation: result });
    }
    catch (err) {
        next(err);
    }
}
async function resendInviteUserHandler(req, res, next) {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;
        const result = await AuthService.resendInvitation(id, currentUserId);
        ok(res, { invitation: result });
    }
    catch (err) {
        next(err);
    }
}
async function sendResetPasswordLinkHandler(req, res, next) {
    try {
        const { id } = req.params;
        const user = await UsersService.getUserById(id);
        const result = await AuthService.forgotPassword({ email: user.email });
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
async function getCrmCustomersHandler(req, res, next) {
    try {
        const search = req.query.search || "";
        const limitQuery = req.query.limit ? parseInt(req.query.limit, 10) : 1000;
        const crmData = await crmService.getCustomers({ search, limit: limitQuery });
        ok(res, crmData);
    }
    catch (err) {
        next(err);
    }
}
async function getMyCrmDetailsHandler(req, res, next) {
    try {
        const userId = req.user.id;
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: userId },
            select: { crmCustomerId: true },
        });
        if (!user || !user.crmCustomerId) {
            ok(res, { customer: null, domains: [], subscriptions: [], services: [] });
            return;
        }
        const crmCustomerId = user.crmCustomerId;
        const [customer, domains, subscriptions, services] = await Promise.all([
            prisma_js_1.prisma.crmCustomer.findUnique({ where: { crmCustomerId } }),
            (0, crm_cache_service_js_1.getOrFetchDomains)(crmCustomerId),
            (0, crm_cache_service_js_1.getOrFetchSubscriptions)(crmCustomerId),
            (0, crm_cache_service_js_1.getOrFetchServices)(crmCustomerId),
        ]);
        ok(res, { customer, domains, subscriptions, services });
    }
    catch (err) {
        next(err);
    }
}
