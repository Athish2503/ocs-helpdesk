import { Router } from "express";
import {
  getCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "./categories.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requireRole } from "../../middleware/role.middleware.js";

const router = Router();

// Retrieve categories - accessible by any logged-in user (filtered or unfiltered based on role/query)
router.get("/", requireAuth, getCategoriesHandler);

// Create a new category - ADMIN only
router.post("/", requireAuth, requireRole("ADMIN"), createCategoryHandler);

// Update a category - ADMIN only
router.patch("/:id", requireAuth, requireRole("ADMIN"), updateCategoryHandler);

// Delete a category - ADMIN only
router.delete("/:id", requireAuth, requireRole("ADMIN"), deleteCategoryHandler);

export default router;

