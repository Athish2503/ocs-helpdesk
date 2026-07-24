import crypto from "crypto";
import * as crmService from "../../services/crm.service.js";
/**
 * Handle incoming real-time customer event webhooks from the CRM (Subsync).
 */
export async function handleCrmWebhook(req, res, next) {
    const signatureHeader = req.header("X-Signature");
    const timestampHeader = req.header("X-Timestamp");
    if (!signatureHeader || !timestampHeader) {
        res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Missing X-Signature or X-Timestamp headers" },
        });
        return;
    }
    const timestamp = Number(timestampHeader);
    if (isNaN(timestamp)) {
        res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Invalid X-Timestamp header format" },
        });
        return;
    }
    // Replay protection: Verify timestamp is within a 5-minute (300,000 ms) window of current system time
    const drift = Math.abs(Date.now() - timestamp);
    if (drift > 300000) {
        res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "Timestamp drift exceeds 5-minute window" },
        });
        return;
    }
    // Verify HMAC: Compute HMAC-SHA256 of timestamp + "." + JSON.stringify(body)
    const secret = process.env.CRM_WEBHOOK_SECRET || "dev-crm-secret-key-change-me";
    const rawMessage = timestampHeader + "." + JSON.stringify(req.body);
    const computedSignature = crypto.createHmac("sha256", secret).update(rawMessage).digest("hex");
    try {
        const headerBuffer = Buffer.from(signatureHeader, "hex");
        const computedBuffer = Buffer.from(computedSignature, "hex");
        if (headerBuffer.length !== computedBuffer.length || !crypto.timingSafeEqual(headerBuffer, computedBuffer)) {
            res.status(401).json({
                success: false,
                error: { code: "UNAUTHORIZED", message: "Invalid CRM webhook signature" },
            });
            return;
        }
    }
    catch (err) {
        res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "CRM signature validation failed" },
        });
        return;
    }
    const { customerId } = req.body;
    if (!customerId) {
        res.status(400).json({
            success: false,
            error: { code: "BAD_REQUEST", message: "Missing customerId in payload" },
        });
        return;
    }
    // Trigger an asynchronous customer sync in the background
    crmService.syncCustomerData(customerId).catch((err) => {
        console.error(`[CRM Webhook Sync] Background sync failed for customer ${customerId}:`, err);
    });
    // Return 200 OK immediately
    res.status(200).json({
        success: true,
        message: "Webhook received and scheduled for synchronization",
    });
}
/**
 * Handle new real-time CRM events consumer webhook.
 * Endpoint: POST /api/integrations/crm/events
 */
import { enqueueEvent } from "../../services/crm-queue.service.js";
export async function handleCrmEventsWebhook(req, res, next) {
    try {
        const { eventId, event, data } = req.body;
        if (!eventId || !event || !data) {
            res.status(400).json({
                success: false,
                error: { code: "BAD_REQUEST", message: "Missing eventId, event, or data in webhook payload" }
            });
            return;
        }
        // Enqueue event asynchronously (checks idempotency and logs to crm_sync_logs/crm_event_queue)
        // We do NOT await the actual processing. We just await the enqueue step.
        const enqueued = await enqueueEvent(eventId, event, data);
        res.status(200).json({
            success: true,
            message: enqueued ? "Event queued successfully" : "Event received (ignored or duplicate)",
            eventId
        });
    }
    catch (err) {
        // Never fail API because webhook processing fails. Just log error and return 200.
        console.error(`[CRM Webhook Error] Failed to handle CRM event:`, err);
        res.status(200).json({
            success: true,
            message: "Webhook received with internal processing exception",
            error: String(err),
        });
    }
}
