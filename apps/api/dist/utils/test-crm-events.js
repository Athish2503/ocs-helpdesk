import "dotenv/config";
import { prisma } from "../config/prisma.js";
import { enqueueEvent } from "../services/crm-queue.service.js";
import { getOrFetchDomains } from "../services/crm-cache.service.js";
// CRM mock responses dictionary
const mockCrmResponses = {
    "/api/helpdesk/customers/test-cust-123/domains": [
        { domainId: "dom-1", domainName: "test-domain-1.com" },
        { domainId: "dom-2", domainName: "test-domain-2.com" }
    ],
    "/api/helpdesk/customers/test-cust-123/services": [
        { serviceId: "srv-1", serviceName: "L1 Support", status: "ACTIVE", domainName: "test-domain-1.com" }
    ],
    "/api/helpdesk/customers/test-cust-123/subscriptions": [
        { subscriptionId: "sub-1", planName: "Basic Plan", status: "ACTIVE", startDate: "2026-07-13T00:00:00.000Z" }
    ],
    "/api/helpdesk/customers/test-cust-123/summary": {
        success: true,
        summary: {
            customer: {
                customerId: "test-cust-123",
                displayName: "Initial Customer Name",
                primaryEmail: "test-customer@crm.com",
                status: "ACTIVE"
            },
            domains: [
                { domainId: "dom-1", domainName: "test-domain-1.com" }
            ],
            subscriptions: [
                {
                    subscriptionId: "sub-1",
                    domainName: "Basic Plan",
                    status: "ACTIVE",
                    startDate: "2026-07-13T00:00:00.000Z",
                    services: [
                        { serviceId: "srv-1", serviceName: "L1 Support", SKU: "sku-l1" }
                    ]
                }
            ]
        }
    }
};
// Intercept global fetch to return mock data for CRM endpoints
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
    const urlStr = String(url);
    for (const path of Object.keys(mockCrmResponses)) {
        if (urlStr.endsWith(path)) {
            return {
                ok: true,
                status: 200,
                statusText: "OK",
                json: async () => mockCrmResponses[path],
            };
        }
    }
    return originalFetch(url, init);
};
async function main() {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    console.log("🚀 Starting CRM Integration Webhook and Cache Tests...");
    // Clean previous test logs and queue items
    await prisma.crmSyncLog.deleteMany({ where: { entityId: "test-cust-123" } });
    await prisma.crmEventQueue.deleteMany({ where: { payload: { contains: "test-cust-123" } } });
    // Setup: Delete any existing test users and customers
    await prisma.user.deleteMany({ where: { email: "test-customer@crm.com" } });
    await prisma.crmCustomer.deleteMany({ where: { crmCustomerId: "test-cust-123" } });
    // 1. Create a CrmCustomer mirror and User in the local DB
    const crmCustomer = await prisma.crmCustomer.create({
        data: {
            crmCustomerId: "test-cust-123",
            displayName: "Initial Customer Name",
            companyName: "CRM Corp",
            primaryEmail: "test-customer@crm.com",
            customerStatus: "ACTIVE",
        }
    });
    const user = await prisma.user.create({
        data: {
            name: "Initial Customer Name",
            email: "test-customer@crm.com",
            crmCustomerId: "test-cust-123",
            passwordHash: "securepasswordhash", // Protected password
            role: "CUSTOMER", // Protected role
            isActive: true,
        }
    });
    console.log("✅ Seeded test customer and user.");
    // Test Case 1: Idempotency (ignore duplicate eventIds)
    console.log("\n--- Test Case 1: Idempotency ---");
    const eventId = "evt-test-1001";
    const ok1 = await enqueueEvent(eventId, "customer.updated", {
        id: "test-cust-123",
        displayName: "Updated Customer Name",
        companyName: "Updated CRM Corp",
        primaryEmail: "test-customer@crm.com",
        secondaryEmail: "secondary@crm.com",
        primaryPhone: "1234567890",
        status: "ACTIVE",
        // Try to overwrite sensitive properties (should be ignored)
        password: "hackedpassword",
        passwordHash: "hackedpasswordhash",
        role: "ADMIN"
    });
    const ok2 = await enqueueEvent(eventId, "customer.updated", {
        id: "test-cust-123",
        displayName: "Duplicate Updated Name"
    });
    if (ok1 && !ok2) {
        console.log("✅ Idempotency check succeeded. Duplicate event ignored.");
    }
    else {
        throw new Error("❌ Idempotency check failed.");
    }
    // Verify that it is currently logged as QUEUED or PROCESSED in DB
    const initialLog = await prisma.crmSyncLog.findUnique({ where: { eventId } });
    if (initialLog && (initialLog.status === "QUEUED" || initialLog.status === "PROCESSED")) {
        console.log("✅ Event successfully logged in database.");
    }
    else {
        throw new Error(`❌ Initial log status expected 'QUEUED' or 'PROCESSED', got '${initialLog?.status}'`);
    }
    // Test Case 2: Process Queue & Filter Protected Fields
    console.log("\n--- Test Case 2: Process Event & Filter Protected Fields ---");
    await sleep(200);
    // Verify updates in CrmCustomer mirror
    const updatedCrm = await prisma.crmCustomer.findUnique({ where: { crmCustomerId: "test-cust-123" } });
    if (updatedCrm &&
        updatedCrm.displayName === "Updated Customer Name" &&
        updatedCrm.companyName === "Updated CRM Corp" &&
        updatedCrm.secondaryEmail === "secondary@crm.com" &&
        updatedCrm.primaryPhone === "1234567890") {
        console.log("✅ Customer mirror allowed fields updated successfully.");
    }
    else {
        throw new Error("❌ Allowed fields not updated correctly in CrmCustomer.");
    }
    // Verify updates in User mirror and check password/role security
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (updatedUser) {
        if (updatedUser.name !== "Updated Customer Name" || updatedUser.email !== "test-customer@crm.com") {
            throw new Error("❌ User name or email was not synced.");
        }
        if (updatedUser.passwordHash !== "securepasswordhash" || updatedUser.role !== "CUSTOMER") {
            throw new Error("❌ Password or Role was overwritten!");
        }
        console.log("✅ User name/email updated, and Password/Role remains protected!");
    }
    else {
        throw new Error("❌ User not found after sync.");
    }
    // Verify Event Queue delete and Sync Log updated
    const logAfterProcessing = await prisma.crmSyncLog.findUnique({ where: { eventId } });
    const queueAfterProcessing = await prisma.crmEventQueue.findFirst({ where: { eventId } });
    if (logAfterProcessing?.status === "PROCESSED" && !queueAfterProcessing) {
        console.log("✅ Log status updated to PROCESSED and event removed from queue.");
    }
    else {
        throw new Error("❌ Webhook queue deletion or log status update failed.");
    }
    // Test Case 3: Cache Layer and TTL
    console.log("\n--- Test Case 3: Caching Layer and TTL ---");
    // First fetch (should trigger live API call)
    const domains1 = await getOrFetchDomains("test-cust-123");
    // Modify mock responses
    mockCrmResponses["/api/helpdesk/customers/test-cust-123/domains"] = [
        { domainId: "dom-1", domainName: "test-domain-1.com" },
        { domainId: "dom-2", domainName: "test-domain-2.com" },
        { domainId: "dom-3", domainName: "new-live-domain.com" }
    ];
    // Second fetch (should serve cached version, NOT new domain)
    const domains2 = await getOrFetchDomains("test-cust-123");
    if (domains2.length === 2 && domains2.find(d => d.domainName === "new-live-domain.com") === undefined) {
        console.log("✅ Cache hit: cached values served without contacting CRM API.");
    }
    else {
        throw new Error("❌ Cache miss: cache did not store values correctly.");
    }
    // Test Case 4: Cache Invalidation on Webhook Event
    console.log("\n--- Test Case 4: Cache Invalidation on Webhook Event ---");
    // Send domain event to queue
    const domainEventId = "evt-test-1002";
    await enqueueEvent(domainEventId, "domain.created", { crmCustomerId: "test-cust-123", domainId: "dom-3", domainName: "new-live-domain.com" });
    await sleep(200);
    // Next fetch should retrieve fresh data from CRM API (which contains 3 domains now)
    const domains3 = await getOrFetchDomains("test-cust-123");
    if (domains3.length === 3 && domains3.find(d => d.domainName === "new-live-domain.com") !== undefined) {
        console.log("✅ Cache invalidated and fresh CRM API domains successfully fetched.");
    }
    else {
        throw new Error("❌ Cache invalidation failed.");
    }
    // Test Case 5: Error Handling and Queue Retry
    console.log("\n--- Test Case 5: Error Handling and Queue Retry ---");
    const badEventId = "evt-test-1003";
    // Enqueue event with data that will trigger database transaction throw (null displayName, for instance)
    await enqueueEvent(badEventId, "customer.updated", {
        id: "test-cust-123",
        displayName: null, // this will fail validation or cause db failure
    });
    await sleep(200);
    const failedLog = await prisma.crmSyncLog.findUnique({ where: { eventId: badEventId } });
    const failedQueue = await prisma.crmEventQueue.findFirst({ where: { eventId: badEventId } });
    if (failedLog?.status === "FAILED" && failedLog.errors && failedQueue?.status === "FAILED" && failedQueue.retryCount === 1) {
        console.log("✅ Event failed cleanly: saved errors in log and queued for retrying.");
    }
    else {
        throw new Error(`❌ Failed event handling verification failed: Log Status=${failedLog?.status}, Queue Status=${failedQueue?.status}`);
    }
    // Cleanup tests data
    await prisma.crmSyncLog.deleteMany({ where: { entityId: "test-cust-123" } });
    await prisma.crmEventQueue.deleteMany({ where: { payload: { contains: "test-cust-123" } } });
    await prisma.user.deleteMany({ where: { email: "test-customer@crm.com" } });
    await prisma.crmCustomer.deleteMany({ where: { crmCustomerId: "test-cust-123" } });
    console.log("\n🎉 ALL CRM WEBHOOK AND CACHE TESTS COMPLETED SUCCESSFULLY!");
    process.exit(0);
}
main().catch(err => {
    console.error("❌ Test script failed with error:", err);
    process.exit(1);
});
