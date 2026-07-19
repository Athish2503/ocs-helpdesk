import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  listSlaPoliciesHandler,
  createSlaPolicyHandler,
  updateSlaPolicyHandler,
  deleteSlaPolicyHandler,
  toggleSlaPolicyHandler,
} from "./sla.controller.js";

const router = Router();

// All SLA routes require authentication
router.use(requireAuth);

// GET /api/sla — list all SLA policies (any authenticated user can read)
router.get("/", listSlaPoliciesHandler);

// POST /api/sla — create a new SLA policy (admin only)
router.post("/", createSlaPolicyHandler);

// PATCH /api/sla/:id — update an SLA policy
router.patch("/:id", updateSlaPolicyHandler);

// PATCH /api/sla/:id/toggle — enable or disable an SLA policy
router.patch("/:id/toggle", toggleSlaPolicyHandler);

// DELETE /api/sla/:id — delete an SLA policy
router.delete("/:id", deleteSlaPolicyHandler);

export default router;
