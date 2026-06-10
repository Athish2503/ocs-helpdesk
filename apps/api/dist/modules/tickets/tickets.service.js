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
async function createTicket(input, customerId) {
    // Verify category exists and is active
    const category = await prisma_js_1.prisma.category.findUnique({
        where: { id: input.categoryId },
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
            priority: input.priority,
            status: "OPEN",
            categoryId: input.categoryId,
            customerId,
        },
        include: {
            category: true,
        },
    });
}
/**
 * List tickets based on user role.
 */
async function listTickets(user) {
    const isStaff = user.role === "ADMIN" || user.role === "AGENT";
    return prisma_js_1.prisma.ticket.findMany({
        where: isStaff ? {} : { customerId: user.id },
        include: {
            category: true,
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
 * Get ticket by ID with ownership verification.
 */
async function getTicketById(id, user) {
    const ticket = await prisma_js_1.prisma.ticket.findUnique({
        where: { id },
        include: {
            category: true,
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
    // Check permissions
    const isStaff = user.role === "ADMIN" || user.role === "AGENT";
    if (!isStaff && ticket.customerId !== user.id) {
        const error = new Error("Access denied to this ticket");
        error.statusCode = 403;
        throw error;
    }
    return ticket;
}
/**
 * Add a message reply to a ticket.
 */
async function addTicketMessage(ticketId, input, senderId, user) {
    // Verify ticket exists and user has access
    const ticket = await getTicketById(ticketId, user);
    // Check if ticket is closed/resolved (allow reopen on message reply if needed, or block it. Let's allow and mark as open/in-progress if customer replies, or keep status as-is. Standard is: just add message and update ticket timestamp).
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
 * Update ticket status or priority.
 */
async function updateTicket(id, input, user) {
    const ticket = await getTicketById(id, user);
    const isStaff = user.role === "ADMIN" || user.role === "AGENT";
    // Customer restriction: Customers can only resolve or close their own tickets
    if (!isStaff) {
        if (input.priority) {
            const error = new Error("Customers cannot change ticket priority");
            error.statusCode = 403;
            throw error;
        }
        if (input.status && input.status !== "RESOLVED" && input.status !== "CLOSED") {
            const error = new Error("Customers can only set status to RESOLVED or CLOSED");
            error.statusCode = 403;
            throw error;
        }
    }
    return prisma_js_1.prisma.ticket.update({
        where: { id },
        data: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.priority ? { priority: input.priority } : {}),
        },
        include: {
            category: true,
            customer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}
