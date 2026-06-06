import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

type PrismaClientInstance = InstanceType<typeof PrismaClient>;

// Prevent multiple Prisma Client instances during hot-reload in development.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientInstance };

function createPrismaClient(): PrismaClientInstance {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) throw new Error("DATABASE_URL environment variable is not set");

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
  } as ConstructorParameters<typeof PrismaClient>[0]);
}

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env["NODE_ENV"] !== "production") {
  globalForPrisma.prisma = prisma;
}
