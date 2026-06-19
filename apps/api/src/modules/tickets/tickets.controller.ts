import type { Request, Response, NextFunction } from "express";
import { createTicketSchema, addMessageSchema, updateTicketSchema } from "./tickets.schemas.js";
import * as TicketsService from "./tickets.service.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function createTicketHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTicketSchema.parse(req.body);
    // req.user is populated by requireAuth middleware
    const ticket = await TicketsService.createTicket(input, req.user!.id, req.user!.role);
    ok(res, { ticket }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listTicketsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tickets = await TicketsService.listTickets(req.user!);
    ok(res, { tickets });
  } catch (err) {
    next(err);
  }
}

export async function getTicketByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const ticket = await TicketsService.getTicketById(id, req.user!);
    ok(res, { ticket });
  } catch (err) {
    next(err);
  }
}

export async function addTicketMessageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const input = addMessageSchema.parse(req.body);
    const message = await TicketsService.addTicketMessage(id, input, req.user!.id, req.user!);
    ok(res, { message }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTicketHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const input = updateTicketSchema.parse(req.body);
    const ticket = await TicketsService.updateTicket(id, input, req.user!);
    ok(res, { ticket });
  } catch (err) {
    next(err);
  }
}

import { prisma } from "../../config/prisma.js";

export async function uploadTicketAttachmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: "No file uploaded" } });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      res.status(404).json({ success: false, error: { message: "Ticket not found" } });
      return;
    }

    const attachment = await prisma.ticketAttachment.create({
      data: {
        ticketId: id,
        filename: req.file.filename,
        filePath: `/uploads/kb/images/${req.file.filename}`, // Reuse standard static uploads directory path
        mimeType: req.file.mimetype,
      },
    });

    res.status(201).json({ success: true, data: { attachment } });
  } catch (err) {
    next(err);
  }
}
