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
async function createTicket(input, customerId, userRole) {
    let categoryId = input.categoryId;
    if (userRole === "CUSTOMER" || !categoryId) {
        // Customers cannot select category. Default to "General Inquiry"
        let generalCategory = await prisma_js_1.prisma.category.findFirst({
            where: { name: "General Inquiry" },
        });
        if (!generalCategory) {
            generalCategory = await prisma_js_1.prisma.category.create({
                data: {
                    name: "General Inquiry",
                    slug: "general-inquiry",
                    description: "Any general questions not covered by other categories.",
                    isActive: true,
                },
            });
        }
        categoryId = generalCategory.id;
    }
    let priority = input.priority;
    if (userRole === "CUSTOMER") {
        // Customers cannot set priority level. Force to MEDIUM
        priority = "MEDIUM";
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
    return prisma_js_1.prisma.ticket.create({
        data: {
            title: input.title,
            description: input.description,
            priority: priority || "MEDIUM",
            status: "OPEN",
            categoryId: categoryId,
            customerId,
        },
        include: {
            category: true,
        },
    });
}
/**
 * List tickets based on user role and ABAC security.
 */
async function listTickets(user) {
    const where = {};
    if (user.role === "CUSTOMER") {
        where.customerId = user.id;
    }
    else if (user.role === "AGENT") {
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
                },
            },
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
    else if (user.role === "AGENT") {
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
    await getTicketById(ticketId, user);
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
    const isStaff = user.role === "ADMIN" || user.role === "AGENT";
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
    return prisma_js_1.prisma.ticket.update({
        where: { id },
        data: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.priority ? { priority: input.priority } : {}),
            ...(input.teamId !== undefined ? { teamId: input.teamId } : {}),
            ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
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
}
