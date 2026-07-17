import { Router } from "express";
import { handleCrmWebhook, handleCrmEventsWebhook } from "./integrations.controller.js";
import { validateCrmSignature } from "../../middleware/sync.middleware.js";

const router = Router();

// Endpoint for CRM customer event webhook updates
router.post("/crm/customer-event", handleCrmWebhook);

// Webhook endpoint for the real-time CRM event consumer
router.post("/crm/events", validateCrmSignature, handleCrmEventsWebhook);

export default router;

