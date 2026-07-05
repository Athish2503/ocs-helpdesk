"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTicketHandler = createTicketHandler;
exports.listTicketsHandler = listTicketsHandler;
exports.getTicketByIdHandler = getTicketByIdHandler;
exports.addTicketMessageHandler = addTicketMessageHandler;
exports.updateTicketHandler = updateTicketHandler;
exports.uploadTicketAttachmentHandler = uploadTicketAttachmentHandler;
const tickets_schemas_js_1 = require("./tickets.schemas.js");
const TicketsService = __importStar(require("./tickets.service.js"));
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function createTicketHandler(req, res, next) {
    try {
        const input = tickets_schemas_js_1.createTicketSchema.parse(req.body);
        // req.user is populated by requireAuth middleware
        const ticket = await TicketsService.createTicket(input, req.user.id, req.user.role, req.user.email);
        ok(res, { ticket }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function listTicketsHandler(req, res, next) {
    try {
        const tickets = await TicketsService.listTickets(req.user);
        ok(res, { tickets });
    }
    catch (err) {
        next(err);
    }
}
async function getTicketByIdHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const ticket = await TicketsService.getTicketById(id, req.user);
        ok(res, { ticket });
    }
    catch (err) {
        next(err);
    }
}
async function addTicketMessageHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const input = tickets_schemas_js_1.addMessageSchema.parse(req.body);
        const message = await TicketsService.addTicketMessage(id, input, req.user.id, req.user);
        ok(res, { message }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateTicketHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const input = tickets_schemas_js_1.updateTicketSchema.parse(req.body);
        const ticket = await TicketsService.updateTicket(id, input, req.user);
        ok(res, { ticket });
    }
    catch (err) {
        next(err);
    }
}
const prisma_js_1 = require("../../config/prisma.js");
async function uploadTicketAttachmentHandler(req, res, next) {
    try {
        const id = req.params.id;
        if (!req.file) {
            res.status(400).json({ success: false, error: { message: "No file uploaded" } });
            return;
        }
        const ticket = await prisma_js_1.prisma.ticket.findUnique({
            where: { id },
        });
        if (!ticket) {
            res.status(404).json({ success: false, error: { message: "Ticket not found" } });
            return;
        }
        const attachment = await prisma_js_1.prisma.ticketAttachment.create({
            data: {
                ticketId: id,
                filename: req.file.filename,
                filePath: `/uploads/kb/images/${req.file.filename}`, // Reuse standard static uploads directory path
                mimeType: req.file.mimetype,
            },
        });
        res.status(201).json({ success: true, data: { attachment } });
    }
    catch (err) {
        next(err);
    }
}
