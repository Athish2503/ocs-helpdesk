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
Object.defineProperty(exports, "__esModule", { value: true });
exports.enqueueEvent = enqueueEvent;
exports.processQueueAsync = processQueueAsync;
exports.startQueueScheduler = startQueueScheduler;
const prisma_js_1 = require("../config/prisma.js");
const crmService = __importStar(require("./crm.service.js"));
const crm_cache_service_js_1 = require("./crm-cache.service.js");
/**
 * Enqueue a new webhook event for background processing.
 * Logs the receipt of the event in crm_sync_logs for idempotency and audits.
 */
async function enqueueEvent(eventId, event, payload) {
    const crmCustomerId = payload.crmCustomerId || payload.customerId || payload.id || payload.crmCustomer?.crmCustomerId;
    const entity = event.split(".")[0] || "unknown";
    const entityId = crmCustomerId || "unknown";
    try {
        // 1. Idempotency Check: check if event has already been logged/processed
        const existingLog = await prisma_js_1.prisma.crmSyncLog.findUnique({
            where: { eventId }
        });
        if (existingLog) {
            console.log(`[CRM Queue] Duplicate event detected and ignored: ${eventId}`);
            return false; // Already processed or queued
        }
        // 2. Insert into event queue table
        await prisma_js_1.prisma.crmEventQueue.create({
            data: {
                eventId,
                event,
                payload: JSON.stringify(payload),
                status: "PENDING",
            }
        });
        // 3. Create initial log entry in crm_sync_logs
        await prisma_js_1.prisma.crmSyncLog.create({
            data: {
                eventId,
                entity,
                entityId,
                status: "QUEUED",
            }
        });
        console.log(`[CRM Queue] Event ${eventId} (${event}) queued successfully for customer: ${entityId}`);
        // 4. Trigger processing in the background asynchronously
        processQueueAsync().catch(err => {
            console.error(`[CRM Queue] Background execution failed:`, err);
        });
        return true;
    }
    catch (err) {
        console.error(`[CRM Queue] Error queuing event ${eventId}:`, err);
        return false;
    }
}
/**
 * Process all pending events in the queue in chronological order.
 */
async function processQueueAsync() {
    try {
        const pendingEvents = await prisma_js_1.prisma.crmEventQueue.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
        });
        for (const eventItem of pendingEvents) {
            await processEventItem(eventItem);
        }
    }
    catch (err) {
        console.error(`[CRM Queue] Error fetching pending events:`, err);
    }
}
/**
 * Single event item processing logic.
 */
async function processEventItem(eventItem) {
    const { eventId, event, payload } = eventItem;
    const data = JSON.parse(payload);
    const crmCustomerId = data.crmCustomerId || data.customerId || data.id || data.crmCustomer?.crmCustomerId;
    const entity = event.split(".")[0] || "unknown";
    const entityId = crmCustomerId || "unknown";
    // Mark status as PROCESSING in queue
    await prisma_js_1.prisma.crmEventQueue.update({
        where: { id: eventItem.id },
        data: { status: "PROCESSING" }
    });
    try {
        console.log(`[CRM Queue] Processing event ${eventId} (${event})...`);
        // Process depending on the event name
        switch (event) {
            case "customer.created":
                await handleCustomerCreatedEvent(crmCustomerId);
                break;
            case "customer.updated":
                await handleCustomerUpdatedEvent(crmCustomerId, data);
                break;
            case "customer.activated":
                await handleCustomerStatusChange(crmCustomerId, "ACTIVE");
                break;
            case "customer.deactivated":
                await handleCustomerStatusChange(crmCustomerId, "DEACTIVATED");
                break;
            // Domain events
            case "domain.created":
            case "domain.updated":
            case "domain.deleted":
                if (crmCustomerId) {
                    crm_cache_service_js_1.CrmCacheManager.invalidateDomains(crmCustomerId);
                }
                break;
            // Service events
            case "service.created":
            case "service.updated":
            case "service.deleted":
                if (crmCustomerId) {
                    crm_cache_service_js_1.CrmCacheManager.invalidateServices(crmCustomerId);
                    if (event === "service.updated") {
                        (0, crm_cache_service_js_1.getOrFetchCustomerCredits)(crmCustomerId).catch(err => {
                            console.error(`[CRM Cache] Error pre-calculating customer credits after service.updated:`, err);
                        });
                    }
                }
                break;
            // Subscription events
            case "subscription.created":
            case "subscription.updated":
            case "subscription.deleted":
            case "subscription.renewed":
            case "subscription.cancelled":
                if (crmCustomerId) {
                    crm_cache_service_js_1.CrmCacheManager.invalidateSubscriptions(crmCustomerId);
                    if (["subscription.created", "subscription.updated", "subscription.deleted", "subscription.renewed"].includes(event)) {
                        (0, crm_cache_service_js_1.getOrFetchCustomerCredits)(crmCustomerId).catch(err => {
                            console.error(`[CRM Cache] Error pre-calculating customer credits after subscription event:`, err);
                        });
                    }
                }
                break;
            default:
                console.warn(`[CRM Queue] Event ${event} is unsupported but marked processed.`);
        }
        // Update log state to PROCESSED
        await prisma_js_1.prisma.crmSyncLog.update({
            where: { eventId },
            data: {
                status: "PROCESSED",
                processedAt: new Date(),
                errors: null,
            }
        });
        // Remove event from active queue
        await prisma_js_1.prisma.crmEventQueue.delete({
            where: { id: eventItem.id }
        });
        console.log(`[CRM Queue] Successfully processed event ${eventId} (${event})`);
    }
    catch (err) {
        const errorMsg = err.message || String(err);
        console.error(`[CRM Queue] Failed processing event ${eventId} (${event}):`, errorMsg);
        // Update event queue state to FAILED
        await prisma_js_1.prisma.crmEventQueue.update({
            where: { id: eventItem.id },
            data: {
                status: "FAILED",
                retryCount: { increment: 1 },
                lastError: errorMsg,
            }
        });
        // Update logs
        await prisma_js_1.prisma.crmSyncLog.update({
            where: { eventId },
            data: {
                status: "FAILED",
                processedAt: new Date(),
                errors: errorMsg,
            }
        });
    }
}
/**
 * Event Handlers
 */
async function handleCustomerCreatedEvent(crmCustomerId) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for customer.created");
    // Call CRM service sync customer data to fetch full profile summary and populate databases
    await crmService.syncCustomerData(crmCustomerId);
    // Clean cache to start fresh
    crm_cache_service_js_1.CrmCacheManager.invalidateAll(crmCustomerId);
}
async function handleCustomerUpdatedEvent(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for customer.updated");
    // Validate required non-nullable fields
    if (data.displayName === null || data.displayName === "") {
        throw new Error("displayName cannot be null or empty");
    }
    if (data.primaryEmail === null || data.primaryEmail === "") {
        throw new Error("primaryEmail cannot be null or empty");
    }
    // Invalidate in-memory caches to force fetch CRM on next Details load
    crm_cache_service_js_1.CrmCacheManager.invalidateAll(crmCustomerId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        // 1. Locate CrmCustomer local mirror
        const existing = await tx.crmCustomer.findUnique({
            where: { crmCustomerId }
        });
        if (!existing) {
            throw new Error(`Customer local mirror not found for: ${crmCustomerId}`);
        }
        // 2. Update allowed fields ONLY
        const updatedCrmCustomer = await tx.crmCustomer.update({
            where: { id: existing.id },
            data: {
                displayName: data.displayName !== undefined ? data.displayName : existing.displayName,
                companyName: data.companyName !== undefined ? data.companyName : existing.companyName,
                primaryEmail: data.primaryEmail !== undefined ? data.primaryEmail : existing.primaryEmail,
                secondaryEmail: data.secondaryEmail !== undefined ? data.secondaryEmail : existing.secondaryEmail,
                primaryPhone: data.primaryPhone !== undefined ? data.primaryPhone : existing.primaryPhone,
                secondaryPhone: data.secondaryPhone !== undefined ? data.secondaryPhone : existing.secondaryPhone,
                customerStatus: data.status || data.customerStatus || existing.customerStatus,
                crmUpdatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
                lastSyncedAt: new Date(),
            }
        });
        // 3. Update related User record if exists (do not overwrite Password, Role, Credits, SLA etc.)
        const user = await tx.user.findUnique({
            where: { crmCustomerId }
        });
        if (user) {
            const status = (data.status || data.customerStatus || "").toUpperCase();
            const shouldDeactivate = status === "DEACTIVATED" || status === "INACTIVE" || status === "SUSPENDED";
            const shouldActivate = status === "ACTIVE";
            await tx.user.update({
                where: { id: user.id },
                data: {
                    name: data.displayName !== undefined ? data.displayName : user.name,
                    email: data.primaryEmail !== undefined ? data.primaryEmail : user.email,
                    phoneNumber: data.primaryPhone !== undefined ? data.primaryPhone : user.phoneNumber,
                    isActive: shouldDeactivate ? false : (shouldActivate ? true : user.isActive),
                }
            });
        }
    });
}
async function handleCustomerStatusChange(crmCustomerId, status) {
    if (!crmCustomerId)
        throw new Error(`Missing crmCustomerId for customer status change to ${status}`);
    crm_cache_service_js_1.CrmCacheManager.invalidateAll(crmCustomerId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        // 1. Update customer mirror status
        await tx.crmCustomer.updateMany({
            where: { crmCustomerId },
            data: {
                customerStatus: status,
                lastSyncedAt: new Date(),
            }
        });
        // 2. Activate or Deactivate linked User
        const user = await tx.user.findUnique({
            where: { crmCustomerId }
        });
        if (user) {
            await tx.user.update({
                where: { id: user.id },
                data: {
                    isActive: status === "ACTIVE"
                }
            });
        }
    });
}
/**
 * Start the background polling queue retry manager.
 * Searches for FAILED queue items with less than 5 retry attempts and runs them.
 */
function startQueueScheduler() {
    console.log("[CRM Queue] Starting background queue retry scheduler (Runs every 60s)...");
    setInterval(async () => {
        try {
            const failedJobs = await prisma_js_1.prisma.crmEventQueue.findMany({
                where: {
                    status: "FAILED",
                    retryCount: { lt: 5 }
                },
                orderBy: { updatedAt: "asc" },
                take: 10
            });
            if (failedJobs.length > 0) {
                console.log(`[CRM Queue] Scheduler found ${failedJobs.length} failed jobs to retry.`);
                for (const job of failedJobs) {
                    // Reset status to PENDING so it gets picked up
                    await prisma_js_1.prisma.crmEventQueue.update({
                        where: { id: job.id },
                        data: { status: "PENDING" }
                    });
                    await processEventItem(job);
                }
            }
        }
        catch (err) {
            console.error("[CRM Queue] Error in scheduler loop:", err);
        }
    }, 60000); // 60 seconds
}
