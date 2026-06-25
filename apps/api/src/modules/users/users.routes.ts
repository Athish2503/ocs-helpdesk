import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  getAgentsHandler,
  getUserByIdHandler,
  updateUserHandler,
  updateProfileHandler,
  getMyCreditsHandler,
  updateCustomerCreditsHandler,
  listRoutingRulesHandler,
  updateRoutingRuleHandler,
  createRoutingRuleHandler,
  deleteRoutingRuleHandler,
  listRolePermissionsHandler,
  updateRolePermissionsHandler,
  inviteUserHandler,
  resendInviteUserHandler,
  sendResetPasswordLinkHandler,
  getCrmCustomersHandler,
} from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole, requirePermission } from "../../middleware/role.middleware.js";

const router = Router();

// Secure all user routes
router.use(requireAuth);

// Profile update accessible to any authenticated user
router.patch("/me/profile", updateProfileHandler);

// Credits check for current user
router.get("/me/credits", getMyCreditsHandler);

// Agents listing can be accessed by both admins and agents (or anyone with staff view access)
router.get("/agents", requireRole("ADMIN", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "AGENT"), getAgentsHandler);

// Admin / Permissions operations
router.get("/role-permissions", requirePermission("manage_permissions"), listRolePermissionsHandler);
router.patch("/role-permissions", requirePermission("manage_permissions"), updateRolePermissionsHandler);

// Routing rules operations
router.get("/routing-rules", requirePermission("manage_categories_rules"), listRoutingRulesHandler);
router.post("/routing-rules", requirePermission("manage_categories_rules"), createRoutingRuleHandler);
router.patch("/routing-rules/:id", requirePermission("manage_categories_rules"), updateRoutingRuleHandler);
router.delete("/routing-rules/:id", requirePermission("manage_categories_rules"), deleteRoutingRuleHandler);

// Credits adjustments
router.patch("/:id/credits", requirePermission("adjust_credits"), updateCustomerCreditsHandler);

// User CRUD operations
router.post("/", requirePermission("manage_permissions"), createUserHandler);
router.get("/", requirePermission("manage_permissions"), listUsersHandler);
router.get("/crm-customers", requirePermission("manage_permissions"), getCrmCustomersHandler);
router.get("/:id", requirePermission("manage_permissions"), getUserByIdHandler);
router.patch("/:id", requirePermission("manage_permissions"), updateUserHandler);

router.post("/:id/invite", requirePermission("manage_permissions"), inviteUserHandler);
router.post("/:id/resend-invite", requirePermission("manage_permissions"), resendInviteUserHandler);
router.post("/:id/reset-password-link", requirePermission("manage_permissions"), sendResetPasswordLinkHandler);

export default router;

