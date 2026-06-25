"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCrmSignature = validateCrmSignature;
const crypto_1 = __importDefault(require("crypto"));
function validateCrmSignature(req, res, next) {
    const signature = req.headers["x-crm-signature"];
    const secret = process.env["CRM_WEBHOOK_SECRET"] || "dev-crm-secret-key-change-me";
    // Allow bypass in local development if header is 'test-signature'
    if (process.env["NODE_ENV"] === "development" && signature === "test-signature") {
        return next();
    }
    if (!signature) {
        res.status(401).json({
            success: false,
            error: { code: "UNAUTHORIZED", message: "CRM webhook signature header is missing." },
        });
        return;
    }
    try {
        const rawBody = JSON.stringify(req.body);
        const computedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");
        if (signature !== computedSignature) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Invalid CRM webhook signature." },
            });
            return;
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
