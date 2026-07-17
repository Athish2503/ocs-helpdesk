"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCustomerCreated = handleCustomerCreated;
exports.handleCustomerUpdated = handleCustomerUpdated;
exports.handleCustomerDeactivated = handleCustomerDeactivated;
const prisma_js_1 = require("../../config/prisma.js");
async function handleCustomerCreated(data) {
    return prisma_js_1.prisma.$transaction(async (tx) => {
        // 1. Upsert CrmCustomer record avoiding primaryEmail conflicts if crmCustomerId changes
        const existing = await tx.crmCustomer.findFirst({
            where: {
                OR: [
                    { crmCustomerId: data.crmCustomerId },
                    { primaryEmail: data.primaryEmail }
                ]
            }
        });
        let crmCustomer;
        if (existing) {
            crmCustomer = await tx.crmCustomer.update({
                where: { id: existing.id },
                data: {
                    crmCustomerId: data.crmCustomerId,
                    companyName: data.companyName,
                    displayName: data.displayName,
                    primaryEmail: data.primaryEmail,
                    secondaryEmail: data.secondaryEmail,
                    primaryPhone: data.primaryPhone,
                    secondaryPhone: data.secondaryPhone,
                    customerStatus: data.customerStatus || "ACTIVE",
                    crmUpdatedAt: data.crmUpdatedAt ? new Date(data.crmUpdatedAt) : null,
                    lastSyncedAt: new Date(),
                }
            });
        }
        else {
            crmCustomer = await tx.crmCustomer.create({
                data: {
                    crmCustomerId: data.crmCustomerId,
                    companyName: data.companyName,
                    displayName: data.displayName,
                    primaryEmail: data.primaryEmail,
                    secondaryEmail: data.secondaryEmail,
                    primaryPhone: data.primaryPhone,
                    secondaryPhone: data.secondaryPhone,
                    customerStatus: data.customerStatus || "ACTIVE",
                    crmUpdatedAt: data.crmUpdatedAt ? new Date(data.crmUpdatedAt) : null,
                    lastSyncedAt: new Date(),
                }
            });
        }
        // 2. Sync Domains
        const syncedDomainIds = (data.domains || []).map((d) => d.crmDomainId);
        await tx.crmDomain.deleteMany({
            where: {
                crmCustomerId: data.crmCustomerId,
                crmDomainId: { notIn: syncedDomainIds },
            },
        });
        for (const d of data.domains || []) {
            await tx.crmDomain.upsert({
                where: { crmDomainId: d.crmDomainId },
                create: {
                    crmDomainId: d.crmDomainId,
                    domainName: d.domainName,
                    crmCustomerId: data.crmCustomerId,
                    registeredWith: d.registeredWith || "Others",
                },
                update: {
                    domainName: d.domainName,
                    registeredWith: d.registeredWith || "Others",
                },
            });
        }
        // 3. Sync Services
        // 3. Sync Services (aggregating mapped domains per service)
        const servicesInput = data.services || [];
        const uniqueServiceMap = new Map();
        const serviceDomainMap = new Map();
        for (const s of servicesInput) {
            uniqueServiceMap.set(s.crmServiceId, s);
            if (s.domainName) {
                if (!serviceDomainMap.has(s.crmServiceId)) {
                    serviceDomainMap.set(s.crmServiceId, new Set());
                }
                serviceDomainMap.get(s.crmServiceId).add(s.domainName);
            }
        }
        const uniqueServices = Array.from(uniqueServiceMap.values());
        const syncedServiceIds = uniqueServices.map((s) => s.crmServiceId);
        await tx.crmService.deleteMany({
            where: {
                crmCustomerId: data.crmCustomerId,
                crmServiceId: { notIn: syncedServiceIds },
            },
        });
        for (const s of uniqueServices) {
            const domainsSet = serviceDomainMap.get(s.crmServiceId);
            const joinedDomains = domainsSet ? Array.from(domainsSet).join(",") : null;
            await tx.crmService.upsert({
                where: { crmServiceId: s.crmServiceId },
                create: {
                    crmServiceId: s.crmServiceId,
                    name: s.name,
                    status: s.status,
                    crmCustomerId: data.crmCustomerId,
                    domainName: joinedDomains,
                },
                update: {
                    name: s.name,
                    status: s.status,
                    domainName: joinedDomains,
                },
            });
        }
        // 4. Sync Subscriptions
        const syncedSubIds = (data.subscriptions || []).map((s) => s.crmSubscriptionId);
        await tx.crmSubscription.deleteMany({
            where: {
                crmCustomerId: data.crmCustomerId,
                crmSubscriptionId: { notIn: syncedSubIds },
            },
        });
        for (const sub of data.subscriptions || []) {
            await tx.crmSubscription.upsert({
                where: { crmSubscriptionId: sub.crmSubscriptionId },
                create: {
                    crmSubscriptionId: sub.crmSubscriptionId,
                    planName: sub.planName,
                    status: sub.status,
                    startDate: new Date(sub.startDate),
                    endDate: sub.endDate ? new Date(sub.endDate) : null,
                    crmCustomerId: data.crmCustomerId,
                },
                update: {
                    planName: sub.planName,
                    status: sub.status,
                    startDate: new Date(sub.startDate),
                    endDate: sub.endDate ? new Date(sub.endDate) : null,
                },
            });
        }
        // 5. Check or Create/Link Helpdesk User record (deactivation is handled separately or matches status)
        let user = await tx.user.findUnique({ where: { email: data.primaryEmail } });
        if (!user) {
            // Create inactive user awaiting credentials / invitation
            user = await tx.user.create({
                data: {
                    name: data.displayName,
                    email: data.primaryEmail,
                    phoneNumber: data.primaryPhone,
                    crmCustomerId: data.crmCustomerId,
                    role: "CUSTOMER",
                    isActive: false, // will activate upon setting up password
                    emailVerified: false,
                },
            });
        }
        else if (user.crmCustomerId !== data.crmCustomerId) {
            // Link or update existing user to the CRM Customer ID if changed
            user = await tx.user.update({
                where: { id: user.id },
                data: {
                    crmCustomerId: data.crmCustomerId,
                    phoneNumber: user.phoneNumber || data.primaryPhone,
                },
            });
        }
        // 6. Log in AuditLog
        await tx.auditLog.create({
            data: {
                action: "CRM_SYNC_RECEIVED",
                entity: "CrmCustomer",
                entityId: data.crmCustomerId,
                payload: JSON.stringify({ event: "customer.created", timestamp: new Date() }),
            },
        });
        return { crmCustomer, userId: user.id };
    });
}
async function handleCustomerUpdated(data) {
    // Re-use logic since handleCustomerCreated implements full idempotent upserts
    return handleCustomerCreated(data);
}
async function handleCustomerDeactivated(crmCustomerId) {
    return prisma_js_1.prisma.$transaction(async (tx) => {
        // 1. Update CrmCustomer Status
        await tx.crmCustomer.updateMany({
            where: { crmCustomerId },
            data: { customerStatus: "DEACTIVATED" },
        });
        // 2. Suspend/Deactivate linked Helpdesk User
        const user = await tx.user.findUnique({ where: { crmCustomerId } });
        if (user) {
            await tx.user.update({
                where: { id: user.id },
                data: { isActive: false },
            });
        }
        // 3. Log in AuditLog
        await tx.auditLog.create({
            data: {
                action: "CRM_SYNC_DEACTIVATION",
                entity: "CrmCustomer",
                entityId: crmCustomerId,
                payload: JSON.stringify({ event: "customer.deactivated", timestamp: new Date() }),
            },
        });
        return { crmCustomerId, userDeactivated: !!user };
    });
}
