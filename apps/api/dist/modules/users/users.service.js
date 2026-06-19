"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.getAgents = getAgents;
exports.updateProfile = updateProfile;
const prisma_js_1 = require("../../config/prisma.js");
const password_js_1 = require("../../utils/password.js");
async function listUsers(query) {
    const where = {};
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: "insensitive" } },
            { email: { contains: query.search, mode: "insensitive" } },
        ];
    }
    if (query.role) {
        where.role = query.role;
    }
    if (query.isActive !== undefined) {
        where.isActive = query.isActive === "true";
    }
    return prisma_js_1.prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            teams: {
                select: { id: true, name: true },
            },
            customerCredits: {
                select: {
                    id: true,
                    allocatedHours: true,
                    usedHours: true,
                    remainingHours: true,
                    billableHours: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getUserById(id) {
    const user = await prisma_js_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            teams: {
                select: { id: true, name: true },
            },
            customerCredits: {
                select: {
                    id: true,
                    allocatedHours: true,
                    usedHours: true,
                    remainingHours: true,
                    billableHours: true,
                },
            },
        },
    });
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    return user;
}
async function createUser(input) {
    const existing = await prisma_js_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        throw error;
    }
    const passwordHash = await (0, password_js_1.hashPassword)(input.password);
    return prisma_js_1.prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: input.role,
            emailVerified: true,
            isActive: true,
            teams: input.teamIds
                ? {
                    connect: input.teamIds.map((id) => ({ id })),
                }
                : undefined,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            teams: {
                select: { id: true, name: true },
            },
        },
    });
}
async function updateUser(id, input) {
    // Verify existence
    await getUserById(id);
    const data = { ...input };
    if (input.password) {
        data.passwordHash = await (0, password_js_1.hashPassword)(input.password);
        delete data.password;
    }
    if (input.teamIds !== undefined) {
        data.teams = {
            set: input.teamIds.map((id) => ({ id })),
        };
        delete data.teamIds;
    }
    return prisma_js_1.prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            teams: {
                select: { id: true, name: true },
            },
        },
    });
}
async function getAgents() {
    return prisma_js_1.prisma.user.findMany({
        where: {
            role: {
                in: ["AGENT", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "ADMIN"]
            }
        },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
    });
}
async function updateProfile(id, input) {
    // Verify user exists
    await getUserById(id);
    const data = {};
    if (input.name) {
        data.name = input.name;
    }
    if (input.password) {
        data.passwordHash = await (0, password_js_1.hashPassword)(input.password);
    }
    return prisma_js_1.prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
