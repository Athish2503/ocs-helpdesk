"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_js_1 = require("../generated/prisma/client.js");
// Prevent multiple Prisma Client instances during hot-reload in development.
const globalForPrisma = globalThis;
function createPrismaClient() {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString)
        throw new Error("DATABASE_URL environment variable is not set");
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    return new client_js_1.PrismaClient({
        adapter,
        log: process.env["NODE_ENV"] === "development" ? ["error", "warn"] : ["error"],
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env["NODE_ENV"] !== "production") {
    globalForPrisma.prisma = exports.prisma;
}
