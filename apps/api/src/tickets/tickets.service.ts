import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Ticket, TicketMessage, TicketStatus, TicketPriority, Role } from '../../generated/prisma';
import type { CreateTicketInput, UpdateTicketInput, AddMessageInput } from '@ocs/shared';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  // Workload-based auto-assignment engine (FR-TKT-02)
  private async autoAssign(category: string): Promise<string | null> {
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: [Role.AGENT, Role.SUPERVISOR] },
        isActive: true,
      },
    });

    if (staff.length === 0) {
      return null;
    }

    const staffWorkloads = await Promise.all(
      staff.map(async (member) => {
        const activeCount = await this.prisma.ticket.count({
          where: {
            agentId: member.id,
            status: { notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED] },
          },
        });
        return { id: member.id, activeCount };
      }),
    );

    // Sort by active ticket count ascending
    staffWorkloads.sort((a, b) => a.activeCount - b.activeCount);

    return staffWorkloads[0]?.id || null;
  }

  async createTicket(customerId: string, input: CreateTicketInput): Promise<Ticket> {
    const assignedAgentId = await this.autoAssign(input.category);

    return this.prisma.ticket.create({
      data: {
        userId: customerId,
        agentId: assignedAgentId,
        title: input.title,
        description: input.description,
        status: TicketStatus.OPEN,
        priority: input.priority as TicketPriority,
        category: input.category,
      },
    });
  }

  async getTickets(query: {
    status?: string;
    priority?: string;
    category?: string;
    agentId?: string;
    userId?: string;
  }): Promise<Ticket[]> {
    const whereClause: any = {};

    if (query.status) {
      whereClause.status = query.status as TicketStatus;
    }
    if (query.priority) {
      whereClause.priority = query.priority as TicketPriority;
    }
    if (query.category) {
      whereClause.category = query.category;
    }
    if (query.agentId) {
      whereClause.agentId = query.agentId;
    }
    if (query.userId) {
      whereClause.userId = query.userId;
    }

    return this.prisma.ticket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, email: true, role: true },
        },
        agent: {
          select: { id: true, email: true, role: true },
        },
      },
    });
  }

  async getTicketById(ticketId: string, user: { id: string; role: Role }): Promise<any> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: {
          select: { id: true, email: true, role: true },
        },
        agent: {
          select: { id: true, email: true, role: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, email: true, role: true },
            },
            attachments: true,
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Customer can only view their own tickets
    if (user.role === Role.CUSTOMER && ticket.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to view this ticket');
    }

    return ticket;
  }

  async updateTicket(ticketId: string, input: UpdateTicketInput, user: { id: string; role: Role }): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Role restrictions on updates
    if (user.role === Role.CUSTOMER) {
      if (ticket.userId !== user.id) {
        throw new ForbiddenException('You do not have permission to update this ticket');
      }
      // Customers can only close or mark their tickets as resolved, not update agent, priority, category etc.
      if (input.agentId !== undefined || input.priority !== undefined || input.category !== undefined) {
        throw new ForbiddenException('Customers cannot change ticket assignments, priority, or category');
      }
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status as TicketStatus;
    if (input.priority !== undefined) updateData.priority = input.priority as TicketPriority;
    if (input.category !== undefined) updateData.category = input.category;
    if (input.agentId !== undefined) updateData.agentId = input.agentId;

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });
  }

  async addMessage(ticketId: string, senderId: string, input: AddMessageInput): Promise<TicketMessage> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { customer: true, agent: true },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Retrieve sender to check roles
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    if (!sender) {
      throw new NotFoundException('Sender user not found');
    }

    // Enforce permission (customer can only post messages to their own tickets)
    if (sender.role === Role.CUSTOMER && ticket.userId !== senderId) {
      throw new ForbiddenException('You do not have permission to post messages to this ticket');
    }

    // Start transaction to create message and associate attachments
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          senderId,
          body: input.body,
          isInternal: sender.role !== Role.CUSTOMER ? (input.isInternal ?? false) : false,
        },
      });

      if (input.attachments && input.attachments.length > 0) {
        // Associate the file uploads with ticket and message
        await tx.fileUpload.updateMany({
          where: {
            id: { in: input.attachments },
            uploaderId: senderId,
          },
          data: {
            ticketId,
            messageId: message.id,
          },
        });
      }

      return message;
    });
  }
}
