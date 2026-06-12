import { Router } from "express";
import {
  listUsersHandler,
  getAgentsHandler,
  getUserByIdHandler,
  updateUserHandler,
} from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Secure all user routes
router.use(requireAuth);

// Agents listing can be accessed by both admins and agents (e.g. for forwarding/assignment UI)
router.get("/agents", requireRole("ADMIN", "AGENT"), getAgentsHandler);

// Admin-only operations
router.get("/", requireRole("ADMIN"), listUsersHandler);
router.get("/:id", requireRole("ADMIN"), getUserByIdHandler);
router.patch("/:id", requireRole("ADMIN"), updateUserHandler);

export default router;
