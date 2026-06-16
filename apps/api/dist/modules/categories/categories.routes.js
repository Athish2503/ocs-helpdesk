"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_js_1 = require("./categories.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Retrieve categories - accessible by any logged-in user (filtered or unfiltered based on role/query)
router.get("/", auth_middleware_js_1.requireAuth, categories_controller_js_1.getCategoriesHandler);
// Create a new category - ADMIN only
router.post("/", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN"), categories_controller_js_1.createCategoryHandler);
// Update a category - ADMIN only
router.patch("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN"), categories_controller_js_1.updateCategoryHandler);
// Delete a category - ADMIN only
router.delete("/:id", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN"), categories_controller_js_1.deleteCategoryHandler);
exports.default = router;
