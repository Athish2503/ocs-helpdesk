import "dotenv/config";
import { prisma } from "../config/prisma.js";
import { getOrFetchSubscriptions, getOrFetchCustomerCredits } from "../services/crm-cache.service.js";
async function check() {
    console.log("Checking customer credits and subscriptions...");
    const users = await prisma.user.findMany({
        where: { role: "CUSTOMER" },
        select: { id: true, name: true, email: true, crmCustomerId: true }
    });
    for (const u of users) {
        console.log(`\nUser: ${u.name} (${u.email}) [crmCustomerId: ${u.crmCustomerId}]`);
        if (u.crmCustomerId) {
            try {
                const subs = await getOrFetchSubscriptions(u.crmCustomerId);
                console.log(`Subscriptions fetched: ${subs.length}`);
                subs.forEach(sub => {
                    console.log(`  - Sub: ${sub.planName} (Status: ${sub.status})`);
                    console.log(`    Services count: ${sub.services?.length || 0}`);
                    sub.services?.forEach((svc) => {
                        console.log(`      * Service: ${svc.serviceName} (Credit: ${svc.serviceCredit || svc.supportCreditHours})`);
                    });
                });
                const credits = await getOrFetchCustomerCredits(u.crmCustomerId);
                console.log(`Calculated Credits Object:`, credits);
            }
            catch (err) {
                console.error(`Error checking CRM credits for ${u.crmCustomerId}:`, err);
            }
        }
    }
}
check().catch(console.error);
