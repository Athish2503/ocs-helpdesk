import { prisma } from "../../config/prisma.js";
import { syncUserCredits } from "../../services/crm-cache.service.js";
import { DEFAULT_PERMISSIONS } from "../../middleware/role.middleware.js";
import { computeSlaDeadlines } from "../sla/sla.service.js";
/**
 * Create a new ticket for a customer.
 */
export async function createTicket(input, customerId, userRole, creatorEmail) {
    let categoryId = input.categoryId;
    if (!categoryId) {
        let generalCategory = await prisma.category.findFirst({
            where: { name: "Other Services" },
        }) || await prisma.category.findFirst({
            where: { name: "General Inquiry" },
        });
        if (!generalCategory) {
            generalCategory = await prisma.category.create({
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
    const category = await prisma.category.findUnique({
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
        rule = await prisma.routingRule.findUnique({
            where: { issueCategory },
        });
    }
    else {
        // 2. Check if there is a rule matching the category name exactly
        rule = await prisma.routingRule.findUnique({
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
            rule = await prisma.routingRule.findUnique({
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
    const customerUser = await prisma.user.findUnique({
        where: { id: customerId },
        select: { crmCustomerId: true, email: true }
    });
    let createdBySecondaryEmail = null;
    let finalDescription = input.description;
    if (creatorEmail && customerUser && creatorEmail.toLowerCase() !== customerUser.email.toLowerCase()) {
        if (customerUser.crmCustomerId) {
            const crmCust = await prisma.crmCustomer.findUnique({
                where: { crmCustomerId: customerUser.crmCustomerId }
            });
            if (crmCust && crmCust.secondaryEmail && crmCust.secondaryEmail.toLowerCase() === creatorEmail.toLowerCase()) {
                createdBySecondaryEmail = crmCust.secondaryEmail;
                finalDescription = `${input.description}\n\n[Created via secondary email: ${crmCust.secondaryEmail}]`;
            }
        }
    }
    // Compute SLA deadlines based on priority
    const ticketCreatedAt = new Date();
    const slaDeadlines = await computeSlaDeadlines(priority, ticketCreatedAt);
    const ticket = await prisma.ticket.create({
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
            slaResponseDeadline: slaDeadlines.slaResponseDeadline,
            slaResolutionDeadline: slaDeadlines.slaResolutionDeadline,
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
    await prisma.ticketStatusHistory.create({
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
            const secondaryAssignee = await prisma.user.findUnique({
                where: { id: rule.secondaryAssigneeId },
            });
            if (secondaryAssignee && !emailRecipients.includes(secondaryAssignee.email)) {
                emailRecipients.push(secondaryAssignee.email);
            }
        }
        // If no recipients matched, notify any system admin
        if (emailRecipients.length === 0) {
            const admins = await prisma.user.findMany({
                where: { role: "ADMIN" },
            });
            (admins || []).forEach((a) => emailRecipients.push(a.email));
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
export async function listTickets(user) {
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
    return prisma.ticket.findMany({
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
export async function getTicketById(id, user) {
    const ticket = await prisma.ticket.findUnique({
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
            escalatedBy: {
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
            const teamMembership = await prisma.team.findFirst({
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
export async function addTicketMessage(ticketId, input, senderId, user) {
    // Verify ticket exists and user has access (triggers getTicketById checks)
    const ticket = await getTicketById(ticketId, user);
    // If sender is staff and firstResponseAt is not set, set it now
    const isStaff = user.role === "ADMIN" || user.role === "AGENT" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING";
    if (isStaff && !ticket.firstResponseAt) {
        await prisma.ticket.update({
            where: { id: ticketId },
            data: { firstResponseAt: new Date() },
        });
    }
    const message = await prisma.ticketMessage.create({
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
    await prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
    });
    return message;
}
/**
 * Update ticket status, priority, team, or agent.
 */
export async function updateTicket(id, input, user) {
    const ticket = await getTicketById(id, user);
    // 1. Optimistic Concurrency Control (Prevent race conditions)
    if (input.updatedAt) {
        const dbTime = new Date(ticket.updatedAt).getTime();
        const clientTime = new Date(input.updatedAt).getTime();
        // Use a small tolerance of 1000ms for date round-trips
        if (Math.abs(dbTime - clientTime) > 1000) {
            const error = new Error("Conflict: Ticket was modified by another agent. Please refresh and try again.");
            error.statusCode = 409;
            throw error;
        }
    }
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
        if (input.teamId || input.agentId || input.isEscalated !== undefined) {
            const error = new Error("Customers cannot assign teams, agents, or escalate tickets");
            error.statusCode = 403;
            throw error;
        }
    }
    // 2. Permission Checking for Assignment / Reassignment
    if (input.agentId !== undefined && input.agentId !== ticket.agentId) {
        const isAssigningSelf = input.agentId === user.id;
        if (isAssigningSelf) {
            // Ensure assignee is staff member
            if (!isStaff) {
                const error = new Error("Access denied: Customers cannot assign tickets");
                error.statusCode = 403;
                throw error;
            }
            // If assigned to a team, make sure agent is a member of that team, unless they have assign_tickets or are ADMIN
            if (ticket.teamId) {
                const rolePerm = await prisma.rolePermission.findUnique({ where: { role: user.role } });
                const userPermissions = rolePerm?.permissions ?? DEFAULT_PERMISSIONS[user.role] ?? [];
                const hasAssignPermission = user.role === "ADMIN" || userPermissions.includes("assign_tickets");
                if (!hasAssignPermission) {
                    const isMember = await prisma.team.findFirst({
                        where: {
                            id: ticket.teamId,
                            members: { some: { id: user.id } },
                        },
                    });
                    if (!isMember) {
                        const error = new Error("Access denied: You must be a member of the assigned team to assign this ticket to yourself");
                        error.statusCode = 403;
                        throw error;
                    }
                }
            }
        }
        else {
            // Reassigning to another agent requires assign_tickets permission or ADMIN role
            const rolePerm = await prisma.rolePermission.findUnique({ where: { role: user.role } });
            const userPermissions = rolePerm?.permissions ?? DEFAULT_PERMISSIONS[user.role] ?? [];
            const hasAssignPermission = user.role === "ADMIN" || userPermissions.includes("assign_tickets");
            if (!hasAssignPermission) {
                const error = new Error("Access denied: You do not have permission to assign tickets to other agents");
                error.statusCode = 403;
                throw error;
            }
        }
    }
    if (input.teamId !== undefined && input.teamId !== ticket.teamId) {
        const rolePerm = await prisma.rolePermission.findUnique({ where: { role: user.role } });
        const userPermissions = rolePerm?.permissions ?? DEFAULT_PERMISSIONS[user.role] ?? [];
        const hasAssignPermission = user.role === "ADMIN" || userPermissions.includes("assign_tickets");
        if (!hasAssignPermission) {
            const error = new Error("Access denied: You do not have permission to assign teams");
            error.statusCode = 403;
            throw error;
        }
    }
    // 3. Escalation Logic
    let isEscalating = false;
    let escalatedAgentId = null;
    let escalatedPriority = null;
    if (input.isEscalated === true && !ticket.isEscalated) {
        if (!isStaff) {
            const error = new Error("Access denied: Customers cannot escalate tickets");
            error.statusCode = 403;
            throw error;
        }
        if (ticket.status === "RESOLVED" || ticket.status === "CLOSED") {
            const error = new Error("Cannot escalate a resolved or closed ticket");
            error.statusCode = 400;
            throw error;
        }
        isEscalating = true;
        // Find the configured routing rule to determine L2 escalation
        const rule = await prisma.routingRule.findUnique({
            where: { issueCategory: ticket.issueCategory || ticket.category.name },
        });
        if (rule && rule.secondaryAssigneeId) {
            escalatedAgentId = rule.secondaryAssigneeId;
        }
        // Force priority to HIGH at minimum, or keep URGENT
        if (ticket.priority !== "URGENT") {
            escalatedPriority = "HIGH";
        }
        // Write system log message on timeline
        await prisma.ticketMessage.create({
            data: {
                ticketId: id,
                senderId: user.id,
                message: `[System Alert] Ticket escalated to L2 Support. Reason: ${input.escalationReason || "No reason provided."}`,
            },
        });
        // Write audit log entry
        await prisma.auditLog.create({
            data: {
                action: "TICKET_ESCALATED",
                entity: "Ticket",
                entityId: id,
                actorId: user.id,
                actorEmail: user.email,
                payload: JSON.stringify({
                    escalatedById: user.id,
                    reason: input.escalationReason,
                    previousAgentId: ticket.agentId,
                    newAgentId: escalatedAgentId || ticket.agentId,
                }),
            },
        });
    }
    // 4. Assignment History Audit Logging
    if (input.agentId !== undefined && input.agentId !== ticket.agentId && !isEscalating) {
        await prisma.auditLog.create({
            data: {
                action: "TICKET_ASSIGNED",
                entity: "Ticket",
                entityId: id,
                actorId: user.id,
                actorEmail: user.email,
                payload: JSON.stringify({
                    fromAgentId: ticket.agentId,
                    toAgentId: input.agentId,
                }),
            },
        });
    }
    if (input.teamId !== undefined && input.teamId !== ticket.teamId) {
        await prisma.auditLog.create({
            data: {
                action: "TICKET_TEAM_ASSIGNED",
                entity: "Ticket",
                entityId: id,
                actorId: user.id,
                actorEmail: user.email,
                payload: JSON.stringify({
                    fromTeamId: ticket.teamId,
                    toTeamId: input.teamId,
                }),
            },
        });
    }
    // Handle SLA & Resolution logic
    let resolvedAt = undefined;
    let ttrHours = undefined;
    if (input.status && input.status !== ticket.status) {
        // Audit log
        await prisma.ticketStatusHistory.create({
            data: {
                ticketId: id,
                fromStatus: ticket.status,
                toStatus: input.status,
                changedById: user.id,
            },
        });
        if (input.status === "RESOLVED" || input.status === "CLOSED") {
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
                    const domainInDb = await prisma.crmDomain.findFirst({
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
                const crmCustId = ticket.customer?.crmCustomerId || (await prisma.user.findUnique({
                    where: { id: ticket.customerId },
                    select: { crmCustomerId: true }
                }))?.crmCustomerId;
                if (crmCustId) {
                    // Write to CreditUsage table (consumption)
                    await prisma.creditUsage.create({
                        data: {
                            crmCustomerId: crmCustId,
                            ticketId: id,
                            hoursConsumed: hours,
                            adjustments: 0.0,
                            reason: txDescription,
                        }
                    });
                    // Recalculate balance dynamically and sync to customerCredits
                    const credits = await syncUserCredits(ticket.customerId, crmCustId);
                    // Write to CreditTransaction for backward compatibility/history
                    await prisma.creditTransaction.create({
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
    // Perform database update
    const finalAgentId = isEscalating
        ? (escalatedAgentId !== null ? escalatedAgentId : ticket.agentId)
        : (input.agentId !== undefined ? input.agentId : undefined);
    const updatedTicket = await prisma.ticket.update({
        where: { id },
        data: {
            ...(input.status ? { status: input.status } : {}),
            ...(escalatedPriority ? { priority: escalatedPriority } : (input.priority ? { priority: input.priority } : {})),
            ...(input.teamId !== undefined ? { teamId: input.teamId } : {}),
            ...(finalAgentId !== undefined ? { agentId: finalAgentId } : {}),
            ...(resolvedAt ? { resolvedAt } : {}),
            ...(ttrHours !== undefined ? { ttrHours } : {}),
            ...(isEscalating ? {
                isEscalated: true,
                escalatedAt: new Date(),
                escalatedById: user.id,
                escalationReason: input.escalationReason || null,
            } : {}),
            // Recompute SLA deadlines if priority changed
            ...await (async () => {
                const newPriority = escalatedPriority || input.priority;
                if (newPriority && newPriority !== ticket.priority) {
                    const sla = await computeSlaDeadlines(newPriority, new Date(ticket.createdAt));
                    return {
                        slaResponseDeadline: sla.slaResponseDeadline,
                        slaResolutionDeadline: sla.slaResolutionDeadline,
                    };
                }
                return {};
            })(),
            // Mark SLA breached on resolution if past resolution deadline
            ...(resolvedAt && ticket.slaResolutionDeadline && resolvedAt > new Date(ticket.slaResolutionDeadline)
                ? { slaBreached: true }
                : {}),
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
            escalatedBy: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
    // 5. Send notifications
    try {
        const { sendTicketNotificationEmail, sendCustomerTicketResolvedEmail } = await import("../../services/email.service.js");
        // Notify newly assigned agent if it was changed
        if (finalAgentId && finalAgentId !== ticket.agentId) {
            const newAgent = await prisma.user.findUnique({ where: { id: finalAgentId } });
            if (newAgent) {
                await sendTicketNotificationEmail(newAgent.email, {
                    id: updatedTicket.id,
                    title: updatedTicket.title,
                    description: updatedTicket.description,
                    category: updatedTicket.category.name,
                    priority: updatedTicket.priority,
                    customerName: updatedTicket.customer.name,
                    customerEmail: updatedTicket.customer.email,
                    affectedDomain: updatedTicket.affectedDomain,
                }).catch(err => console.error("Failed to send agent notification email:", err));
            }
        }
        if (input.status === "RESOLVED" && ticket.status !== "RESOLVED") {
            if (updatedTicket.customer && updatedTicket.customer.email) {
                await sendCustomerTicketResolvedEmail(updatedTicket.customer.email, {
                    id: updatedTicket.id,
                    title: updatedTicket.title,
                    customerName: updatedTicket.customer.name,
                }).catch(err => console.error("Failed to send customer resolved email:", err));
            }
        }
    }
    catch (err) {
        console.error("Failed to process post-update email notifications:", err);
    }
    return updatedTicket;
}
