"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedInitialData = seedInitialData;
const prisma_js_1 = require("../config/prisma.js");
const password_js_1 = require("./password.js");
const role_middleware_js_1 = require("../middleware/role.middleware.js");
async function seedInitialData() {
    console.log("🌱  Seeding initial admin user...");
    const defaultPasswordHash = await (0, password_js_1.hashPassword)("Password123!");
    await prisma_js_1.prisma.user.upsert({
        where: { email: "admin@ocs.company.com" },
        update: { role: "ADMIN" },
        create: {
            name: "System Administrator",
            email: "admin@ocs.company.com",
            passwordHash: defaultPasswordHash,
            role: "ADMIN",
            emailVerified: true,
            isActive: true,
        },
    });
    console.log("🌱  Seeding default role permissions...");
    for (const [role, permissions] of Object.entries(role_middleware_js_1.DEFAULT_PERMISSIONS)) {
        await prisma_js_1.prisma.rolePermission.upsert({
            where: { role },
            update: {},
            create: { role, permissions },
        });
    }
    console.log("✅  Initial seed completed successfully!");
}
