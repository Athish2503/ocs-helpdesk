"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../config/prisma.js");
const tickets_service_js_1 = require("../modules/tickets/tickets.service.js");
async function runTests() {
    console.log("🧪 Starting Automated Redesign Workflow Tests...");
    // 1. Fetch Seeded Users
    const customer = await prisma_js_1.prisma.user.findUnique({ where: { email: "customer@company.com" } });
    const l1 = await prisma_js_1.prisma.user.findUnique({ where: { email: "support-l1@ocs.company.com" } });
    const l2 = await prisma_js_1.prisma.user.findUnique({ where: { email: "manager-l2@ocs.company.com" } });
    const billing = await prisma_js_1.prisma.user.findUnique({ where: { email: "manjula@ocs.company.com" } });
    const admin = await prisma_js_1.prisma.user.findUnique({ where: { email: "admin@ocs.company.com" } });
    if (!customer || !l1 || !l2 || !billing || !admin) {
        throw new Error("❌ Required seeded users are missing! Please seed the database first.");
    }
    // Fetch a Category
    const emailCat = await prisma_js_1.prisma.category.findFirst({ where: { name: "Email" } });
    if (!emailCat) {
        throw new Error("❌ 'Email' category is missing.");
    }
    // Update routing rules for test users
    await prisma_js_1.prisma.routingRule.update({
        where: { issueCategory: "Billing / Renewals" },
        data: { assigneeId: billing.id }
    });
    await prisma_js_1.prisma.routingRule.update({
        where: { issueCategory: "Critical Issues" },
        data: {
            assigneeId: l1.id,
            secondaryAssigneeId: l2.id
        }
    });
    // Link customer to a CrmCustomer and CrmDomain so it's treated as inside OCS
    let crmCustomerId = customer.crmCustomerId;
    if (!crmCustomerId) {
        crmCustomerId = "test-customer-crm-id";
        await prisma_js_1.prisma.crmCustomer.upsert({
            where: { crmCustomerId },
            update: {},
            create: {
                crmCustomerId,
                displayName: "Test Customer Company",
                primaryEmail: customer.email,
            }
        });
        await prisma_js_1.prisma.user.update({
            where: { id: customer.id },
            data: { crmCustomerId }
        });
    }
    else {
        await prisma_js_1.prisma.crmCustomer.upsert({
            where: { crmCustomerId },
            update: {},
            create: {
                crmCustomerId,
                displayName: "Test Customer Company",
                primaryEmail: customer.email,
            }
        });
    }
    await prisma_js_1.prisma.crmDomain.upsert({
        where: { crmDomainId: "test-domain-id" },
        update: {},
        create: {
            crmDomainId: "test-domain-id",
            domainName: "company.com",
            crmCustomerId,
        }
    });
    console.log("✅ Seeded users and categories loaded.");
    // Clean up existing test tickets if any
    await prisma_js_1.prisma.ticket.deleteMany({
        where: {
            customerId: customer.id,
            title: { startsWith: "[TEST]" },
        },
    });
    const l1Ctx = { id: l1.id, email: l1.email, role: l1.role };
    const adminCtx = { id: admin.id, email: admin.email, role: admin.role };
    // ==========================================
    // Test Case 1: Automated Ticket Routing
    // ==========================================
    console.log("\n--- Test Case 1: Routing Logic ---");
    // A. Billing Route
    const billingTicket = await (0, tickets_service_js_1.createTicket)({
        title: "[TEST] Billing Issue",
        description: "Please check my recent renewal payment credit hours.",
        categoryId: emailCat.id,
        priority: "MEDIUM",
        issueCategory: "Billing / Renewals",
    }, customer.id, customer.role);
    console.log(`Billing ticket created. Assigned Agent ID: ${billingTicket.agentId}, Assigned Team ID: ${billingTicket.teamId}`);
    if (billingTicket.agentId !== billing.id) {
        throw new Error(`❌ Billing routing failed. Expected assigned to ${billing.id} (Manjula), got ${billingTicket.agentId}`);
    }
    console.log("✅ Billing routing successful: Routed to Manjula.");
    // B. Critical Escalation Route (High Priority)
    const criticalTicket = await (0, tickets_service_js_1.createTicket)({
        title: "[TEST] Server Down",
        description: "Database connection failed. Entire system is down.",
        categoryId: emailCat.id,
        priority: "HIGH",
        issueCategory: "Critical Issues",
    }, customer.id, customer.role);
    console.log(`Critical ticket created. Assigned Agent ID: ${criticalTicket.agentId}, Assigned Team ID: ${criticalTicket.teamId}`);
    if (criticalTicket.agentId !== l1.id) {
        throw new Error(`❌ Critical routing assignee failed. Expected L1 ${l1.id}, got ${criticalTicket.agentId}`);
    }
    // Let's verify rule matches: Primary L1, Secondary L2.
    const checkRule = await prisma_js_1.prisma.routingRule.findUnique({
        where: { issueCategory: "Critical Issues" }
    });
    console.log("Critical routing rule config:", checkRule);
    console.log("✅ Critical routing successful.");
    // C. Technical Support Route
    const techTicket = await (0, tickets_service_js_1.createTicket)({
        title: "[TEST] Outlook Config",
        description: "How to configure Outlook IMAP client?",
        categoryId: emailCat.id,
        priority: "LOW",
        issueCategory: "Technical Support",
        affectedDomain: "company.com",
    }, customer.id, customer.role);
    console.log(`Technical ticket created. Assigned Agent: ${techTicket.agentId}, Assigned Team: ${techTicket.teamId}`);
    // Technical Support category should route to Support Team
    const supportTeam = await prisma_js_1.prisma.team.findUnique({ where: { name: "Support Team" } });
    if (supportTeam && techTicket.teamId !== supportTeam.id) {
        throw new Error(`❌ Tech routing failed. Expected team ${supportTeam.id}, got team ${techTicket.teamId}`);
    }
    console.log("✅ Technical support routing successful: Routed to Support Team.");
    // ==========================================
    // Test Case 2: SLA Tracking & Status Audits
    // ==========================================
    console.log("\n--- Test Case 2: SLA Tracking & Status Audits ---");
    // SLA initially null
    if (techTicket.firstResponseAt !== null) {
        throw new Error(`❌ firstResponseAt should initially be null.`);
    }
    // Reply by staff
    console.log("Adding reply by support L1 agent...");
    await (0, tickets_service_js_1.addTicketMessage)(techTicket.id, { message: "Hello! Try checking Port 993 SSL." }, l1.id, l1Ctx);
    const updatedTechTicket = await prisma_js_1.prisma.ticket.findUnique({ where: { id: techTicket.id } });
    if (!updatedTechTicket?.firstResponseAt) {
        throw new Error(`❌ firstResponseAt was not updated upon staff reply.`);
    }
    console.log(`✅ firstResponseAt updated: ${updatedTechTicket.firstResponseAt.toISOString()}`);
    // Create a dummy attachment to pass backend screenshot validation
    await prisma_js_1.prisma.ticketAttachment.create({
        data: {
            ticketId: techTicket.id,
            filename: "test-resolution-proof.png",
            filePath: "/uploads/kb/images/test-resolution-proof.png",
            mimeType: "image/png"
        }
    });
    // Update Status to RESOLVED, prompt resolution hours consumed
    console.log("Resolving ticket...");
    await (0, tickets_service_js_1.updateTicket)(techTicket.id, { status: "RESOLVED", hoursConsumed: 2.0 }, adminCtx);
    const resolvedTechTicket = await prisma_js_1.prisma.ticket.findUnique({ where: { id: techTicket.id } });
    if (!resolvedTechTicket?.resolvedAt || !resolvedTechTicket?.ttrHours) {
        throw new Error(`❌ resolvedAt or ttrHours is null upon resolution.`);
    }
    console.log(`✅ resolvedAt set: ${resolvedTechTicket.resolvedAt.toISOString()}, ttrHours calculated: ${resolvedTechTicket.ttrHours} hrs.`);
    // Check audit history
    const statusHistories = await prisma_js_1.prisma.ticketStatusHistory.findMany({
        where: { ticketId: techTicket.id },
    });
    if (statusHistories.length === 0) {
        throw new Error(`❌ Status history not recorded.`);
    }
    console.log(`✅ Status history audit logs recorded: ${statusHistories.length} change logs found.`);
    // ==========================================
    // Test Case 3: Customer Credits
    // ==========================================
    console.log("\n--- Test Case 3: Customer Credits Decrement ---");
    const initialCredits = await prisma_js_1.prisma.customerCredits.findUnique({
        where: { customerId: customer.id },
    });
    console.log("Initial credits:", initialCredits);
    // Let's reset credits to 5.0 remaining for testing overage
    await prisma_js_1.prisma.customerCredits.update({
        where: { customerId: customer.id },
        data: {
            allocatedHours: 5.0,
            usedHours: 0.0,
            remainingHours: 5.0,
            billableHours: 0.0,
        },
    });
    // Create another ticket and resolve with 6.0 hours (exceeding remaining 5.0 credits)
    const overTicket = await (0, tickets_service_js_1.createTicket)({
        title: "[TEST] Heavy Setup Support",
        description: "Requires migrations of complete databases.",
        categoryId: emailCat.id,
        priority: "MEDIUM",
        issueCategory: "Technical Support",
        affectedDomain: "company.com",
    }, customer.id, customer.role);
    // Create a dummy attachment to pass backend screenshot validation
    await prisma_js_1.prisma.ticketAttachment.create({
        data: {
            ticketId: overTicket.id,
            filename: "test-resolution-proof.png",
            filePath: "/uploads/kb/images/test-resolution-proof.png",
            mimeType: "image/png"
        }
    });
    console.log("Resolving ticket with 6.0 consumed hours...");
    await (0, tickets_service_js_1.updateTicket)(overTicket.id, { status: "RESOLVED", hoursConsumed: 6.0 }, adminCtx);
    const finalCredits = await prisma_js_1.prisma.customerCredits.findUnique({
        where: { customerId: customer.id },
    });
    console.log("Final credits after 6.0 hrs usage:", finalCredits);
    if (finalCredits.remainingHours !== 0) {
        throw new Error(`❌ remainingHours should be 0, got ${finalCredits.remainingHours}`);
    }
    if (finalCredits.billableHours !== 1.0) {
        throw new Error(`❌ billableHours should be 1.0 (overage), got ${finalCredits.billableHours}`);
    }
    console.log("✅ Credit Hours decrement and billable overage calculated correctly!");
    // Cleanup test tickets
    await prisma_js_1.prisma.ticket.deleteMany({
        where: {
            customerId: customer.id,
            title: { startsWith: "[TEST]" },
        },
    });
    console.log("\n🎉 All redesign workflow tests completed successfully!");
}
runTests()
    .catch(err => {
    console.error("\n❌ Test Suite Failed:");
    console.error(err);
    process.exit(1);
});
