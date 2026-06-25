import { Router } from "express";
import { handleCrmWebhook } from "./integrations.controller.js";

const router = Router();

// Endpoint for CRM customer event webhook updates
router.post("/crm/customer-event", handleCrmWebhook);

export default router;
