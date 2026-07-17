import * as SyncService from "../modules/sync/sync.service.js";

const CRM_API_URL = process.env.CRM_API_URL || "http://localhost:3000";
const CRM_API_KEY = process.env.CRM_API_KEY || "dev-crm-api-key";

/**
 * Generic request helper to consume CRM APIs.
 */
async function crmRequest(path: string, options: RequestInit = {}) {
  const url = `${CRM_API_URL}${path}`;
  const headers = {
    "X-API-Key": CRM_API_KEY,
    "Authorization": `Bearer ${CRM_API_KEY}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    throw new Error(`CRM API request failed with status ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch all customers with optional pagination, search, and status.
 */
export async function getCustomers(params?: { page?: number; limit?: number; search?: string; status?: string }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.search) searchParams.append("search", params.search);
  if (params?.status) searchParams.append("status", params.status);

  const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return crmRequest(`/api/helpdesk/customers${query}`);
}

/**
 * Fetch customer profile details by ID.
 */
export async function getCustomerById(customerId: string) {
  return crmRequest(`/api/helpdesk/customers/${customerId}`);
}

/**
 * Fetch list of domains for a customer.
 */
export async function getCustomerDomains(customerId: string) {
  return crmRequest(`/api/helpdesk/customers/${customerId}/domains`);
}

/**
 * Fetch list of subscriptions for a customer.
 */
export async function getCustomerSubscriptions(customerId: string) {
  return crmRequest(`/api/helpdesk/customers/${customerId}/subscriptions`);
}

/**
 * Fetch list of services for a customer.
 */
export async function getCustomerServices(customerId: string) {
  return crmRequest(`/api/helpdesk/customers/${customerId}/services`);
}

/**
 * Fetch consolidated customer summary (Profile, Domains, Subscriptions, Services).
 */
export async function getCustomerSummary(customerId: string) {
  return crmRequest(`/api/helpdesk/customers/${customerId}/summary`);
}

/**
 * Ingest summary payload from CRM and run local upsert/deactivation logic.
 */
export async function syncCustomerData(customerId: string): Promise<void> {
  try {
    const response = await getCustomerSummary(customerId);
    if (!response || !response.success || !response.summary) {
      console.error(`[CRM Sync] Failed to get customer summary for ${customerId}`, response);
      return;
    }

    const { customer, domains, subscriptions } = response.summary;

    // Extract services from nested subscriptions to map them to the proper domain
    const extractedServices: any[] = [];
    for (const sub of subscriptions || []) {
      for (const s of sub.services || []) {
        extractedServices.push({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          SKU: s.SKU,
          domainName: sub.domainName || null,
        });
      }
    }

    const payload = {
      crmCustomerId: customer.customerId,
      companyName: customer.companyName || null,
      displayName: customer.displayName,
      primaryEmail: customer.primaryEmail,
      secondaryEmail: customer.secondaryEmail || null,
      primaryPhone: customer.primaryPhone || null,
      secondaryPhone: customer.secondaryPhone || null,
      customerStatus: customer.status || "ACTIVE",
      crmUpdatedAt: customer.updatedAt || null,
      domains: (domains || []).map((d: any) => ({
        crmDomainId: d.domainId ? String(d.domainId) : "",
        domainName: d.domainName,
        registeredWith: d.registeredWith || d.registered_with || "Others",
      })),
      services: extractedServices.map((s: any) => ({
        crmServiceId: s.serviceId ? String(s.serviceId) : "",
        name: s.serviceName,
        status: "ACTIVE", // Default fallback required by DB schema
        domainName: s.domainName || null,
      })),
      subscriptions: (subscriptions || []).map((sub: any) => ({
        crmSubscriptionId: sub.subscriptionId ? String(sub.subscriptionId) : "",
        planName: sub.domainName || "Subscription Plan",
        status: sub.status || "ACTIVE",
        startDate: sub.startDate,
        endDate: sub.endDate || null,
      })),
    };

    const uppercaseStatus = (customer.status || "").toUpperCase();
    if (uppercaseStatus === "DEACTIVATED" || uppercaseStatus === "INACTIVE" || uppercaseStatus === "SUSPENDED") {
      await SyncService.handleCustomerDeactivated(customer.customerId);
    } else {
      await SyncService.handleCustomerCreated(payload);
    }
    console.log(`[CRM Sync] Successfully sync'd customer ${customerId}`);
  } catch (error) {
    console.error(`[CRM Sync] Error syncing customer ${customerId}:`, error);
  }
}
