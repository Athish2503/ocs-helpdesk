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
exports.getCustomers = getCustomers;
exports.getCustomerById = getCustomerById;
exports.getCustomerDomains = getCustomerDomains;
exports.getCustomerSubscriptions = getCustomerSubscriptions;
exports.getCustomerServices = getCustomerServices;
exports.getCustomerSummary = getCustomerSummary;
exports.syncCustomerData = syncCustomerData;
const SyncService = __importStar(require("../modules/sync/sync.service.js"));
const CRM_API_URL = process.env.CRM_API_URL || "http://localhost:3000";
const CRM_API_KEY = process.env.CRM_API_KEY || "dev-crm-api-key";
/**
 * Generic request helper to consume CRM APIs.
 */
async function crmRequest(path, options = {}) {
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
async function getCustomers(params) {
    const searchParams = new URLSearchParams();
    if (params?.page)
        searchParams.append("page", params.page.toString());
    if (params?.limit)
        searchParams.append("limit", params.limit.toString());
    if (params?.search)
        searchParams.append("search", params.search);
    if (params?.status)
        searchParams.append("status", params.status);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return crmRequest(`/api/helpdesk/customers${query}`);
}
/**
 * Fetch customer profile details by ID.
 */
async function getCustomerById(customerId) {
    return crmRequest(`/api/helpdesk/customers/${customerId}`);
}
/**
 * Fetch list of domains for a customer.
 */
async function getCustomerDomains(customerId) {
    return crmRequest(`/api/helpdesk/customers/${customerId}/domains`);
}
/**
 * Fetch list of subscriptions for a customer.
 */
async function getCustomerSubscriptions(customerId) {
    return crmRequest(`/api/helpdesk/customers/${customerId}/subscriptions`);
}
/**
 * Fetch list of services for a customer.
 */
async function getCustomerServices(customerId) {
    return crmRequest(`/api/helpdesk/customers/${customerId}/services`);
}
/**
 * Fetch consolidated customer summary (Profile, Domains, Subscriptions, Services).
 */
async function getCustomerSummary(customerId) {
    return crmRequest(`/api/helpdesk/customers/${customerId}/summary`);
}
/**
 * Ingest summary payload from CRM and run local upsert/deactivation logic.
 */
async function syncCustomerData(customerId) {
    try {
        const response = await getCustomerSummary(customerId);
        if (!response || !response.success || !response.summary) {
            console.error(`[CRM Sync] Failed to get customer summary for ${customerId}`, response);
            return;
        }
        const { customer, domains, subscriptions } = response.summary;
        // Extract services from nested subscriptions to map them to the proper domain
        const extractedServices = [];
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
            domains: (domains || []).map((d) => ({
                crmDomainId: d.domainId ? String(d.domainId) : "",
                domainName: d.domainName,
            })),
            services: extractedServices.map((s) => ({
                crmServiceId: s.serviceId ? String(s.serviceId) : "",
                name: s.serviceName,
                status: "ACTIVE", // Default fallback required by DB schema
                domainName: s.domainName || null,
            })),
            subscriptions: (subscriptions || []).map((sub) => ({
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
        }
        else {
            await SyncService.handleCustomerCreated(payload);
        }
        console.log(`[CRM Sync] Successfully sync'd customer ${customerId}`);
    }
    catch (error) {
        console.error(`[CRM Sync] Error syncing customer ${customerId}:`, error);
    }
}
