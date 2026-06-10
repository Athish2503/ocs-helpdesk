"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveCategories = getActiveCategories;
exports.createCategory = createCategory;
const prisma_js_1 = require("../../config/prisma.js");
/**
 * Fetch all active support categories.
 */
async function getActiveCategories() {
    return prisma_js_1.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });
}
/**
 * Create a new category (for setup/admin seeding).
 */
async function createCategory(input) {
    const existing = await prisma_js_1.prisma.category.findUnique({
        where: { name: input.name },
    });
    if (existing) {
        const error = new Error("Category with this name already exists");
        error.statusCode = 409;
        throw error;
    }
    return prisma_js_1.prisma.category.create({
        data: {
            name: input.name,
            description: input.description || null,
            isActive: true,
        },
    });
}
