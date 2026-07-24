import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/role.middleware.js";
import { listSlaPoliciesHandler, createSlaPolicyHandler, updateSlaPolicyHandler, deleteSlaPolicyHandler, toggleSlaPolicyHandler, } from "./sla.controller.js";
const router = Router();
// All SLA routes require authentication
router.use(requireAuth);
// GET /api/sla — list all SLA policies (requires view_sla permission)
router.get("/", requirePermission("view_sla"), listSlaPoliciesHandler);
// POST /api/sla — create a new SLA policy (requires manage_sla permission)
router.post("/", requirePermission("manage_sla"), createSlaPolicyHandler);
// PATCH /api/sla/:id — update an SLA policy
router.patch("/:id", requirePermission("manage_sla"), updateSlaPolicyHandler);
// PATCH /api/sla/:id/toggle — enable or disable an SLA policy
router.patch("/:id/toggle", requirePermission("manage_sla"), toggleSlaPolicyHandler);
// DELETE /api/sla/:id — delete an SLA policy
router.delete("/:id", requirePermission("manage_sla"), deleteSlaPolicyHandler);
export default router;
