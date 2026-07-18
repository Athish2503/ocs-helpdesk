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
exports.CrmCacheManager = void 0;
exports.getOrFetchDomains = getOrFetchDomains;
exports.getOrFetchServices = getOrFetchServices;
exports.getOrFetchSubscriptions = getOrFetchSubscriptions;
exports.getOrFetchCustomerCredits = getOrFetchCustomerCredits;
exports.syncUserCredits = syncUserCredits;
const prisma_js_1 = require("../config/prisma.js");
const crmService = __importStar(require("./crm.service.js"));
/**
 * In-memory read-through cache for CRM entity data.
 *
 * IMPORTANT: Entries never expire via TTL. Invalidation is EXCLUSIVELY driven by
 * domain events received through the webhook → crm-queue.service.ts pipeline.
 * This guarantees that cached data is always current immediately after a CRM
 * CRUD operation commits, without any polling or time-based staleness window.
 */
class MemoryCache {
    cache = new Map();
    set(key, data) {
        this.cache.set(key, data);
    }
    get(key) {
        return this.cache.get(key) ?? null;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
}
const customerCache = new MemoryCache();
const domainCache = new MemoryCache();
const serviceCache = new MemoryCache();
const subscriptionCache = new MemoryCache();
const creditCache = new MemoryCache();
class CrmCacheManager {
    // Invalidate all caches for a given customer ID
    static invalidateAll(crmCustomerId) {
        console.log(`[CRM Cache] Invalidating all caches for customer: ${crmCustomerId}`);
        customerCache.delete(crmCustomerId);
        domainCache.delete(crmCustomerId);
        serviceCache.delete(crmCustomerId);
        subscriptionCache.delete(crmCustomerId);
        creditCache.delete(crmCustomerId);
    }
    static invalidateCustomer(crmCustomerId) {
        customerCache.delete(crmCustomerId);
    }
    static invalidateDomains(crmCustomerId) {
        domainCache.delete(crmCustomerId);
    }
    static invalidateServices(crmCustomerId) {
        serviceCache.delete(crmCustomerId);
        creditCache.delete(crmCustomerId);
    }
    static invalidateSubscriptions(crmCustomerId) {
        subscriptionCache.delete(crmCustomerId);
        creditCache.delete(crmCustomerId);
    }
}
exports.CrmCacheManager = CrmCacheManager;
/**
 * Get customer domains from cache or fetch live from CRM APIs.
 */
async function getOrFetchDomains(crmCustomerId) {
    const cached = domainCache.get(crmCustomerId);
    if (cached) {
        console.log(`[CRM Cache] Serving domains from cache for customer: ${crmCustomerId}`);
        return cached;
    }
    console.log(`[CRM Cache] Cache miss. Fetching domains from CRM for customer: ${crmCustomerId}`);
    const response = await crmService.getCustomerDomains(crmCustomerId);
    // Extract domain array from various response formats
    const domains = Array.isArray(response)
        ? response
        : Array.isArray(response?.domains)
            ? response.domains
            : Array.isArray(response?.data)
                ? response.data
                : [];
    const mappedDomains = domains.map((d) => ({
        crmDomainId: d.domainId ? String(d.domainId) : (d.crmDomainId ? String(d.crmDomainId) : String(d.id || "")),
        domainName: d.domainName || d.name || d.domain || "",
        registeredWith: d.registeredWith || d.registered_with || "Others",
    }));
    domainCache.set(crmCustomerId, mappedDomains);
    // Sync to database in the background for database foreign-key integrity
    syncDomainsToDb(crmCustomerId, mappedDomains).catch(err => {
        console.error(`[CRM Cache] Error syncing domains to local DB for ${crmCustomerId}:`, err);
    });
    return mappedDomains;
}
/**
 * Get customer services from cache or fetch live from CRM APIs.
 */
async function getOrFetchServices(crmCustomerId) {
    const cached = serviceCache.get(crmCustomerId);
    if (cached) {
        console.log(`[CRM Cache] Serving services from cache for customer: ${crmCustomerId}`);
        return cached;
    }
    console.log(`[CRM Cache] Cache miss. Fetching services from CRM for customer: ${crmCustomerId}`);
    const response = await crmService.getCustomerServices(crmCustomerId);
    const services = Array.isArray(response)
        ? response
        : Array.isArray(response?.services)
            ? response.services
            : Array.isArray(response?.data)
                ? response.data
                : [];
    const mappedServices = services.map((s) => ({
        crmServiceId: s.serviceId ? String(s.serviceId) : (s.crmServiceId ? String(s.crmServiceId) : String(s.id || "")),
        name: s.serviceName || s.name || "",
        status: s.status || "ACTIVE",
        domainName: s.domainName || null,
    }));
    serviceCache.set(crmCustomerId, mappedServices);
    // Sync to database in the background
    syncServicesToDb(crmCustomerId, mappedServices).catch(err => {
        console.error(`[CRM Cache] Error syncing services to local DB for ${crmCustomerId}:`, err);
    });
    return mappedServices;
}
/**
 * Get customer subscriptions from cache or fetch live from CRM APIs.
 */
async function getOrFetchSubscriptions(crmCustomerId) {
    const cached = subscriptionCache.get(crmCustomerId);
    if (cached) {
        console.log(`[CRM Cache] Serving subscriptions from cache for customer: ${crmCustomerId}`);
        return cached;
    }
    console.log(`[CRM Cache] Cache miss. Fetching subscriptions from CRM for customer: ${crmCustomerId}`);
    const response = await crmService.getCustomerSubscriptions(crmCustomerId);
    const subscriptions = Array.isArray(response)
        ? response
        : Array.isArray(response?.subscriptions)
            ? response.subscriptions
            : Array.isArray(response?.data)
                ? response.data
                : [];
    const mappedSubscriptions = subscriptions.map((sub) => ({
        crmSubscriptionId: sub.subscriptionId ? String(sub.subscriptionId) : (sub.crmSubscriptionId ? String(sub.crmSubscriptionId) : String(sub.id || "")),
        planName: sub.planName || sub.domainName || sub.name || "Subscription Plan",
        status: sub.status || "ACTIVE",
        startDate: sub.startDate ? new Date(sub.startDate) : new Date(),
        endDate: sub.endDate ? new Date(sub.endDate) : null,
        services: sub.services || [],
    }));
    subscriptionCache.set(crmCustomerId, mappedSubscriptions);
    // Sync to database in the background
    syncSubscriptionsToDb(crmCustomerId, mappedSubscriptions).catch(err => {
        console.error(`[CRM Cache] Error syncing subscriptions to local DB for ${crmCustomerId}:`, err);
    });
    return mappedSubscriptions;
}
async function getOrFetchCustomerCredits(crmCustomerId) {
    const cached = creditCache.get(crmCustomerId);
    if (cached) {
        console.log(`[CRM Cache] Serving customer credits from cache for customer: ${crmCustomerId}`);
        return cached;
    }
    console.log(`[CRM Cache] Cache miss. Calculating customer credits from CRM subscriptions for: ${crmCustomerId}`);
    const subs = await getOrFetchSubscriptions(crmCustomerId);
    let allocatedCredits = 0;
    for (const sub of subs) {
        const statusUpper = String(sub.status || "").toUpperCase();
        if (statusUpper === "ACTIVE") {
            for (const svc of sub.services || []) {
                allocatedCredits += Number(svc.serviceCredit || svc.supportCreditHours || 0);
            }
        }
    }
    const now = new Date();
    const calculatedAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
    const creditData = {
        crmCustomerId,
        allocatedCredits,
        calculatedAt,
        expiresAt
    };
    creditCache.set(crmCustomerId, creditData);
    return creditData;
}
async function syncUserCredits(userId, crmCustomerId) {
    let allocatedCredits = 0.0;
    if (crmCustomerId) {
        try {
            const creditData = await getOrFetchCustomerCredits(crmCustomerId);
            allocatedCredits = creditData.allocatedCredits;
        }
        catch (err) {
            console.error(`[CRM Cache] Error fetching CRM credits in syncUserCredits:`, err);
        }
    }
    // Calculate consumed and adjustments from credit_usages
    const usages = await prisma_js_1.prisma.creditUsage.findMany({
        where: { crmCustomerId: crmCustomerId || "" }
    });
    const consumed = usages.reduce((sum, u) => sum + u.hoursConsumed, 0);
    const adjustments = usages.reduce((sum, u) => sum + u.adjustments, 0);
    const finalConsumed = Math.max(0, consumed - adjustments);
    let remaining = allocatedCredits - finalConsumed;
    let billable = 0.0;
    if (remaining < 0) {
        billable = Math.abs(remaining);
        remaining = 0.0;
    }
    return await prisma_js_1.prisma.customerCredits.upsert({
        where: { customerId: userId },
        update: {
            allocatedHours: allocatedCredits,
            usedHours: finalConsumed,
            remainingHours: remaining,
            billableHours: billable,
        },
        create: {
            customerId: userId,
            allocatedHours: allocatedCredits,
            usedHours: finalConsumed,
            remainingHours: remaining,
            billableHours: billable,
        },
    });
}
/**
 * Local DB Synchronization Helpers (runs in background to satisfy FK constraints)
 */
async function syncDomainsToDb(crmCustomerId, domains) {
    const syncedDomainIds = domains.map((d) => d.crmDomainId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        // Delete local domains not in CRM anymore
        await tx.crmDomain.deleteMany({
            where: {
                crmCustomerId,
                crmDomainId: { notIn: syncedDomainIds },
            },
        });
        // Upsert the current list
        for (const d of domains) {
            await tx.crmDomain.upsert({
                where: { crmDomainId: d.crmDomainId },
                create: {
                    crmDomainId: d.crmDomainId,
                    domainName: d.domainName,
                    crmCustomerId,
                    registeredWith: d.registeredWith || "Others",
                },
                update: {
                    domainName: d.domainName,
                    registeredWith: d.registeredWith || "Others",
                },
            });
        }
    });
}
async function syncServicesToDb(crmCustomerId, services) {
    const uniqueServiceMap = new Map();
    const serviceDomainMap = new Map();
    for (const s of services) {
        uniqueServiceMap.set(s.crmServiceId, s);
        if (s.domainName) {
            if (!serviceDomainMap.has(s.crmServiceId)) {
                serviceDomainMap.set(s.crmServiceId, new Set());
            }
            serviceDomainMap.get(s.crmServiceId).add(s.domainName);
        }
    }
    const uniqueServices = Array.from(uniqueServiceMap.values());
    const syncedServiceIds = uniqueServices.map((s) => s.crmServiceId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        await tx.crmService.deleteMany({
            where: {
                crmCustomerId,
                crmServiceId: { notIn: syncedServiceIds },
            },
        });
        for (const s of uniqueServices) {
            const domainsSet = serviceDomainMap.get(s.crmServiceId);
            const joinedDomains = domainsSet ? Array.from(domainsSet).join(",") : null;
            await tx.crmService.upsert({
                where: { crmServiceId: s.crmServiceId },
                create: {
                    crmServiceId: s.crmServiceId,
                    name: s.name,
                    status: s.status,
                    crmCustomerId,
                    domainName: joinedDomains,
                },
                update: {
                    name: s.name,
                    status: s.status,
                    domainName: joinedDomains,
                },
            });
        }
    });
}
async function syncSubscriptionsToDb(crmCustomerId, subscriptions) {
    const syncedSubIds = subscriptions.map((s) => s.crmSubscriptionId);
    await prisma_js_1.prisma.$transaction(async (tx) => {
        await tx.crmSubscription.deleteMany({
            where: {
                crmCustomerId,
                crmSubscriptionId: { notIn: syncedSubIds },
            },
        });
        for (const sub of subscriptions) {
            await tx.crmSubscription.upsert({
                where: { crmSubscriptionId: sub.crmSubscriptionId },
                create: {
                    crmSubscriptionId: sub.crmSubscriptionId,
                    planName: sub.planName,
                    status: sub.status,
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    crmCustomerId,
                },
                update: {
                    planName: sub.planName,
                    status: sub.status,
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                },
            });
        }
    });
}
