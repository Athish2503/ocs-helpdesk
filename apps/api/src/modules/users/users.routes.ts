import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
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
  deleteRolePermissionHandler,
  inviteUserHandler,
  resendInviteUserHandler,
  sendResetPasswordLinkHandler,
  getCrmCustomersHandler,
  getMyCrmDetailsHandler,
} from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole, requirePermission } from "../../middleware/role.middleware.js";
import { sseManager } from "../../services/sse.service.js";
import { prisma } from "../../config/prisma.js";

const router = Router();

// Secure all user routes
router.use(requireAuth);

// Profile update accessible to any authenticated user
router.patch("/me/profile", updateProfileHandler);

// Credits check for current user
router.get("/me/credits", getMyCreditsHandler);

// CRM details for current user (domains, subscriptions, services)
router.get("/me/crm-details", getMyCrmDetailsHandler);

// ── SSE: Real-time CRM sync stream ─────────────────────────────────────────
// GET /api/users/me/events — establishes a persistent SSE connection.
// The server will push 'crm.sync' events whenever CRM data for this customer changes.
router.get("/me/events", async (req: Request, res: Response, _next: NextFunction) => {
  const userId = req.user!.id;

  // Resolve crmCustomerId for targeted broadcast routing
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { crmCustomerId: true },
  }).catch(() => null);

  const crmCustomerId = user?.crmCustomerId ?? null;

  // Generate a unique connection ID so the same user can open multiple tabs
  const connectionId = crypto.randomUUID();

  // Register and start streaming — sseManager handles headers, ping, and cleanup
  sseManager.addClient(connectionId, userId, crmCustomerId, res);
});


// Agents listing can be accessed by both admins and agents (or anyone with staff view access)
router.get("/agents", requireRole("ADMIN", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "AGENT"), getAgentsHandler);

// Admin / Permissions operations
router.get("/role-permissions", requirePermission("manage_permissions"), listRolePermissionsHandler);
router.patch("/role-permissions", requirePermission("manage_permissions"), updateRolePermissionsHandler);
router.delete("/role-permissions/:role", requirePermission("manage_permissions"), deleteRolePermissionHandler);

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

