"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teams_controller_js_1 = require("./teams.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Secure all team routes
router.use(auth_middleware_js_1.requireAuth);
// Read-only access for ADMIN and AGENT
router.get("/", (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), teams_controller_js_1.listTeamsHandler);
router.get("/:id", (0, role_middleware_js_1.requireRole)("ADMIN", "AGENT"), teams_controller_js_1.getTeamByIdHandler);
// Administrative mutations
router.post("/", (0, role_middleware_js_1.requireRole)("ADMIN"), teams_controller_js_1.createTeamHandler);
router.patch("/:id", (0, role_middleware_js_1.requireRole)("ADMIN"), teams_controller_js_1.updateTeamHandler);
router.delete("/:id", (0, role_middleware_js_1.requireRole)("ADMIN"), teams_controller_js_1.deleteTeamHandler);
exports.default = router;
