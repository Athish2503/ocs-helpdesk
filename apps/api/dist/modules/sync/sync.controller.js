import * as SyncService from "./sync.service.js";
import * as crmService from "../../services/crm.service.js";
import { prisma } from "../../config/prisma.js";
export async function crmWebhookHandler(req, res, next) {
    try {
        const { event, data } = req.body;
        if (!event || !data) {
            res.status(400).json({ success: false, error: "Missing event or data in payload" });
            return;
        }
        let result;
        switch (event) {
            case "customer.created":
                result = await SyncService.handleCustomerCreated(data);
                break;
            case "customer.updated":
                result = await SyncService.handleCustomerUpdated(data);
                break;
            case "customer.deactivated":
                result = await SyncService.handleCustomerDeactivated(data.crmCustomerId);
                break;
            default:
                res.status(400).json({ success: false, error: `Unsupported event: ${event}` });
                return;
        }
        res.status(200).json({ success: true, message: `Processed ${event}`, data: result });
    }
    catch (err) {
        next(err);
    }
}
/**
 * Bulk import all customers from the CRM into the local helpdesk database.
 * Fetches customers in pages of 100 until all are retrieved, then syncs each one.
 */
export async function bulkImportCustomersHandler(req, res, next) {
    try {
        const PAGE_SIZE = 100;
        let page = 1;
        let hasMore = true;
        let total = 0;
        let imported = 0;
        let failed = 0;
        let skipped = 0;
        const errors = [];
        console.log("[Bulk Import] Starting full CRM customer import...");
        while (hasMore) {
            let crmResponse;
            try {
                crmResponse = await crmService.getCustomers({ page, limit: PAGE_SIZE });
            }
            catch (err) {
                console.error(`[Bulk Import] Failed to fetch page ${page} from CRM:`, err.message);
                break;
            }
            // Support both paginated ({ customers, total, hasMore }) and flat ([]) responses
            const customers = Array.isArray(crmResponse)
                ? crmResponse
                : Array.isArray(crmResponse?.customers)
                    ? crmResponse.customers
                    : Array.isArray(crmResponse?.data)
                        ? crmResponse.data
                        : [];
            if (customers.length === 0) {
                hasMore = false;
                break;
            }
            // Detect total from response if available
            if (page === 1 && crmResponse?.total) {
                total = crmResponse.total;
            }
            for (const customer of customers) {
                const customerId = customer.customerId || customer.crmCustomerId || customer.id;
                if (!customerId) {
                    failed++;
                    errors.push({ customerId: "unknown", error: "Missing customerId in CRM record" });
                    continue;
                }
                // Optimization: skip sync if customer exists and has not been updated in CRM
                try {
                    const existingLocal = await prisma.crmCustomer.findUnique({
                        where: { crmCustomerId: customerId },
                        select: { crmUpdatedAt: true },
                    });
                    if (existingLocal && customer.updatedAt) {
                        const localTime = existingLocal.crmUpdatedAt ? new Date(existingLocal.crmUpdatedAt).getTime() : 0;
                        const crmTime = new Date(customer.updatedAt).getTime();
                        if (localTime === crmTime) {
                            console.log(`[Bulk Import] Skipping customer ${customerId} (no updates)`);
                            skipped++;
                            continue;
                        }
                    }
                }
                catch (dbErr) {
                    console.warn(`[Bulk Import] Failed checking existing customer ${customerId} in DB:`, dbErr.message);
                }
                try {
                    await crmService.syncCustomerData(customerId);
                    imported++;
                }
                catch (err) {
                    failed++;
                    errors.push({ customerId, error: err.message || "Sync failed" });
                    console.error(`[Bulk Import] Failed to sync customer ${customerId}:`, err.message);
                }
            }
            // If response doesn't have pagination info, stop after first page if we got fewer than PAGE_SIZE
            if (customers.length < PAGE_SIZE) {
                hasMore = false;
            }
            else if (crmResponse?.hasMore === false) {
                hasMore = false;
            }
            else {
                page++;
            }
        }
        // Use actual count if total wasn't in response
        if (total === 0) {
            total = imported + skipped + failed;
        }
        console.log(`[Bulk Import] Complete. Total: ${total}, Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
        res.status(200).json({
            success: true,
            message: `Bulk import complete. ${imported} customers synced, ${skipped} skipped${failed > 0 ? `, ${failed} failed` : ""}.`,
            data: { total, imported, skipped, failed, errors: errors.slice(0, 20) }, // cap errors in response
        });
    }
    catch (err) {
        next(err);
    }
}
