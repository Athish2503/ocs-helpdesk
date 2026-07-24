import { prisma } from "../config/prisma.js";
import { hashPassword } from "./password.js";
import { DEFAULT_PERMISSIONS } from "../middleware/role.middleware.js";
export async function seedInitialData() {
    console.log("🌱  Seeding default role permissions...");
    for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
        await prisma.rolePermission.upsert({
            where: { role },
            update: { permissions },
            create: { role, permissions },
        });
    }
    console.log("🌱  Seeding initial users...");
    const defaultPasswordHash = await hashPassword("Password123!");
    const usersToSeed = [
        { email: "admin@ocs.company.com", name: "System Administrator", role: "ADMIN" },
        { email: "support-l1@ocs.company.com", name: "L1 Support Agent", role: "SUPPORT_L1" },
        { email: "manager-l2@ocs.company.com", name: "Manager L2 Support", role: "SUPPORT_L2" },
        { email: "manjula@ocs.company.com", name: "Manjula Billing Specialist", role: "BILLING" },
        { email: "customer@company.com", name: "Test Customer", role: "CUSTOMER" },
    ];
    const seededUsers = {};
    for (const u of usersToSeed) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: { role: u.role },
            create: {
                name: u.name,
                email: u.email,
                passwordHash: defaultPasswordHash,
                role: u.role,
                emailVerified: true,
                isActive: true,
            },
        });
        seededUsers[u.email] = user;
    }
    console.log("🌱  Seeding default teams...");
    const supportTeam = await prisma.team.upsert({
        where: { name: "Support Team" },
        update: {
            members: {
                set: [
                    { id: seededUsers["support-l1@ocs.company.com"].id },
                    { id: seededUsers["manager-l2@ocs.company.com"].id },
                ],
            },
        },
        create: {
            name: "Support Team",
            description: "L1 and L2 Technical Support Team",
            members: {
                connect: [
                    { id: seededUsers["support-l1@ocs.company.com"].id },
                    { id: seededUsers["manager-l2@ocs.company.com"].id },
                ],
            },
        },
    });
    const billingTeam = await prisma.team.upsert({
        where: { name: "Billing Team" },
        update: {
            members: {
                set: [
                    { id: seededUsers["manjula@ocs.company.com"].id },
                ],
            },
        },
        create: {
            name: "Billing Team",
            description: "Billing and Invoice Support Team",
            members: {
                connect: [
                    { id: seededUsers["manjula@ocs.company.com"].id },
                ],
            },
        },
    });
    console.log("🌱  Seeding categories...");
    const categoriesToSeed = [
        { name: "Email", slug: "email", description: "Email config and hosting issues" },
        { name: "Billing / Renewals", slug: "billing-renewals", description: "Billing, invoicing, renewals" },
        { name: "Technical Support", slug: "technical-support", description: "General technical support" },
        { name: "Critical Issues", slug: "critical-issues", description: "Outage or downtime reports" },
        { name: "Other Services", slug: "other-services", description: "General inquiries" },
    ];
    const seededCategories = {};
    for (const c of categoriesToSeed) {
        const cat = await prisma.category.upsert({
            where: { name: c.name },
            update: {},
            create: {
                name: c.name,
                slug: c.slug,
                description: c.description,
                isActive: true,
            },
        });
        seededCategories[c.name] = cat;
    }
    console.log("🌱  Seeding routing rules...");
    await prisma.routingRule.upsert({
        where: { issueCategory: "Billing / Renewals" },
        update: {
            assigneeId: seededUsers["manjula@ocs.company.com"].id,
            teamId: billingTeam.id,
        },
        create: {
            issueCategory: "Billing / Renewals",
            assigneeId: seededUsers["manjula@ocs.company.com"].id,
            teamId: billingTeam.id,
        },
    });
    await prisma.routingRule.upsert({
        where: { issueCategory: "Technical Support" },
        update: {
            teamId: supportTeam.id,
            assigneeId: null,
        },
        create: {
            issueCategory: "Technical Support",
            teamId: supportTeam.id,
        },
    });
    await prisma.routingRule.upsert({
        where: { issueCategory: "Critical Issues" },
        update: {
            assigneeId: seededUsers["support-l1@ocs.company.com"].id,
            secondaryAssigneeId: seededUsers["manager-l2@ocs.company.com"].id,
            teamId: supportTeam.id,
        },
        create: {
            issueCategory: "Critical Issues",
            assigneeId: seededUsers["support-l1@ocs.company.com"].id,
            secondaryAssigneeId: seededUsers["manager-l2@ocs.company.com"].id,
            teamId: supportTeam.id,
        },
    });
    console.log("✅  Initial seed completed successfully!");
}
