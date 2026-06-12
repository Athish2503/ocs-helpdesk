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
 * List tickets based on user role and ABAC security.
 */
export async function listTickets(user: UserContext) {
  const where: any = {};

  if (user.role === "CUSTOMER") {
    where.customerId = user.id;
  } else if (user.role === "AGENT") {
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
export async function getTicketById(id: string, user: UserContext) {
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

  // ABAC Security Check
  if (user.role === "CUSTOMER") {
    if (ticket.customerId !== user.id) {
      const error = new Error("Access denied to this ticket") as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
  } else if (user.role === "AGENT") {
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
      const error = new Error("Access denied: You do not belong to the team assigned to this ticket") as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
  }

  return ticket;
}

/**
 * Add a message reply to a ticket.
 */
export async function addTicketMessage(
  ticketId: string,
  input: AddMessageInput,
  senderId: string,
  user: UserContext
) {
  // Verify ticket exists and user has access (triggers getTicketById checks)
  await getTicketById(ticketId, user);

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
export async function updateTicket(id: string, input: UpdateTicketInput, user: UserContext) {
  const ticket = await getTicketById(id, user);

  const isStaff = user.role === "ADMIN" || user.role === "AGENT";

  // Customer restrictions
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
    if (input.teamId || input.agentId) {
      const error = new Error("Customers cannot assign teams or agents") as Error & { statusCode: number };
      error.statusCode = 403;
      throw error;
    }
  }

  return prisma.ticket.update({
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
