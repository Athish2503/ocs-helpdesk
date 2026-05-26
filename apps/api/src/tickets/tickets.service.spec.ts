import { Test, TestingModule } from '@nestjs/testing';
import { TicketsService } from './tickets.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, TicketStatus, TicketPriority } from '../../generated/prisma';

describe('TicketsService', () => {
  let service: TicketsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      ticket: {
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      ticketMessage: {
        create: jest.fn(),
      },
      fileUpload: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [TicketsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create ticket and auto-assign to agent with lowest workload', async () => {
      prisma.user.findMany.mockResolvedValue([
        { id: 'agent-1', role: Role.AGENT, isActive: true },
        { id: 'agent-2', role: Role.AGENT, isActive: true },
      ] as any);

      prisma.ticket.count.mockImplementation(async (args: any) => {
        if (args.where.agentId === 'agent-1') return 2;
        return 0;
      });

      prisma.ticket.create.mockResolvedValue({
        id: 'ticket-1',
        title: 'Test Ticket',
        agentId: 'agent-2',
      } as any);

      const result = await service.createTicket('customer-1', {
        title: 'Test Ticket',
        description: 'Need help with login',
        priority: 'MEDIUM',
        category: 'technical',
      });

      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(prisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            agentId: 'agent-2',
            userId: 'customer-1',
          }),
        }),
      );
      expect(result.id).toBe('ticket-1');
    });
  });
});
