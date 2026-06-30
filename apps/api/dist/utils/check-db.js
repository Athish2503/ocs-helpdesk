"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../config/prisma.js");
async function main() {
    const cid = "CID260324115951";
    const customer = await prisma_js_1.prisma.crmCustomer.findUnique({
        where: { crmCustomerId: cid }
    });
    console.log("CRM Customer:", customer);
    const domains = await prisma_js_1.prisma.crmDomain.findMany({
        where: { crmCustomerId: cid }
    });
    console.log("Domains:", domains);
    const services = await prisma_js_1.prisma.crmService.findMany({
        where: { crmCustomerId: cid }
    });
    console.log("Services:", services);
    const subscriptions = await prisma_js_1.prisma.crmSubscription.findMany({
        where: { crmCustomerId: cid }
    });
    console.log("Subscriptions:", subscriptions);
}
main().catch(err => console.error(err)).finally(() => process.exit(0));
