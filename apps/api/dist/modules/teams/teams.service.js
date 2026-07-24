import { prisma } from "../../config/prisma.js";
export async function listTeams() {
    return prisma.team.findMany({
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
export async function getTeamById(id) {
    const team = await prisma.team.findUnique({
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
export async function createTeam(input) {
    const { name, description, memberIds } = input;
    const existing = await prisma.team.findUnique({ where: { name } });
    if (existing) {
        const error = new Error("A team with this name already exists");
        error.statusCode = 409;
        throw error;
    }
    return prisma.team.create({
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
export async function updateTeam(id, input) {
    const { name, description, memberIds } = input;
    const team = await getTeamById(id);
    if (name && name !== team.name) {
        const existing = await prisma.team.findUnique({ where: { name } });
        if (existing) {
            const error = new Error("A team with this name already exists");
            error.statusCode = 409;
            throw error;
        }
    }
    return prisma.team.update({
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
export async function deleteTeam(id) {
    await getTeamById(id);
    // Unassign tickets from this team first to prevent foreign key errors if cascade is not set
    await prisma.ticket.updateMany({
        where: { teamId: id },
        data: { teamId: null },
    });
    return prisma.team.delete({
        where: { id },
    });
}
