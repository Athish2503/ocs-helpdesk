"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("../config/prisma.js");
const password_js_1 = require("./password.js");
async function main() {
    const email = "admin@ocs.company.com";
    const password = "AdminPassword123!";
    const name = "System Administrator";
    try {
        const existing = await prisma_js_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            await prisma_js_1.prisma.user.update({
                where: { email },
                data: { role: "ADMIN", emailVerified: true, isActive: true },
            });
            console.log("System Admin user already exists. Ensured ADMIN role and verified status.");
            return;
        }
        const passwordHash = await (0, password_js_1.hashPassword)(password);
        const user = await prisma_js_1.prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: "ADMIN",
                emailVerified: true,
                isActive: true,
            },
        });
        console.log("=========================================");
        console.log("🎉 System Administrator account seeded!");
        console.log(`📧 Email:    ${user.email}`);
        console.log(`🔑 Password: ${password}`);
        console.log(`🛡️ Role:     ${user.role}`);
        console.log("=========================================");
    }
    catch (error) {
        console.error(`❌ Error seeding admin: ${error.message}`);
        process.exit(1);
    }
}
main();
