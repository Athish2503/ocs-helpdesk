import "dotenv/config";
import * as crmService from "../services/crm.service.js";
import { prisma } from "../config/prisma.js";
async function main() {
    // Check if a customer ID or name is provided via command line arguments
    const args = process.argv.slice(2);
    let targetId = args[0];
    let customerName = "OCS";
    // If no arguments, try to find customer "OCS" in the database
    if (!targetId) {
        const ocsCustomer = await prisma.crmCustomer.findFirst({
            where: {
                OR: [
                    { displayName: { equals: "OCS", mode: "insensitive" } },
                    { companyName: { contains: "Online Consultancy", mode: "insensitive" } },
                    { crmCustomerId: "CID250825112437" }
                ]
            }
        });
        if (ocsCustomer) {
            targetId = ocsCustomer.crmCustomerId;
            customerName = ocsCustomer.displayName;
        }
        else {
            console.error("Error: Customer OCS not found in the database. Please provide a customer ID as an argument.");
            process.exit(1);
        }
    }
    else {
        // If targetId is provided, look up the customer info
        const customer = await prisma.crmCustomer.findUnique({
            where: { crmCustomerId: targetId }
        });
        if (customer) {
            customerName = customer.displayName;
        }
    }
    console.log(`Generating credit report for Customer: ${customerName} (ID: ${targetId})...\n`);
    try {
        // Fetch live summary from CRM API
        const response = await crmService.getCustomerSummary(targetId);
        if (!response || !response.success || !response.summary) {
            throw new Error(`Failed to retrieve customer summary from CRM API.`);
        }
        const { domains, subscriptions } = response.summary;
        const domainList = domains || [];
        const subList = subscriptions || [];
        // Map each domain to its subscriptions
        const domainToSubs = {};
        for (const d of domainList) {
            domainToSubs[d.domainName] = [];
        }
        // Keep track of subscriptions processed to display them
        const subReports = [];
        let totalCustomerCredits = 0;
        for (const sub of subList) {
            const subDomain = sub.domainName || "";
            // Associate subscription to the domain key
            if (subDomain) {
                if (!domainToSubs[subDomain]) {
                    domainToSubs[subDomain] = [];
                }
                domainToSubs[subDomain].push(sub);
            }
            // Calculate service credits inside the subscription
            let subTotalCredits = 0;
            const serviceDetails = [];
            if (sub.services && Array.isArray(sub.services)) {
                for (const svc of sub.services) {
                    const credit = svc.serviceCredit !== undefined && svc.serviceCredit !== null
                        ? Number(svc.serviceCredit)
                        : svc.supportCreditHours !== undefined && svc.supportCreditHours !== null
                            ? Number(svc.supportCreditHours)
                            : 0;
                    subTotalCredits += credit;
                    serviceDetails.push({
                        name: svc.serviceName,
                        credit: credit
                    });
                }
            }
            totalCustomerCredits += subTotalCredits;
            subReports.push({
                id: sub.subscriptionId,
                domain: subDomain || "No Domain",
                plan: sub.planName || "Subscription Plan",
                services: serviceDetails,
                total: subTotalCredits
            });
        }
        // Output: Domains & Subscription Mapping
        console.log("=== Domain to Subscription Mapping ===");
        for (const d of domainList) {
            const mapped = domainToSubs[d.domainName];
            if (mapped && mapped.length > 0) {
                const subIds = mapped.map(s => s.subscriptionId).join(", ");
                console.log(`${d.domainName} → ${subIds}`);
            }
            else {
                console.log(`${d.domainName} → [No Subscription]`);
            }
        }
        console.log();
        // Output: Subscriptions, Services & Credits Detail
        console.log("=== Subscription Credit Breakdown ===");
        for (const rep of subReports) {
            console.log(`Subscription: ${rep.id} (Domain: ${rep.domain})`);
            if (rep.services.length > 0) {
                for (const s of rep.services) {
                    console.log(`  - Service: ${s.name} = ${s.credit} credit hours`);
                }
            }
            else {
                console.log("  - [No Services]");
            }
            console.log(`  Subscription Total = ${rep.total} credit hours\n`);
        }
        // Output: Final aggregated total
        console.log("==========================================");
        console.log(`Total Customer Credits = ${totalCustomerCredits} credit hours`);
        console.log("==========================================");
    }
    catch (error) {
        console.error("Error generating report:", error.message);
        process.exit(1);
    }
}
main().catch(console.error);
