"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canAccessTicket = canAccessTicket;
exports.canAccessArticle = canAccessArticle;
exports.checkTicketAccess = checkTicketAccess;
const prisma_js_1 = require("../config/prisma.js");
/**
 * Checks if a user has access to a specific ticket based on RBAC and ABAC rules.
 */
async function canAccessTicket(userId, userRole, ticketId) {
    if (userRole === "ADMIN")
        return true;
    const ticket = await prisma_js_1.prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { customerId: true, agentId: true, teamId: true },
    });
    if (!ticket)
        return false;
    if (userRole === "CUSTOMER") {
        return ticket.customerId === userId;
    }
    if (userRole === "AGENT") {
        // Assigned agent check
        if (ticket.agentId === userId)
            return true;
        // Team membership check
        if (ticket.teamId) {
            const teamMembership = await prisma_js_1.prisma.team.findFirst({
                where: {
                    id: ticket.teamId,
                    members: { some: { id: userId } },
                },
            });
            return !!teamMembership;
        }
        // Unassigned tickets can be seen by all agents
        return true;
    }
    return false;
}
/**
 * Checks if a user can access a Knowledge Base article.
 */
async function canAccessArticle(userId, userRole, articleId) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { id: articleId },
        select: { isPublished: true, isInternal: true, authorId: true },
    });
    if (!article)
        return false;
    // Author bypass
    if (userId && article.authorId === userId)
        return true;
    if (article.isPublished) {
        if (!article.isInternal)
            return true; // Public
        return !!(userRole && (userRole === "ADMIN" || userRole === "AGENT")); // Internal
    }
    // Drafts are only accessible by admins or the author (checked above)
    return !!(userRole && userRole === "ADMIN");
}
/**
 * Express middleware to enforce ticket ABAC security on route parameters.
 */
function checkTicketAccess(paramName = "id") {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Auth required" } });
                return;
            }
            const ticketId = req.params[paramName];
            if (!ticketId) {
                res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Ticket ID parameter missing" } });
                return;
            }
            const allowed = await canAccessTicket(req.user.id, req.user.role, ticketId);
            if (!allowed) {
                res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied to this ticket" } });
                return;
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
