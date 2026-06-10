"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const categories_controller_js_1 = require("./categories.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Retrieve active categories - accessible by any logged-in user
router.get("/", auth_middleware_js_1.requireAuth, categories_controller_js_1.getActiveCategoriesHandler);
// Create a new category - ADMIN only
router.post("/", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requireRole)("ADMIN"), categories_controller_js_1.createCategoryHandler);
exports.default = router;
