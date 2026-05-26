import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UsePipes,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { CreateTicketSchema, UpdateTicketSchema, AddMessageSchema } from '@ocs/shared';
import type { CreateTicketInput, UpdateTicketInput, AddMessageInput } from '@ocs/shared';
import { Role } from '../../generated/prisma';

@Controller('tickets')
@UseGuards(AuthGuard('jwt'))
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateTicketSchema))
  async create(@Body() body: CreateTicketInput, @Req() req: any) {
    return this.ticketsService.createTicket(req.user.id, body);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('agentId') agentId?: string,
  ) {
    const query: any = { status, priority, category, agentId };
    if (req.user.role === Role.CUSTOMER) {
      query.userId = req.user.id;
    }
    return this.ticketsService.getTickets(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.ticketsService.getTicketById(id, { id: req.user.id, role: req.user.role });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdateTicketSchema))
  async update(@Param('id') id: string, @Body() body: UpdateTicketInput, @Req() req: any) {
    return this.ticketsService.updateTicket(id, body, { id: req.user.id, role: req.user.role });
  }

  @Post(':id/messages')
  @UsePipes(new ZodValidationPipe(AddMessageSchema))
  async addMessage(@Param('id') id: string, @Body() body: AddMessageInput, @Req() req: any) {
    return this.ticketsService.addMessage(id, req.user.id, body);
  }
}
