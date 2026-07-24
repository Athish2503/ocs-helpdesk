import { Router } from "express";
import { crmWebhookHandler, bulkImportCustomersHandler } from "./sync.controller.js";
import { validateCrmSignature } from "../../middleware/sync.middleware.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { requirePermission } from "../../middleware/role.middleware.js";
const router = Router();
// Webhook from CRM (signature-validated, no auth token required)
router.post("/crm", validateCrmSignature, crmWebhookHandler);
// Admin-only: bulk import all CRM customers into the local DB
router.post("/import-all", requireAuth, requirePermission("manage_permissions"), bulkImportCustomersHandler);
export default router;
