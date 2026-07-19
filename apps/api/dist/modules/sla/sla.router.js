"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const sla_controller_js_1 = require("./sla.controller.js");
const router = (0, express_1.Router)();
// All SLA routes require authentication
router.use(auth_middleware_js_1.requireAuth);
// GET /api/sla — list all SLA policies (any authenticated user can read)
router.get("/", sla_controller_js_1.listSlaPoliciesHandler);
// POST /api/sla — create a new SLA policy (admin only)
router.post("/", sla_controller_js_1.createSlaPolicyHandler);
// PATCH /api/sla/:id — update an SLA policy
router.patch("/:id", sla_controller_js_1.updateSlaPolicyHandler);
// PATCH /api/sla/:id/toggle — enable or disable an SLA policy
router.patch("/:id/toggle", sla_controller_js_1.toggleSlaPolicyHandler);
// DELETE /api/sla/:id — delete an SLA policy
router.delete("/:id", sla_controller_js_1.deleteSlaPolicyHandler);
exports.default = router;
