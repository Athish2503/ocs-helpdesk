import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
// Prevent multiple Prisma Client instances during hot-reload in development.
const globalForPrisma = globalThis;
function createPrismaClient() {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString)
        throw new Error("DATABASE_URL environment variable is not set");
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({
        adapter,
        log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
    });
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env["NODE_ENV"] !== "production") {
    globalForPrisma.prisma = prisma;
}
