import { prisma } from "../../config/prisma.js";
import { hashPassword } from "../../utils/password.js";
import * as crmService from "../../services/crm.service.js";
import { getOrFetchDomains, getOrFetchServices, getOrFetchSubscriptions, syncUserCredits } from "../../services/crm-cache.service.js";
export async function listUsers(query) {
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
    return prisma.user.findMany({
        where,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            crmCustomerId: true,
            role: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
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
                    creditCategoryId: true,
                    creditCategory: {
                        select: { id: true, name: true, credits: true },
                    },
                },
            },
            crmCustomer: {
                include: {
                    domains: { orderBy: { createdAt: "desc" } },
                    services: { orderBy: { createdAt: "desc" } },
                    subscriptions: { orderBy: { createdAt: "desc" } },
                    invitations: {
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
export async function getUserById(id) {
    const existing = await prisma.user.findUnique({
        where: { id },
        select: { crmCustomerId: true }
    });
    if (existing) {
        await syncUserCredits(id, existing.crmCustomerId).catch(err => {
            console.error(`[Users Service] Error syncing user credits for user ${id}:`, err);
        });
    }
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            crmCustomerId: true,
            role: true,
            isActive: true,
            emailVerified: true,
            lastLoginAt: true,
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
                    creditCategoryId: true,
                    creditCategory: {
                        select: { id: true, name: true, credits: true },
                    },
                },
            },
            crmCustomer: {
                include: {
                    domains: { orderBy: { createdAt: "desc" } },
                    services: { orderBy: { createdAt: "desc" } },
                    subscriptions: { orderBy: { createdAt: "desc" } },
                    invitations: { orderBy: { createdAt: "desc" } },
                },
            },
        },
    });
    if (!user) {
        const error = new Error("User not found");
        error.statusCode = 404;
        throw error;
    }
    // Populate live/cached CRM data for the customer details view
    if (user.crmCustomerId) {
        try {
            const [domains, subscriptions, services] = await Promise.all([
                getOrFetchDomains(user.crmCustomerId),
                getOrFetchSubscriptions(user.crmCustomerId),
                getOrFetchServices(user.crmCustomerId),
            ]);
            if (!user.crmCustomer) {
                user.crmCustomer = {
                    crmCustomerId: user.crmCustomerId,
                    companyName: "",
                    displayName: user.name,
                    primaryEmail: user.email,
                    customerStatus: "ACTIVE",
                    domains: [],
                    services: [],
                    subscriptions: [],
                    invitations: [],
                };
            }
            user.crmCustomer.domains = domains;
            user.crmCustomer.subscriptions = subscriptions;
            user.crmCustomer.services = services;
        }
        catch (err) {
            console.error(`[Users Service] Failed to load live CRM data for user ${user.crmCustomerId}:`, err);
        }
    }
    // Fetch independent audit logs
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            OR: [
                { entityId: id },
                ...(user.crmCustomerId ? [{ entityId: user.crmCustomerId }] : []),
            ],
        },
        orderBy: { createdAt: "desc" },
    });
    return { ...user, auditLogs };
}
async function ensureCrmCustomerExists(crmCustomerId) {
    if (!crmCustomerId)
        return;
    const localCrmCust = await prisma.crmCustomer.findUnique({
        where: { crmCustomerId }
    });
    if (!localCrmCust) {
        try {
            await crmService.syncCustomerData(crmCustomerId);
            const verified = await prisma.crmCustomer.findUnique({
                where: { crmCustomerId }
            });
            if (!verified) {
                throw new Error(`CRM Customer with ID "${crmCustomerId}" could not be verified or does not exist in the CRM.`);
            }
        }
        catch (err) {
            const error = new Error(`Failed to link CRM Customer: ${err.message || err}`);
            error.statusCode = 400;
            throw error;
        }
    }
}
export async function createUser(input) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        const error = new Error("An account with this email already exists");
        error.statusCode = 409;
        throw error;
    }
    if (input.crmCustomerId) {
        await ensureCrmCustomerExists(input.crmCustomerId);
    }
    const passwordHash = await hashPassword(input.password);
    return prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            role: input.role,
            emailVerified: true,
            isActive: true,
            phoneNumber: input.phoneNumber,
            crmCustomerId: input.crmCustomerId,
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
            phoneNumber: true,
            crmCustomerId: true,
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
export async function updateUser(id, input) {
    // Verify existence
    await getUserById(id);
    if (input.crmCustomerId) {
        await ensureCrmCustomerExists(input.crmCustomerId);
    }
    const data = { ...input };
    if (input.password) {
        data.passwordHash = await hashPassword(input.password);
        delete data.password;
    }
    if (input.teamIds !== undefined) {
        data.teams = {
            set: input.teamIds.map((id) => ({ id })),
        };
        delete data.teamIds;
    }
    return prisma.user.update({
        where: { id },
        data,
        select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            crmCustomerId: true,
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
export async function getAgents() {
    return prisma.user.findMany({
        where: {
            role: {
                in: ["AGENT", "SUPPORT_L1", "SUPPORT_L2", "BILLING", "ADMIN"]
            }
        },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
    });
}
export async function updateProfile(id, input) {
    // Verify user exists
    await getUserById(id);
    const data = {};
    if (input.name) {
        data.name = input.name;
    }
    if (input.password) {
        data.passwordHash = await hashPassword(input.password);
    }
    return prisma.user.update({
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
