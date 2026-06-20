import { prisma } from "../config/prisma.js";
import { hashPassword } from "./password.js";

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

  console.log("✅  Initial admin user seeded successfully!");
}
