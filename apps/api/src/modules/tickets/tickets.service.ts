import { prisma } from "../../config/prisma.js";
import type { Role } from "../../generated/prisma/enums.js";
import type { CreateTicketInput, AddMessageInput, UpdateTicketInput } from "./tickets.schemas.js";

interface UserContext {
  id: string;
  email: string;
  role: Role;
}

/**
 * Create a new ticket for a customer.
 */
export async function createTicket(input: CreateTicketInput, customerId: string) {
  // Verify category exists and is active
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });

  if (!category || !category.isActive) {
    const error = new Error("Invalid or inactive category selected") as Error & { statusCode: number };
    error.statusCode = 400;
    throw error;
  }

  return prisma.ticket.create({
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
export async function listTickets(user: UserContext) {
  const isStaff = user.role === "ADMIN" || user.role === "AGENT";

  return prisma.ticket.findMany({
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
export async function getTicketById(id: string, user: UserContext) {
  const ticket = await prisma.ticket.findUnique({
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
    const error = new Error("Ticket not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  // Check permissions
  const isStaff = user.role === "ADMIN" || user.role === "AGENT";
  if (!isStaff && ticket.customerId !== user.id) {
    const error = new Error("Access denied to this ticket") as Error & { statusCode: number };
    error.statusCode = 403;
    throw error;
  }

  return ticket;
}

/**
 * Add a message reply to a ticket.
 */
export async function addTicketMessage(ticketId: string, input: AddMessageInput, senderId: string, user: UserContext) {
  // Verify ticket exists and user has access
  const ticket = await getTicketById(ticketId, user);

  // Check if ticket is closed/resolved (allow reopen on message reply if needed, or block it. Let's allow and mark as open/in-progress if customer replies, or keep status as-is. Standard is: just add message and update ticket timestamp).
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
 * Update ticket status or priority.
 */
export async function updateTicket(id: string, input: UpdateTicketInput, user: UserContext) {
  const ticket = await getTicketById(id, user);

  const isStaff = user.role === "ADMIN" || user.role === "AGENT";

  // Customer restriction: Customers can only resolve or close their own tickets
  if (!isStaff) {
    if (input.priority) {
      const error = new Error("Customers cannot change ticket priority") as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
    if (input.status && input.status !== "RESOLVED" && input.status !== "CLOSED") {
      const error = new Error("Customers can only set status to RESOLVED or CLOSED") as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
  }

  return prisma.ticket.update({
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
