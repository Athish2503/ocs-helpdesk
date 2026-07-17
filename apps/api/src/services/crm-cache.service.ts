import { prisma } from "../config/prisma.js";
import * as crmService from "./crm.service.js";

/**
 * In-memory read-through cache for CRM entity data.
 *
 * IMPORTANT: Entries never expire via TTL. Invalidation is EXCLUSIVELY driven by
 * domain events received through the webhook → crm-queue.service.ts pipeline.
 * This guarantees that cached data is always current immediately after a CRM
 * CRUD operation commits, without any polling or time-based staleness window.
 */

class MemoryCache {
  private cache = new Map<string, any>();

  set(key: string, data: any): void {
    this.cache.set(key, data);
  }

  get(key: string): any | null {
    return this.cache.get(key) ?? null;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const customerCache = new MemoryCache();
const domainCache = new MemoryCache();
const serviceCache = new MemoryCache();
const subscriptionCache = new MemoryCache();
const creditCache = new MemoryCache();

export class CrmCacheManager {
  // Invalidate all caches for a given customer ID
  static invalidateAll(crmCustomerId: string): void {
    console.log(`[CRM Cache] Invalidating all caches for customer: ${crmCustomerId}`);
    customerCache.delete(crmCustomerId);
    domainCache.delete(crmCustomerId);
    serviceCache.delete(crmCustomerId);
    subscriptionCache.delete(crmCustomerId);
    creditCache.delete(crmCustomerId);
  }

  static invalidateCustomer(crmCustomerId: string): void {
    customerCache.delete(crmCustomerId);
  }

  static invalidateDomains(crmCustomerId: string): void {
    domainCache.delete(crmCustomerId);
  }

  static invalidateServices(crmCustomerId: string): void {
    serviceCache.delete(crmCustomerId);
    creditCache.delete(crmCustomerId);
  }

  static invalidateSubscriptions(crmCustomerId: string): void {
    subscriptionCache.delete(crmCustomerId);
    creditCache.delete(crmCustomerId);
  }
}

/**
 * Get customer domains from cache or fetch live from CRM APIs.
 */
export async function getOrFetchDomains(crmCustomerId: string): Promise<any[]> {
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

  const mappedDomains = domains.map((d: any) => ({
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
export async function getOrFetchServices(crmCustomerId: string): Promise<any[]> {
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

  const mappedServices = services.map((s: any) => ({
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
export async function getOrFetchSubscriptions(crmCustomerId: string): Promise<any[]> {
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

  const mappedSubscriptions = subscriptions.map((sub: any) => ({
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

export interface CreditCacheData {
  crmCustomerId: string;
  allocatedCredits: number;
  calculatedAt: string;
  expiresAt: string;
}

export async function getOrFetchCustomerCredits(crmCustomerId: string): Promise<CreditCacheData> {
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

  const creditData: CreditCacheData = {
    crmCustomerId,
    allocatedCredits,
    calculatedAt,
    expiresAt
  };

  creditCache.set(crmCustomerId, creditData);
  return creditData;
}

export async function syncUserCredits(userId: string, crmCustomerId: string | null) {
  let allocatedCredits = 0.0;
  if (crmCustomerId) {
    try {
      const creditData = await getOrFetchCustomerCredits(crmCustomerId);
      allocatedCredits = creditData.allocatedCredits;
    } catch (err) {
      console.error(`[CRM Cache] Error fetching CRM credits in syncUserCredits:`, err);
    }
  }

  // Calculate consumed and adjustments from credit_usages
  const usages = await prisma.creditUsage.findMany({
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

  return await prisma.customerCredits.upsert({
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
async function syncDomainsToDb(crmCustomerId: string, domains: any[]): Promise<void> {
  const syncedDomainIds = domains.map((d: any) => d.crmDomainId);
  await prisma.$transaction(async (tx) => {
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

async function syncServicesToDb(crmCustomerId: string, services: any[]): Promise<void> {
  const uniqueServiceMap = new Map<string, any>();
  const serviceDomainMap = new Map<string, Set<string>>();

  for (const s of services) {
    uniqueServiceMap.set(s.crmServiceId, s);
    if (s.domainName) {
      if (!serviceDomainMap.has(s.crmServiceId)) {
        serviceDomainMap.set(s.crmServiceId, new Set());
      }
      serviceDomainMap.get(s.crmServiceId)!.add(s.domainName);
    }
  }

  const uniqueServices = Array.from(uniqueServiceMap.values());
  const syncedServiceIds = uniqueServices.map((s) => s.crmServiceId);

  await prisma.$transaction(async (tx) => {
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

async function syncSubscriptionsToDb(crmCustomerId: string, subscriptions: any[]): Promise<void> {
  const syncedSubIds = subscriptions.map((s) => s.crmSubscriptionId);
  await prisma.$transaction(async (tx) => {
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
