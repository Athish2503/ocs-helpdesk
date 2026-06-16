"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_js_1 = require("./users.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Secure all user routes
router.use(auth_middleware_js_1.requireAuth);
// Profile update accessible to any authenticated user
router.patch("/me/profile", users_controller_js_1.updateProfileHandler);
// Agents listing can be accessed by both admins and agents (e.g. for forwarding/assignment UI)
router.get("/agents", (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), users_controller_js_1.getAgentsHandler);
// Admin-only operations
router.post("/", (0, role_middleware_js_1.requireRole)("ADMIN"), users_controller_js_1.createUserHandler);
router.get("/", (0, role_middleware_js_1.requireRole)("ADMIN"), users_controller_js_1.listUsersHandler);
router.get("/:id", (0, role_middleware_js_1.requireRole)("ADMIN"), users_controller_js_1.getUserByIdHandler);
router.patch("/:id", (0, role_middleware_js_1.requireRole)("ADMIN"), users_controller_js_1.updateUserHandler);
exports.default = router;
