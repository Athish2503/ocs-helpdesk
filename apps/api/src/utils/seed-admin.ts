import { prisma } from "../config/prisma.js";
import { hashPassword } from "./password.js";

async function main() {
  const email = "admin@ocs.company.com";
  const password = "AdminPassword123!";
  const name = "System Administrator";

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      await prisma.user.update({
        where: { email },
        data: { role: "ADMIN", emailVerified: true, isActive: true },
      });
      console.log("System Admin user already exists. Ensured ADMIN role and verified status.");
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
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
  } catch (error: any) {
    console.error(`❌ Error seeding admin: ${error.message}`);
    process.exit(1);
  }
}

main();
