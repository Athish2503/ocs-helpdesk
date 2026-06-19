"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_js_1 = require("./categories.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Retrieve categories - accessible by any logged-in user (filtered or unfiltered based on role/query)
router.get("/", auth_middleware_js_1.requireAuth, categories_controller_js_1.getCategoriesHandler);
// Create a new category - ADMIN only (with permission)
router.post("/", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), categories_controller_js_1.createCategoryHandler);
// Bulk delete categories - ADMIN only (with permission)
router.post("/bulk-delete", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), categories_controller_js_1.bulkDeleteCategoriesHandler);
// Update a category - ADMIN only (with permission)
router.patch("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), categories_controller_js_1.updateCategoryHandler);
// Delete a category - ADMIN only (with permission)
router.delete("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requirePermission)("manage_categories_rules"), categories_controller_js_1.deleteCategoryHandler);
exports.default = router;
