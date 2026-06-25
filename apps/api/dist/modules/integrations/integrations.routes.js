"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integrations_controller_js_1 = require("./integrations.controller.js");
const router = (0, express_1.Router)();
// Endpoint for CRM customer event webhook updates
router.post("/crm/customer-event", integrations_controller_js_1.handleCrmWebhook);
exports.default = router;
