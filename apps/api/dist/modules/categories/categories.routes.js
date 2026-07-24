import { Router } from "express";
import { getCategoriesHandler, createCategoryHandler, updateCategoryHandler, deleteCategoryHandler, bulkDeleteCategoriesHandler, } from "./categories.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/role.middleware.js";
const router = Router();
// Retrieve categories - accessible by any logged-in user (filtered or unfiltered based on role/query)
router.get("/", requireAuth, getCategoriesHandler);
// Create a new category - ADMIN only (with permission)
router.post("/", requireAuth, requirePermission("manage_categories_rules"), createCategoryHandler);
// Bulk delete categories - ADMIN only (with permission)
router.post("/bulk-delete", requireAuth, requirePermission("manage_categories_rules"), bulkDeleteCategoriesHandler);
// Update a category - ADMIN only (with permission)
router.patch("/:id", requireAuth, requirePermission("manage_categories_rules"), updateCategoryHandler);
// Delete a category - ADMIN only (with permission)
router.delete("/:id", requireAuth, requirePermission("manage_categories_rules"), deleteCategoryHandler);
export default router;
