"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveCategories = getActiveCategories;
exports.getAllCategories = getAllCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const prisma_js_1 = require("../../config/prisma.js");
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}
async function isDescendant(categoryId, candidateParentId) {
    let currentId = candidateParentId;
    while (currentId) {
        const cat = await prisma_js_1.prisma.category.findUnique({
            where: { id: currentId },
            select: { parentId: true },
        });
        if (!cat)
            break;
        if (cat.parentId === categoryId)
            return true;
        currentId = cat.parentId || "";
    }
    return false;
}
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
 * Fetch all categories with parent relationships and ticket/article usage metrics.
 */
async function getAllCategories() {
    const categories = await prisma_js_1.prisma.category.findMany({
        include: {
            parent: {
                select: { id: true, name: true },
            },
            _count: {
                select: {
                    tickets: true,
                    kbArticles: true,
                },
            },
        },
        orderBy: { name: "asc" },
    });
    return categories.map((cat) => ({
        ...cat,
        ticket_count: cat._count.tickets,
        article_count: cat._count.kbArticles,
    }));
}
/**
 * Create a new category.
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
    const slug = slugify(input.name) || "category";
    return prisma_js_1.prisma.category.create({
        data: {
            name: input.name,
            slug,
            description: input.description || null,
            isActive: input.isActive ?? true,
            parentId: input.parentId || null,
        },
    });
}
/**
 * Update an existing category with duplicate check and cycle prevention.
 */
async function updateCategory(id, input) {
    const category = await prisma_js_1.prisma.category.findUnique({
        where: { id },
    });
    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }
    // Check name uniqueness if changed
    if (input.name && input.name !== category.name) {
        const existing = await prisma_js_1.prisma.category.findUnique({
            where: { name: input.name },
        });
        if (existing) {
            const error = new Error("Category with this name already exists");
            error.statusCode = 409;
            throw error;
        }
    }
    // Prevent parenting loops
    if (input.parentId) {
        if (input.parentId === id) {
            const error = new Error("A category cannot be its own parent");
            error.statusCode = 400;
            throw error;
        }
        const formsCycle = await isDescendant(id, input.parentId);
        if (formsCycle) {
            const error = new Error("Cycle detected: a category cannot have its descendant as a parent");
            error.statusCode = 400;
            throw error;
        }
    }
    const data = { ...input };
    if (input.name) {
        data.slug = slugify(input.name) || "category";
    }
    return prisma_js_1.prisma.category.update({
        where: { id },
        data,
    });
}
/**
 * Delete a category, optionally reassigned to a replacement category to merge usage.
 */
async function deleteCategory(id, reassignToId) {
    const count = await prisma_js_1.prisma.category.findUnique({
        where: { id },
        select: {
            _count: {
                select: { tickets: true, kbArticles: true },
            },
        },
    });
    if (!count) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }
    const hasAssociations = count._count.tickets > 0 || count._count.kbArticles > 0;
    if (hasAssociations) {
        if (!reassignToId) {
            const error = new Error("Cannot delete category: it is associated with tickets or articles. Please select a replacement category to reassign them.");
            error.statusCode = 400;
            throw error;
        }
        if (reassignToId === id) {
            const error = new Error("Cannot reassign associated items to the same category being deleted");
            error.statusCode = 400;
            throw error;
        }
        const replacement = await prisma_js_1.prisma.category.findUnique({
            where: { id: reassignToId },
        });
        if (!replacement || !replacement.isActive) {
            const error = new Error("Replacement category not found or is inactive");
            error.statusCode = 400;
            throw error;
        }
        // Reassign all associated tickets and articles in transaction
        await prisma_js_1.prisma.$transaction([
            prisma_js_1.prisma.ticket.updateMany({
                where: { categoryId: id },
                data: { categoryId: reassignToId },
            }),
            prisma_js_1.prisma.knowledgeBaseArticle.updateMany({
                where: { categoryId: id },
                data: { categoryId: reassignToId },
            }),
        ]);
    }
    // Adjust child categories to shift parent association
    await prisma_js_1.prisma.category.updateMany({
        where: { parentId: id },
        data: { parentId: reassignToId || null },
    });
    return prisma_js_1.prisma.category.delete({
        where: { id },
    });
}
