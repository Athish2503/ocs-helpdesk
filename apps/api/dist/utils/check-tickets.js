"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../config/prisma.js");
async function main() {
    const tickets = await prisma_js_1.prisma.ticket.findMany({
        where: {
            OR: [
                { domainId: { not: null } },
                { subscriptionId: { not: null } },
                { serviceId: { not: null } }
            ]
        },
        take: 5,
        include: {
            domain: true,
            subscription: true,
            service: true
        }
    });
    console.log("Tickets with CRM details:", JSON.stringify(tickets, null, 2));
}
main().catch(err => console.error(err)).finally(() => process.exit(0));
