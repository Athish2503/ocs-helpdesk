"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeams = listTeams;
exports.getTeamById = getTeamById;
exports.createTeam = createTeam;
exports.updateTeam = updateTeam;
exports.deleteTeam = deleteTeam;
const prisma_js_1 = require("../../config/prisma.js");
async function listTeams() {
    return prisma_js_1.prisma.team.findMany({
        include: {
            members: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            _count: {
                select: { tickets: true },
            },
        },
        orderBy: { name: "asc" },
    });
}
async function getTeamById(id) {
    const team = await prisma_js_1.prisma.team.findUnique({
        where: { id },
        include: {
            members: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                },
            },
            tickets: true,
        },
    });
    if (!team) {
        const error = new Error("Team not found");
        error.statusCode = 404;
        throw error;
    }
    return team;
}
async function createTeam(input) {
    const { name, description, memberIds } = input;
    const existing = await prisma_js_1.prisma.team.findUnique({ where: { name } });
    if (existing) {
        const error = new Error("A team with this name already exists");
        error.statusCode = 409;
        throw error;
    }
    return prisma_js_1.prisma.team.create({
        data: {
            name,
            description,
            members: memberIds
                ? {
                    connect: memberIds.map((id) => ({ id })),
                }
                : undefined,
        },
        include: {
            members: {
                select: { id: true, name: true, email: true },
            },
        },
    });
}
async function updateTeam(id, input) {
    const { name, description, memberIds } = input;
    const team = await getTeamById(id);
    if (name && name !== team.name) {
        const existing = await prisma_js_1.prisma.team.findUnique({ where: { name } });
        if (existing) {
            const error = new Error("A team with this name already exists");
            error.statusCode = 409;
            throw error;
        }
    }
    return prisma_js_1.prisma.team.update({
        where: { id },
        data: {
            name,
            description,
            members: memberIds
                ? {
                    set: memberIds.map((id) => ({ id })),
                }
                : undefined,
        },
        include: {
            members: {
                select: { id: true, name: true, email: true },
            },
        },
    });
}
async function deleteTeam(id) {
    await getTeamById(id);
    // Unassign tickets from this team first to prevent foreign key errors if cascade is not set
    await prisma_js_1.prisma.ticket.updateMany({
        where: { teamId: id },
        data: { teamId: null },
    });
    return prisma_js_1.prisma.team.delete({
        where: { id },
    });
}
