import { Router } from "express";
import {
  createUserHandler,
  listUsersHandler,
  getAgentsHandler,
  getUserByIdHandler,
  updateUserHandler,
  updateProfileHandler,
} from "./users.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Secure all user routes
router.use(requireAuth);

// Profile update accessible to any authenticated user
router.patch("/me/profile", updateProfileHandler);

// Agents listing can be accessed by both admins and agents (e.g. for forwarding/assignment UI)
router.get("/agents", requireRole("ADMIN", "AGENT"), getAgentsHandler);

// Admin-only operations
router.post("/", requireRole("ADMIN"), createUserHandler);
router.get("/", requireRole("ADMIN"), listUsersHandler);
router.get("/:id", requireRole("ADMIN"), getUserByIdHandler);
router.patch("/:id", requireRole("ADMIN"), updateUserHandler);

export default router;
