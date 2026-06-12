"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUserById = getUserById;
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
        },
    });
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    return user;
}
async function updateUser(id, input) {
    // Verify existence
    await getUserById(id);
    return prisma_js_1.prisma.user.update({
        where: { id },
        data: input,
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
async function getAgents() {
    return prisma_js_1.prisma.user.findMany({
        where: {
            OR: [
                { role: "AGENT" },
                { role: "ADMIN" } // Admins can be treated as agents as well for team assignment purposes
            ]
        },
        select: { id: true, name: true, email: true },
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
