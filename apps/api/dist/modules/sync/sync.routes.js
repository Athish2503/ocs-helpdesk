"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sync_controller_js_1 = require("./sync.controller.js");
const sync_middleware_js_1 = require("../../middleware/sync.middleware.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const role_middleware_js_1 = require("../../middleware/role.middleware.js");
const router = (0, express_1.Router)();
// Webhook from CRM (signature-validated, no auth token required)
router.post("/crm", sync_middleware_js_1.validateCrmSignature, sync_controller_js_1.crmWebhookHandler);
// Admin-only: bulk import all CRM customers into the local DB
router.post("/import-all", auth_middleware_js_1.requireAuth, (0, role_middleware_js_1.requirePermission)("manage_permissions"), sync_controller_js_1.bulkImportCustomersHandler);
exports.default = router;
