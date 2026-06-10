import { Router } from "express";
import { getActiveCategoriesHandler, createCategoryHandler } from "./categories.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Retrieve active categories - accessible by any logged-in user
router.get("/", requireAuth, getActiveCategoriesHandler);

// Create a new category - ADMIN only
router.post("/", requireAuth, requireRole("ADMIN"), createCategoryHandler);

export default router;
