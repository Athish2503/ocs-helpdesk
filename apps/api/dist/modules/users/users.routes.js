"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_js_1 = require("./users.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Secure all user routes
router.use(auth_middleware_js_1.requireAuth);
// Profile update accessible to any authenticated user
router.patch("/me/profile", users_controller_js_1.updateProfileHandler);
// Credits check for current user
router.get("/me/credits", users_controller_js_1.getMyCreditsHandler);
// CRM details for current user (domains, subscriptions, services)
router.get("/me/crm-details", users_controller_js_1.getMyCrmDetailsHandler);
// Agents listing can be accessed by both admins and agents (or anyone with staff view access)
router.get("/agents", (0, role_middleware_js_1.requireRole)("ADMIN", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "AGENT"), users_controller_js_1.getAgentsHandler);
// Admin / Permissions operations
router.get("/role-permissions", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.listRolePermissionsHandler);
router.patch("/role-permissions", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.updateRolePermissionsHandler);
// Routing rules operations
router.get("/routing-rules", (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), users_controller_js_1.listRoutingRulesHandler);
router.post("/routing-rules", (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), users_controller_js_1.createRoutingRuleHandler);
router.patch("/routing-rules/:id", (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), users_controller_js_1.updateRoutingRuleHandler);
router.delete("/routing-rules/:id", (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), users_controller_js_1.deleteRoutingRuleHandler);
// Credits adjustments
router.patch("/:id/credits", (0, role_middleware_js_1.requirePermission)("adjust_credits"), users_controller_js_1.updateCustomerCreditsHandler);
// User CRUD operations
router.post("/", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.createUserHandler);
router.get("/", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.listUsersHandler);
router.get("/crm-customers", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.getCrmCustomersHandler);
router.get("/:id", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.getUserByIdHandler);
router.patch("/:id", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.updateUserHandler);
router.post("/:id/invite", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.inviteUserHandler);
router.post("/:id/resend-invite", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.resendInviteUserHandler);
router.post("/:id/reset-password-link", (0, role_middleware_js_1.requirePermission)("manage_permissions"), users_controller_js_1.sendResetPasswordLinkHandler);
exports.default = router;
