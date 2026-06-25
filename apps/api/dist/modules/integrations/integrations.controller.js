"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCrmWebhook = handleCrmWebhook;
const crypto_1 = __importDefault(require("crypto"));
const crmService = __importStar(require("../../services/crm.service.js"));
/**
 * Handle incoming real-time customer event webhooks from the CRM (Subsync).
 */
async function handleCrmWebhook(req, res, next) {
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
    const computedSignature = crypto_1.default.createHmac("sha256", secret).update(rawMessage).digest("hex");
    try {
        const headerBuffer = Buffer.from(signatureHeader, "hex");
        const computedBuffer = Buffer.from(computedSignature, "hex");
        if (headerBuffer.length !== computedBuffer.length || !crypto_1.default.timingSafeEqual(headerBuffer, computedBuffer)) {
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
