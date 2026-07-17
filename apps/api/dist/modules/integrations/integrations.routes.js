"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integrations_controller_js_1 = require("./integrations.controller.js");
const sync_middleware_js_1 = require("../../middleware/sync.middleware.js");
const router = (0, express_1.Router)();
// Endpoint for CRM customer event webhook updates
router.post("/crm/customer-event", integrations_controller_js_1.handleCrmWebhook);
// Webhook endpoint for the real-time CRM event consumer
router.post("/crm/events", sync_middleware_js_1.validateCrmSignature, integrations_controller_js_1.handleCrmEventsWebhook);
exports.default = router;
