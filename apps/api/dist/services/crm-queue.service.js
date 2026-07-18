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
const sse_service_js_1 = require("./sse.service.js");
/**
 * Enqueue a new webhook event for background processing.
 * Logs the receipt of the event in crm_sync_logs for idempotency and audits.
 */
async function enqueueEvent(eventId, event, payload) {
    const crmCustomerId = payload.crmCustomerId || payload.customerId || payload.id || payload.crmCustomer?.crmCustomerId;
    const entity = event.split(".")[0] || "unknown";
    const entityId = payload.data?.entityId || payload.entityId || crmCustomerId || "unknown";
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
        // 4. Trigger processing in the background asynchronously (non-blocking)
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
 * Parses the payload, dispatches to the correct entity handler,
 * updates the sync log, removes the item from the queue, and pushes SSE.
 */
async function processEventItem(eventItem) {
    const { eventId, event, payload } = eventItem;
    const data = typeof payload === "string" ? JSON.parse(payload) : payload;
    // Normalise: events from the new CRM have a nested `data` field
    const entityData = data.data || data;
    const crmCustomerId = entityData.crmCustomerId || data.crmCustomerId || data.customerId || data.id;
    const entity = event.split(".")[0] || "unknown";
    const entityId = data.entityId || crmCustomerId || "unknown";
    const startedAt = Date.now();
    // Mark status as PROCESSING in queue
    await prisma_js_1.prisma.crmEventQueue.update({
        where: { id: eventItem.id },
        data: { status: "PROCESSING" }
    });
    try {
        console.log(`[CRM Queue] Processing event ${eventId} (${event}) for ${entity}=${entityId}...`);
        // Dispatch to the correct entity handler
        switch (event) {
            // ── Customer events ─────────────────────────────────────────────────────
            case "customer.created":
                await handleCustomerCreatedEvent(crmCustomerId);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "customer", operation: "created", crmCustomerId });
                break;
            case "customer.updated":
                await handleCustomerUpdatedEvent(crmCustomerId, entityData);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "customer", operation: "updated", crmCustomerId });
                break;
            case "customer.activated":
                await handleCustomerStatusChange(crmCustomerId, "ACTIVE");
                notifyClient(crmCustomerId, "crm.sync", { entityType: "customer", operation: "activated", crmCustomerId });
                break;
            case "customer.deactivated":
                await handleCustomerStatusChange(crmCustomerId, "DEACTIVATED");
                notifyClient(crmCustomerId, "crm.sync", { entityType: "customer", operation: "deactivated", crmCustomerId });
                break;
            // ── Domain events ────────────────────────────────────────────────────────
            case "domain.created":
                await handleDomainUpsert(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateDomains(crmCustomerId);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "domain", operation: "created", crmCustomerId });
                break;
            case "domain.updated":
                await handleDomainUpsert(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateDomains(crmCustomerId);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "domain", operation: "updated", crmCustomerId });
                break;
            case "domain.deleted":
                await handleDomainDeleted(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateDomains(crmCustomerId);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "domain", operation: "deleted", crmCustomerId });
                break;
            // ── Subscription events ──────────────────────────────────────────────────
            case "subscription.created":
                await handleSubscriptionUpsert(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateSubscriptions(crmCustomerId);
                await (0, crm_cache_service_js_1.getOrFetchCustomerCredits)(crmCustomerId).catch(err => console.error(`[CRM Queue] Error recalculating credits after subscription.created:`, err));
                notifyClient(crmCustomerId, "crm.sync", { entityType: "subscription", operation: "created", crmCustomerId });
                break;
            case "subscription.updated":
            case "subscription.renewed":
                await handleSubscriptionUpsert(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateSubscriptions(crmCustomerId);
                await (0, crm_cache_service_js_1.getOrFetchCustomerCredits)(crmCustomerId).catch(err => console.error(`[CRM Queue] Error recalculating credits after subscription update:`, err));
                notifyClient(crmCustomerId, "crm.sync", { entityType: "subscription", operation: event === "subscription.renewed" ? "renewed" : "updated", crmCustomerId });
                break;
            case "subscription.cancelled":
            case "subscription.deleted":
                await handleSubscriptionDeleted(crmCustomerId, entityData);
                crm_cache_service_js_1.CrmCacheManager.invalidateSubscriptions(crmCustomerId);
                notifyClient(crmCustomerId, "crm.sync", { entityType: "subscription", operation: event === "subscription.deleted" ? "deleted" : "cancelled", crmCustomerId });
                break;
            // ── Service events ───────────────────────────────────────────────────────
            case "service.created":
            case "service.updated":
                await handleServiceUpsert(entityData);
                // Service definitions are global — broadcast to all connected clients
                sse_service_js_1.sseManager.broadcastToAll("crm.sync", { entityType: "service", operation: event === "service.created" ? "created" : "updated" });
                break;
            case "service.deleted":
                await handleServiceDeleted(entityData);
                sse_service_js_1.sseManager.broadcastToAll("crm.sync", { entityType: "service", operation: "deleted" });
                break;
            default:
                console.warn(`[CRM Queue] Event '${event}' is unsupported but marked processed.`);
        }
        const durationMs = Date.now() - startedAt;
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
        console.log(`[CRM Queue] Successfully processed event ${eventId} (${event}) in ${durationMs}ms`);
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
        // Update sync log
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
// ── Helper: push SSE to a specific CRM customer ─────────────────────────────
function notifyClient(crmCustomerId, eventName, payload) {
    if (!crmCustomerId)
        return;
    sse_service_js_1.sseManager.broadcastToCrmCustomer(crmCustomerId, eventName, {
        ...payload,
        timestamp: new Date().toISOString(),
    });
}
// ──────────────────────────────────────────────────────────────────────────────
// Entity Event Handlers — full DB upsert/delete per entity (NOT a full re-sync)
// ──────────────────────────────────────────────────────────────────────────────
async function handleCustomerCreatedEvent(crmCustomerId) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for customer.created");
    // Full sync: fetch from CRM API and populate all related tables
    await crmService.syncCustomerData(crmCustomerId);
    crm_cache_service_js_1.CrmCacheManager.invalidateAll(crmCustomerId);
}
async function handleCustomerUpdatedEvent(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for customer.updated");
    if (data.displayName === null || data.displayName === "") {
        throw new Error("displayName cannot be null or empty");
    }
    if (data.primaryEmail === null || data.primaryEmail === "") {
        throw new Error("primaryEmail cannot be null or empty");
    }
    crm_cache_service_js_1.CrmCacheManager.invalidateAll(crmCustomerId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        const existing = await tx.crmCustomer.findUnique({ where: { crmCustomerId } });
        if (!existing) {
            // Customer doesn't exist in mirror yet — do a full sync
            await crmService.syncCustomerData(crmCustomerId);
            return;
        }
        await tx.crmCustomer.update({
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
        const user = await tx.user.findUnique({ where: { crmCustomerId } });
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
        await tx.crmCustomer.updateMany({
            where: { crmCustomerId },
            data: { customerStatus: status, lastSyncedAt: new Date() }
        });
        const user = await tx.user.findUnique({ where: { crmCustomerId } });
        if (user) {
            await tx.user.update({
                where: { id: user.id },
                data: { isActive: status === "ACTIVE" }
            });
        }
    });
}
// ── Domain Handlers ──────────────────────────────────────────────────────────
async function handleDomainUpsert(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for domain upsert");
    const crmDomainId = String(data.crmDomainId || data.domain_id || data.domainId || "");
    if (!crmDomainId)
        throw new Error("Missing crmDomainId for domain upsert");
    // Verify the parent CrmCustomer exists before upserting (required for FK)
    const crmCustomer = await prisma_js_1.prisma.crmCustomer.findUnique({
        where: { crmCustomerId },
        select: { crmCustomerId: true },
    });
    if (!crmCustomer) {
        throw new Error(`No local CrmCustomer found for crmCustomerId=${crmCustomerId}. Cannot upsert domain.`);
    }
    await prisma_js_1.prisma.crmDomain.upsert({
        where: { crmDomainId },
        create: {
            crmDomainId,
            domainName: data.domainName || data.domain_name || "",
            registeredWith: data.registeredWith || data.registered_with || "Others",
            crmCustomerId,
        },
        update: {
            domainName: data.domainName || data.domain_name || "",
            registeredWith: data.registeredWith || data.registered_with || "Others",
        },
    });
    console.log(`[CRM Queue] Domain upserted: crmDomainId=${crmDomainId} for customer=${crmCustomerId}`);
}
async function handleDomainDeleted(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for domain delete");
    const crmDomainId = String(data.crmDomainId || data.domain_id || data.domainId || "");
    if (!crmDomainId)
        throw new Error("Missing crmDomainId for domain delete");
    await prisma_js_1.prisma.crmDomain.deleteMany({
        where: { crmDomainId },
    });
    console.log(`[CRM Queue] Domain deleted: crmDomainId=${crmDomainId} for customer=${crmCustomerId}`);
}
// ── Subscription Handlers ────────────────────────────────────────────────────
async function handleSubscriptionUpsert(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for subscription upsert");
    const crmSubscriptionId = String(data.crmSubscriptionId || data.sub_id || data.id || "");
    if (!crmSubscriptionId)
        throw new Error("Missing crmSubscriptionId for subscription upsert");
    // Verify the parent CrmCustomer exists before upserting (required for FK)
    const crmCustomer = await prisma_js_1.prisma.crmCustomer.findUnique({
        where: { crmCustomerId },
        select: { crmCustomerId: true },
    });
    if (!crmCustomer) {
        throw new Error(`No local CrmCustomer found for crmCustomerId=${crmCustomerId}. Cannot upsert subscription.`);
    }
    const statusMap = {
        ACTIVE: "ACTIVE",
        CANCELLED: "CANCELLED",
        CANCELED: "CANCELLED",
        EXPIRED: "EXPIRED",
        INACTIVE: "INACTIVE",
        PENDING: "PENDING",
    };
    const mappedStatus = statusMap[(data.status || "ACTIVE").toUpperCase()] || "ACTIVE";
    await prisma_js_1.prisma.crmSubscription.upsert({
        where: { crmSubscriptionId },
        create: {
            crmSubscriptionId,
            planName: data.planName || data.domain_name || "Subscription Plan",
            status: mappedStatus,
            startDate: data.startDate || data.start_date ? new Date(data.startDate || data.start_date) : new Date(),
            endDate: (data.endDate || data.end_date) ? new Date(data.endDate || data.end_date) : null,
            crmCustomerId,
        },
        update: {
            planName: data.planName || data.domain_name || undefined,
            status: mappedStatus,
            startDate: (data.startDate || data.start_date) ? new Date(data.startDate || data.start_date) : undefined,
            endDate: data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined,
        },
    });
    console.log(`[CRM Queue] Subscription upserted: crmSubscriptionId=${crmSubscriptionId} for customer=${crmCustomerId}`);
}
async function handleSubscriptionDeleted(crmCustomerId, data) {
    if (!crmCustomerId)
        throw new Error("Missing crmCustomerId for subscription delete");
    const crmSubscriptionId = String(data.crmSubscriptionId || data.sub_id || data.id || "");
    if (!crmSubscriptionId)
        throw new Error("Missing crmSubscriptionId for subscription delete");
    await prisma_js_1.prisma.crmSubscription.deleteMany({
        where: { crmSubscriptionId },
    });
    console.log(`[CRM Queue] Subscription deleted: crmSubscriptionId=${crmSubscriptionId} for customer=${crmCustomerId}`);
}
// ── Service Handlers (Global — no customer scope) ────────────────────────────
async function handleServiceUpsert(data) {
    const crmServiceId = String(data.crmServiceId || data.service_id || data.id || "");
    if (!crmServiceId)
        throw new Error("Missing crmServiceId for service upsert");
    // Services are global (not customer-scoped in the schema) — upsert without customerId
    await prisma_js_1.prisma.crmService.upsert({
        where: { crmServiceId },
        create: {
            crmServiceId,
            name: data.name || data.service_name || "",
            status: data.status || "ACTIVE",
            domainName: data.domainName || data.domain_name || null,
            // crmCustomerId is required by schema — use a GLOBAL sentinel for unscoped services
            crmCustomerId: "GLOBAL",
        },
        update: {
            name: data.name || data.service_name || undefined,
            status: data.status || "ACTIVE",
            domainName: data.domainName !== undefined ? (data.domainName || null) : undefined,
        },
    });
    console.log(`[CRM Queue] Service upserted: crmServiceId=${crmServiceId}`);
}
async function handleServiceDeleted(data) {
    const crmServiceId = String(data.crmServiceId || data.service_id || data.id || "");
    if (!crmServiceId)
        throw new Error("Missing crmServiceId for service delete");
    await prisma_js_1.prisma.crmService.deleteMany({
        where: { crmServiceId },
    });
    console.log(`[CRM Queue] Service deleted: crmServiceId=${crmServiceId}`);
}
// ── Background Retry Scheduler ───────────────────────────────────────────────
/**
 * Start the background queue retry manager.
 * Searches for FAILED queue items with less than 5 retry attempts and re-queues them.
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
