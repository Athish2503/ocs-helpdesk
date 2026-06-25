import { prisma } from "../../config/prisma.js";

interface CrmCustomerPayload {
  crmCustomerId: string;
  companyName?: string;
  displayName: string;
  primaryEmail: string;
  secondaryEmail?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  customerStatus?: string;
  domains?: Array<{ crmDomainId: string; domainName: string }>;
  services?: Array<{ crmServiceId: string; name: string; status: string }>;
  subscriptions?: Array<{
    crmSubscriptionId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate?: string;
  }>;
}

export async function handleCustomerCreated(data: CrmCustomerPayload) {
  return prisma.$transaction(async (tx) => {
    // 1. Upsert CrmCustomer record
    const crmCustomer = await tx.crmCustomer.upsert({
      where: { crmCustomerId: data.crmCustomerId },
      create: {
        crmCustomerId: data.crmCustomerId,
        companyName: data.companyName,
        displayName: data.displayName,
        primaryEmail: data.primaryEmail,
        secondaryEmail: data.secondaryEmail,
        primaryPhone: data.primaryPhone,
        secondaryPhone: data.secondaryPhone,
        customerStatus: data.customerStatus || "ACTIVE",
        lastSyncedAt: new Date(),
      },
      update: {
        companyName: data.companyName,
        displayName: data.displayName,
        primaryEmail: data.primaryEmail,
        secondaryEmail: data.secondaryEmail,
        primaryPhone: data.primaryPhone,
        secondaryPhone: data.secondaryPhone,
        customerStatus: data.customerStatus || "ACTIVE",
        lastSyncedAt: new Date(),
      },
    });

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
        },
        update: {
          domainName: d.domainName,
        },
      });
    }

    // 3. Sync Services
    const syncedServiceIds = (data.services || []).map((s) => s.crmServiceId);
    await tx.crmService.deleteMany({
      where: {
        crmCustomerId: data.crmCustomerId,
        crmServiceId: { notIn: syncedServiceIds },
      },
    });
    for (const s of data.services || []) {
      await tx.crmService.upsert({
        where: { crmServiceId: s.crmServiceId },
        create: {
          crmServiceId: s.crmServiceId,
          name: s.name,
          status: s.status,
          crmCustomerId: data.crmCustomerId,
        },
        update: {
          name: s.name,
          status: s.status,
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
    } else if (!user.crmCustomerId) {
      // Link existing user to CRM Customer if email matched
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

export async function handleCustomerUpdated(data: CrmCustomerPayload) {
  // Re-use logic since handleCustomerCreated implements full idempotent upserts
  return handleCustomerCreated(data);
}

export async function handleCustomerDeactivated(crmCustomerId: string) {
  return prisma.$transaction(async (tx) => {
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
