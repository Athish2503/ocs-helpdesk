"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const prisma_js_1 = require("../config/prisma.js");
const crm_cache_service_js_1 = require("../services/crm-cache.service.js");
async function check() {
    console.log("Checking customer credits and subscriptions...");
    const users = await prisma_js_1.prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true, name: true, email: true, crmCustomerId: true }
    });
    for (const u of users) {
        console.log(`\nUser: ${u.name} (${u.email}) [crmCustomerId: ${u.crmCustomerId}]`);
        if (u.crmCustomerId) {
            try {
                const subs = await (0, crm_cache_service_js_1.getOrFetchSubscriptions)(u.crmCustomerId);
                console.log(`Subscriptions fetched: ${subs.length}`);
                subs.forEach(sub => {
                    console.log(`  - Sub: ${sub.planName} (Status: ${sub.status})`);
                    console.log(`    Services count: ${sub.services?.length || 0}`);
                    sub.services?.forEach((svc) => {
                        console.log(`      * Service: ${svc.serviceName} (Credit: ${svc.serviceCredit || svc.supportCreditHours})`);
                    });
                });
                const credits = await (0, crm_cache_service_js_1.getOrFetchCustomerCredits)(u.crmCustomerId);
                console.log(`Calculated Credits Object:`, credits);
            }
            catch (err) {
                console.error(`Error checking CRM credits for ${u.crmCustomerId}:`, err);
            }
        }
    }
}
check().catch(console.error);
