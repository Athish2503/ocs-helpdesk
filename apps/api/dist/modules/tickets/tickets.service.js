"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicket = createTicket;
exports.listTickets = listTickets;
exports.getTicketById = getTicketById;
exports.addTicketMessage = addTicketMessage;
exports.updateTicket = updateTicket;
const prisma_js_1 = require("../../config/prisma.js");
/**
 * Create a new ticket for a customer.
 */
async function createTicket(input, customerId, userRole, creatorEmail) {
    let categoryId = input.categoryId;
    if (!categoryId) {
        let generalCategory = await prisma_js_1.prisma.category.findFirst({
            where: { name: "Other Services" },
        }) || await prisma_js_1.prisma.category.findFirst({
            where: { name: "General Inquiry" },
        });
        if (!generalCategory) {
            generalCategory = await prisma_js_1.prisma.category.create({
                data: {
                    name: "Other Services",
                    slug: "other-services",
                    description: "General support inquiries.",
                    isActive: true,
                },
            });
        }
        categoryId = generalCategory.id;
    }
    // Verify category exists and is active
    const category = await prisma_js_1.prisma.category.findUnique({
        where: { id: categoryId },
    });
    if (!category || !category.isActive) {
        const error = new Error("Invalid or inactive category selected");
        error.statusCode = 400;
        throw error;
    }
    const categoryName = category.name;
    let priority = input.priority || "MEDIUM";
    // Determine Routing Category
    let issueCategory = categoryName;
    let rule = null;
    // 1. If explicit valid issueCategory is provided, respect it
    const validCategories = ["Billing / Renewals", "Technical Support", "Critical Issues"];
    if (input.issueCategory && validCategories.includes(input.issueCategory)) {
        issueCategory = input.issueCategory;
        rule = await prisma_js_1.prisma.routingRule.findUnique({
            where: { issueCategory },
        });
    }
    else {
        // 2. Check if there is a rule matching the category name exactly
        rule = await prisma_js_1.prisma.routingRule.findUnique({
            where: { issueCategory: categoryName },
        });
        if (!rule) {
            // 3. Fallback to priority/general category routing
            issueCategory = "Technical Support";
            if (priority === "HIGH" || priority === "URGENT") {
                issueCategory = "Critical Issues";
            }
            else if (categoryName.toLowerCase().includes("billing") ||
                categoryName.toLowerCase().includes("renew")) {
                issueCategory = "Billing / Renewals";
            }
            rule = await prisma_js_1.prisma.routingRule.findUnique({
                where: { issueCategory },
            });
        }
    }
    let agentId = null;
    let teamId = null;
    if (rule) {
        agentId = rule.assigneeId;
        teamId = rule.teamId;
    }
    // Fetch customer's CRM Customer ID
    const customerUser = await prisma_js_1.prisma.user.findUnique({
        where: { id: customerId },
        select: { crmCustomerId: true, email: true }
    });
    let createdBySecondaryEmail = null;
    let finalDescription = input.description;
    if (creatorEmail && customerUser && creatorEmail.toLowerCase() !== customerUser.email.toLowerCase()) {
        if (customerUser.crmCustomerId) {
            const crmCust = await prisma_js_1.prisma.crmCustomer.findUnique({
                where: { crmCustomerId: customerUser.crmCustomerId }
            });
            if (crmCust && crmCust.secondaryEmail && crmCust.secondaryEmail.toLowerCase() === creatorEmail.toLowerCase()) {
                createdBySecondaryEmail = crmCust.secondaryEmail;
                finalDescription = `${input.description}\n\n[Created via secondary email: ${crmCust.secondaryEmail}]`;
            }
        }
    }
    const ticket = await prisma_js_1.prisma.ticket.create({
        data: {
            title: input.title,
            description: finalDescription,
            priority: priority || "MEDIUM",
            status: "OPEN",
            categoryId: categoryId,
            customerId,
            agentId,
            teamId,
            affectedDomain: input.affectedDomain,
            issueCategory,
            crmCustomerId: customerUser?.crmCustomerId || null,
            domainId: input.domainId || null,
            subscriptionId: input.subscriptionId || null,
            serviceId: input.serviceId || null,
            createdBySecondaryEmail,
        },
        include: {
            category: true,
            customer: true,
            agent: true,
            team: {
                include: {
                    members: true,
                },
            },
        },
    });
    // Log status history
    await prisma_js_1.prisma.ticketStatusHistory.create({
        data: {
            ticketId: ticket.id,
            toStatus: "OPEN",
            changedById: customerId,
        },
    });
    // Send notifications
    try {
        const emailRecipients = [];
        // Notify assigned agent
        if (ticket.agent) {
            emailRecipients.push(ticket.agent.email);
        }
        // Notify assigned team members
        if (ticket.team && ticket.team.members) {
            ticket.team.members.forEach((m) => {
                if (!emailRecipients.includes(m.email)) {
                    emailRecipients.push(m.email);
                }
            });
        }
        // If it's a critical issue, escalate to Manager L2 as well
        if (issueCategory === "Critical Issues" && rule && rule.secondaryAssigneeId) {
            const secondaryAssignee = await prisma_js_1.prisma.user.findUnique({
                where: { id: rule.secondaryAssigneeId },
            });
            if (secondaryAssignee && !emailRecipients.includes(secondaryAssignee.email)) {
                emailRecipients.push(secondaryAssignee.email);
            }
        }
        // If no recipients matched, notify any system admin
        if (emailRecipients.length === 0) {
            const admins = await prisma_js_1.prisma.user.findMany({
                where: { role: "ADMIN" },
            });
            admins.forEach((a) => emailRecipients.push(a.email));
        }
        // Send emails using email service
        const { sendTicketNotificationEmail, sendCustomerTicketCreatedEmail } = await import("../../services/email.service.js");
        for (const email of emailRecipients) {
            await sendTicketNotificationEmail(email, {
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                category: ticket.category.name,
                priority: ticket.priority,
                customerName: ticket.customer.name,
                customerEmail: ticket.customer.email,
                affectedDomain: ticket.affectedDomain,
            });
        }
        // Notify the customer who generated the ticket
        if (ticket.customer && ticket.customer.email) {
            await sendCustomerTicketCreatedEmail(ticket.customer.email, {
                id: ticket.id,
                title: ticket.title,
                description: ticket.description,
                category: ticket.category.name,
                priority: ticket.priority,
                customerName: ticket.customer.name,
            });
        }
    }
    catch (err) {
        console.error("Failed to send ticket creation email notifications:", err);
    }
    return ticket;
}
/**
 * List tickets based on user role and ABAC security.
 */
async function listTickets(user) {
    const where = {};
    if (user.role === "CUSTOMER") {
        where.customerId = user.id;
    }
    else if (user.role === "AGENT" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING") {
        // ABAC Filter: Agents can see tickets assigned to them, tickets in their teams, or unassigned tickets.
        where.OR = [
            { agentId: user.id },
            {
                team: {
                    members: {
                        some: { id: user.id },
                    },
                },
            },
            { teamId: null },
        ];
    } // ADMIN role has no where constraints
    return prisma_js_1.prisma.ticket.findMany({
        where,
        include: {
            category: true,
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });
}
/**
 * Get ticket by ID with ownership verification and ABAC checks.
 */
async function getTicketById(id, user) {
    const ticket = await prisma_js_1.prisma.ticket.findUnique({
        where: { id },
        include: {
            category: true,
            team: {
                select: {
                    id: true,
                    name: true,
                },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phoneNumber: true,
                    crmCustomerId: true,
                    crmCustomer: {
                        include: {
                            domains: true,
                            services: true,
                            subscriptions: true,
                        }
                    },
                    customerCredits: true,
                },
            },
            domain: true,
            subscription: true,
            service: true,
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            messages: {
                include: {
                    sender: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            attachments: {
                include: {
                    uploadedBy: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
            },
            statusHistory: {
                include: {
                    changedBy: {
                        select: {
                            id: true,
                            name: true,
                            role: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            creditTransactions: true,
        },
    });
    if (!ticket) {
        const error = new Error("Ticket not found");
        error.statusCode = 404;
        throw error;
    }
    // ABAC Security Check
    if (user.role === "CUSTOMER") {
        if (ticket.customerId !== user.id) {
            const error = new Error("Access denied to this ticket");
            error.statusCode = 403;
            throw error;
        }
    }
    else if (user.role === "AGENT" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING") {
        const isAssignedAgent = ticket.agentId === user.id;
        let isTeamMember = false;
        if (ticket.teamId) {
            const teamMembership = await prisma_js_1.prisma.team.findFirst({
                where: {
                    id: ticket.teamId,
                    members: { some: { id: user.id } },
                },
            });
            isTeamMember = !!teamMembership;
        }
        const isUnassigned = !ticket.teamId;
        if (!isAssignedAgent && !isTeamMember && !isUnassigned) {
            const error = new Error("Access denied: You do not belong to the team assigned to this ticket");
            error.statusCode = 403;
            throw error;
        }
    }
    return ticket;
}
/**
 * Add a message reply to a ticket.
 */
async function addTicketMessage(ticketId, input, senderId, user) {
    // Verify ticket exists and user has access (triggers getTicketById checks)
    const ticket = await getTicketById(ticketId, user);
    // If sender is staff and firstResponseAt is not set, set it now
    const isStaff = user.role === "ADMIN" || user.role === "AGENT" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING";
    if (isStaff && !ticket.firstResponseAt) {
        await prisma_js_1.prisma.ticket.update({
            where: { id: ticketId },
            data: { firstResponseAt: new Date() },
        });
    }
    const message = await prisma_js_1.prisma.ticketMessage.create({
        data: {
            ticketId,
            senderId,
            message: input.message,
        },
        include: {
            sender: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
        },
    });
    // Touch ticket updatedAt time to raise it in active queues
    await prisma_js_1.prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
    });
    return message;
}
/**
 * Update ticket status, priority, team, or agent.
 */
async function updateTicket(id, input, user) {
    const ticket = await getTicketById(id, user);
    const isStaff = user.role === "ADMIN" || user.role === "AGENT" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING";
    // Customer restrictions
    if (!isStaff) {
        if (input.priority) {
            const error = new Error("Customers cannot change ticket priority");
            error.statusCode = 403;
            throw error;
        }
        if (input.status) {
            const error = new Error("Customers cannot change ticket status");
            error.statusCode = 403;
            throw error;
        }
        if (input.teamId || input.agentId) {
            const error = new Error("Customers cannot assign teams or agents");
            error.statusCode = 403;
            throw error;
        }
    }
    // Handle SLA & Resolution logic
    let resolvedAt = undefined;
    let ttrHours = undefined;
    if (input.status && input.status !== ticket.status) {
        // Audit log
        await prisma_js_1.prisma.ticketStatusHistory.create({
            data: {
                ticketId: id,
                fromStatus: ticket.status,
                toStatus: input.status,
                changedById: user.id,
            },
        });
        if (input.status === "RESOLVED" || input.status === "CLOSED") {
            // Validate that at least one resolution proof/screenshot attachment is present
            const attachmentsCount = await prisma_js_1.prisma.ticketAttachment.count({
                where: { ticketId: id }
            });
            if (attachmentsCount === 0) {
                const error = new Error("Cannot resolve ticket: A resolution screenshot/attachment is required.");
                error.statusCode = 400;
                throw error;
            }
            resolvedAt = new Date();
            const creationTime = new Date(ticket.createdAt).getTime();
            ttrHours = (resolvedAt.getTime() - creationTime) / (1000 * 60 * 60); // In hours
            // Deduct support credit hours
            if (input.hoursConsumed && input.hoursConsumed > 0) {
                let hours = input.hoursConsumed;
                let txDescription = `Consumed ${hours} hours resolving ticket: ${ticket.title}`;
                let txType = "USAGE";
                // Check if customer has any domains registered with OCS
                const customerDomains = ticket.customer?.crmCustomer?.domains ?? [];
                const hasAnyDomainsWithUs = customerDomains.length > 0;
                // Check if the ticket's domain is outside of OCS (not in our CrmDomain database)
                let isDomainOutsideOcs = true;
                if (ticket.affectedDomain) {
                    const domainInDb = await prisma_js_1.prisma.crmDomain.findFirst({
                        where: { domainName: { equals: ticket.affectedDomain, mode: "insensitive" } }
                    });
                    if (domainInDb) {
                        isDomainOutsideOcs = false;
                    }
                }
                // Apply special hourly rate if customer has no domains with us and ticket domain is outside OCS
                if (!hasAnyDomainsWithUs && isDomainOutsideOcs) {
                    const rawHours = hours;
                    if (hours < 0.5) {
                        hours = 0.5; // Min billing 1/2 hour
                    }
                    hours = hours * 750; // Charge Per hour(750) Credits
                    txDescription = `Consumed ${hours} credits resolving ticket: ${ticket.title} (Charged at 750 credits/hr rate for domain outside of OCS. Raw hours: ${rawHours}, min billing 1/2 hr applied)`;
                }
                const credits = await prisma_js_1.prisma.customerCredits.findUnique({
                    where: { customerId: ticket.customerId },
                });
                if (credits) {
                    let remaining = credits.remainingHours - hours;
                    let used = credits.usedHours + hours;
                    let billable = credits.billableHours;
                    if (remaining < 0) {
                        billable += Math.abs(remaining);
                        remaining = 0;
                        txType = "BILLABLE_OVERAGE";
                    }
                    await prisma_js_1.prisma.customerCredits.update({
                        where: { id: credits.id },
                        data: {
                            usedHours: used,
                            remainingHours: remaining,
                            billableHours: billable,
                        },
                    });
                    await prisma_js_1.prisma.creditTransaction.create({
                        data: {
                            customerCreditsId: credits.id,
                            ticketId: id,
                            hours,
                            type: txType,
                            description: txDescription,
                        },
                    });
                }
            }
        }
    }
    const updatedTicket = await prisma_js_1.prisma.ticket.update({
        where: { id },
        data: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.priority ? { priority: input.priority } : {}),
            ...(input.teamId !== undefined ? { teamId: input.teamId } : {}),
            ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
            ...(resolvedAt ? { resolvedAt } : {}),
            ...(ttrHours !== undefined ? { ttrHours } : {}),
        },
        include: {
            category: true,
            team: {
                select: { id: true, name: true },
            },
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            agent: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    if (input.status === "RESOLVED" && ticket.status !== "RESOLVED") {
        try {
            const { sendCustomerTicketResolvedEmail } = await import("../../services/email.service.js");
            if (updatedTicket.customer && updatedTicket.customer.email) {
                await sendCustomerTicketResolvedEmail(updatedTicket.customer.email, {
                    id: updatedTicket.id,
                    title: updatedTicket.title,
                    customerName: updatedTicket.customer.name,
                });
            }
        }
        catch (err) {
            console.error("Failed to send ticket resolution email notification:", err);
        }
    }
    return updatedTicket;
}
