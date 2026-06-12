"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listArticles = listArticles;
exports.getArticleById = getArticleById;
exports.getArticleBySlug = getArticleBySlug;
exports.createArticle = createArticle;
exports.updateArticle = updateArticle;
exports.deleteArticle = deleteArticle;
const prisma_js_1 = require("../../config/prisma.js");
const crypto_1 = __importDefault(require("crypto"));
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
async function generateUniqueSlug(title) {
    const baseSlug = slugify(title) || "article";
    const randomSuffix = crypto_1.default.randomBytes(3).toString("hex");
    return `${baseSlug}-${randomSuffix}`;
}
async function listArticles(user, query) {
    const where = {};
    // Enforcement of ABAC / RBAC visibility rules
    if (!user || user.role === "CUSTOMER") {
        // Customers and anonymous users can only see published external articles
        where.isPublished = true;
        where.isInternal = false;
    }
    else {
        // Admin & Agent can see everything, optionally filtered
        if (query?.isInternal !== undefined) {
            where.isInternal = query.isInternal === "true";
        }
        if (query?.isPublished !== undefined) {
            where.isPublished = query.isPublished === "true";
        }
    }
    if (query?.categoryId) {
        where.categoryId = query.categoryId;
    }
    if (query?.search) {
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { content: { contains: query.search, mode: "insensitive" } },
        ];
    }
    return prisma_js_1.prisma.knowledgeBaseArticle.findMany({
        where,
        include: {
            author: {
                select: { id: true, name: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}
async function getArticleById(id) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: {
            author: {
                select: { id: true, name: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
    if (!article) {
        const error = new Error("Article not found");
        error.statusCode = 404;
        throw error;
    }
    return article;
}
async function getArticleBySlug(slug) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { slug },
        include: {
            author: {
                select: { id: true, name: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
    if (!article) {
        const error = new Error("Article not found");
        error.statusCode = 404;
        throw error;
    }
    return article;
}
async function createArticle(input, authorId) {
    const slug = await generateUniqueSlug(input.title);
    return prisma_js_1.prisma.knowledgeBaseArticle.create({
        data: {
            title: input.title,
            slug,
            content: input.content,
            isPublished: input.isPublished ?? false,
            isInternal: input.isInternal ?? false,
            authorId,
            categoryId: input.categoryId || null,
        },
        include: {
            author: {
                select: { id: true, name: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
}
async function updateArticle(id, input) {
    const article = await getArticleById(id);
    const data = { ...input };
    if (input.title && input.title !== article.title) {
        data.slug = await generateUniqueSlug(input.title);
    }
    return prisma_js_1.prisma.knowledgeBaseArticle.update({
        where: { id },
        data,
        include: {
            author: {
                select: { id: true, name: true },
            },
            category: {
                select: { id: true, name: true },
            },
        },
    });
}
async function deleteArticle(id) {
    await getArticleById(id);
    return prisma_js_1.prisma.knowledgeBaseArticle.delete({
        where: { id },
    });
}
