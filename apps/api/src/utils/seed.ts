import { prisma } from "../config/prisma.js";
import { hashPassword } from "./password.js";
import { DEFAULT_PERMISSIONS } from "../middleware/role.middleware.js";

export async function seedInitialData() {
  console.log("🌱  Seeding initial admin user...");

  const defaultPasswordHash = await hashPassword("Password123!");

  await prisma.user.upsert({
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
  for (const [role, permissions] of Object.entries(DEFAULT_PERMISSIONS)) {
    await prisma.rolePermission.upsert({
      where: { role },
      update: {},
      create: { role, permissions },
    });
  }

  console.log("✅  Initial seed completed successfully!");
}
