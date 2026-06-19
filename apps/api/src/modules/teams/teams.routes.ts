import { Router } from "express";
import {
  listTeamsHandler,
  getTeamByIdHandler,
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
} from "./teams.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole, requirePermission } from "../../middleware/role.middleware.js";

const router = Router();

// Secure all team routes
router.use(requireAuth);

// Read-only access for ADMIN and AGENT
router.get("/", requireRole("ADMIN", "AGENT"), listTeamsHandler);
router.get("/:id", requireRole("ADMIN", "AGENT"), getTeamByIdHandler);

// Administrative mutations
router.post("/", requirePermission("manage_teams"), createTeamHandler);
router.patch("/:id", requirePermission("manage_teams"), updateTeamHandler);
router.delete("/:id", requirePermission("manage_teams"), deleteTeamHandler);

export default router;

