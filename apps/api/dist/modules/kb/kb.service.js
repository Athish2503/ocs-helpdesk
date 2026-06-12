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
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
exports.listTags = listTags;
exports.listVersions = listVersions;
exports.recordArticleRead = recordArticleRead;
exports.getArticleAnalytics = getArticleAnalytics;
exports.getArticleSEO = getArticleSEO;
exports.updateArticleSEO = updateArticleSEO;
exports.getPublicArticlesForSitemap = getPublicArticlesForSitemap;
exports.getPublicArticleBySlug = getPublicArticleBySlug;
exports.listSecurityEvents = listSecurityEvents;
exports.createAttachment = createAttachment;
exports.listAttachments = listAttachments;
exports.deleteAttachment = deleteAttachment;
exports.setFeaturedImage = setFeaturedImage;
exports.reorderAttachments = reorderAttachments;
exports.promoteTicketToKb = promoteTicketToKb;
const prisma_js_1 = require("../../config/prisma.js");
const crypto_1 = __importDefault(require("crypto"));
const seoHelper_js_1 = require("../../utils/seoHelper.js");
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
// --- ARTICLES ---
async function listArticles(user, query) {
    const where = {};
    // Enforce visibility based on role
    if (!user || user.role === "CUSTOMER") {
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
    if (query?.authorId) {
        where.authorId = query.authorId;
    }
    if (query?.tag) {
        where.tags = {
            some: {
                name: query.tag,
            },
        };
    }
    if (query?.search) {
        where.OR = [
            { title: { contains: query.search, mode: "insensitive" } },
            { content: { contains: query.search, mode: "insensitive" } },
        ];
    }
    const limit = query?.limit ? Math.min(query.limit, 100) : 20;
    const offset = query?.offset || 0;
    const [articles, total] = await Promise.all([
        prisma_js_1.prisma.knowledgeBaseArticle.findMany({
            where,
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                tags: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
            skip: offset,
        }),
        prisma_js_1.prisma.knowledgeBaseArticle.count({ where }),
    ]);
    return {
        articles: articles.map((art) => ({
            ...art,
            tags: art.tags.map((t) => t.name),
        })),
        total,
    };
}
async function getArticleById(id) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { name: true } },
            sources: true,
        },
    });
    if (!article) {
        const error = new Error("Article not found");
        error.statusCode = 404;
        throw error;
    }
    return {
        ...article,
        tags: article.tags.map((t) => t.name),
    };
}
async function getArticleBySlug(slug) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { slug },
        include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { name: true } },
            sources: true,
        },
    });
    if (!article) {
        const error = new Error("Article not found");
        error.statusCode = 404;
        throw error;
    }
    return {
        ...article,
        tags: article.tags.map((t) => t.name),
    };
}
async function createArticle(input, authorId) {
    const slug = await generateUniqueSlug(input.title);
    // Connect or create tags if provided
    const tagConnectOrCreate = input.tags?.map((t) => ({
        where: { name: t },
        create: { name: t },
    })) || [];
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.create({
        data: {
            title: input.title,
            slug,
            content: input.content,
            isPublished: input.isPublished ?? false,
            isInternal: input.isInternal ?? false,
            authorId,
            categoryId: input.categoryId || null,
            metaTitle: input.metaTitle || null,
            metaDescription: input.metaDescription || null,
            keywords: input.keywords || null,
            canonicalUrl: input.canonicalUrl || null,
            ogImage: input.ogImage || null,
            tags: {
                connectOrCreate: tagConnectOrCreate,
            },
            // Source details mapping
            ...(input.source?.type && input.source?.id
                ? {
                    sources: {
                        create: {
                            sourceType: input.source.type,
                            sourceReferenceId: input.source.id,
                        },
                    },
                }
                : {}),
            // Create initial version snapshot
            versions: {
                create: {
                    versionNumber: 1,
                    title: input.title,
                    content: input.content,
                    changedBy: authorId,
                    changeSummary: "Initial version",
                },
            },
        },
        include: {
            author: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            tags: { select: { name: true } },
        },
    });
    return {
        ...article,
        tags: article.tags.map((t) => t.name),
    };
}
async function updateArticle(id, input, changedBy) {
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { id },
        include: { tags: true },
    });
    if (!article) {
        const error = new Error("Article not found");
        error.statusCode = 404;
        throw error;
    }
    const data = {
        title: input.title,
        content: input.content,
        isPublished: input.isPublished,
        isInternal: input.isInternal,
        categoryId: input.categoryId,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        keywords: input.keywords,
        canonicalUrl: input.canonicalUrl,
        ogImage: input.ogImage,
    };
    if (input.title && input.title !== article.title) {
        data.slug = await generateUniqueSlug(input.title);
    }
    // Handle tags disconnect & connect
    if (input.tags) {
        data.tags = {
            set: [], // Clear relations
            connectOrCreate: input.tags.map((t) => ({
                where: { name: t },
                create: { name: t },
            })),
        };
    }
    // Run database transactions to ensure version history is snapshot-saved
    const updated = await prisma_js_1.prisma.$transaction(async (tx) => {
        const art = await tx.knowledgeBaseArticle.update({
            where: { id },
            data,
            include: {
                author: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                tags: { select: { name: true } },
            },
        });
        // Save snapshot to version history if content changed
        if (input.content !== undefined && input.content !== article.content) {
            const maxVersion = await tx.knowledgeBaseArticleVersion.aggregate({
                where: { articleId: id },
                _max: { versionNumber: true },
            });
            const nextVersionNumber = (maxVersion._max.versionNumber || 0) + 1;
            await tx.knowledgeBaseArticleVersion.create({
                data: {
                    articleId: id,
                    versionNumber: nextVersionNumber,
                    title: art.title,
                    content: art.content,
                    changedBy,
                    changeSummary: `Content update (v${nextVersionNumber})`,
                },
            });
        }
        return art;
    });
    return {
        ...updated,
        tags: updated.tags.map((t) => t.name),
    };
}
async function deleteArticle(id) {
    // Verifies existence
    await getArticleById(id);
    return prisma_js_1.prisma.knowledgeBaseArticle.delete({
        where: { id },
    });
}
// --- CATEGORIES ---
async function listCategories() {
    const categories = await prisma_js_1.prisma.category.findMany({
        include: {
            _count: {
                select: { kbArticles: true },
            },
        },
        orderBy: { name: "asc" },
    });
    return categories.map((cat) => ({
        ...cat,
        article_count: cat._count.kbArticles,
    }));
}
async function createCategory(input) {
    const slug = slugify(input.name) || "category";
    return prisma_js_1.prisma.category.create({
        data: {
            name: input.name,
            slug,
            description: input.description || null,
            parentId: input.parentId || null,
        },
    });
}
async function updateCategory(id, input) {
    const data = { ...input };
    if (input.name) {
        data.slug = slugify(input.name) || "category";
    }
    return prisma_js_1.prisma.category.update({
        where: { id },
        data,
    });
}
async function deleteCategory(id) {
    return prisma_js_1.prisma.category.delete({
        where: { id },
    });
}
// --- TAGS ---
async function listTags(limit = 100) {
    const tags = await prisma_js_1.prisma.tag.findMany({
        include: {
            _count: {
                select: { articles: { where: { isPublished: true } } },
            },
        },
        take: limit,
    });
    // Filter tags having at least one published article and map fields
    return tags
        .map((tag) => ({
        name: tag.name,
        count: tag._count.articles,
    }))
        .filter((tag) => tag.count > 0)
        .sort((a, b) => b.count - a.count);
}
// --- VERSIONS ---
async function listVersions(articleId) {
    return prisma_js_1.prisma.knowledgeBaseArticleVersion.findMany({
        where: { articleId },
        include: {
            editor: { select: { id: true, name: true } },
        },
        orderBy: { versionNumber: "desc" },
    });
}
// --- TELEMETRY READ TRACKING ---
async function recordArticleRead(articleId, metadata) {
    return prisma_js_1.prisma.$transaction(async (tx) => {
        // Check if this fingerprint read this article in the last 24h for unique tracking
        const hours24Ago = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const existing = await tx.knowledgeBaseArticleRead.findFirst({
            where: {
                articleId,
                sessionFingerprint: metadata.sessionFingerprint,
                readAt: { gt: hours24Ago },
            },
        });
        const isUnique = !existing;
        const read = await tx.knowledgeBaseArticleRead.create({
            data: {
                articleId,
                sessionFingerprint: metadata.sessionFingerprint,
                ipHash: metadata.ipHash,
                userAgent: metadata.userAgent || null,
                referrer: metadata.referrer || null,
                utmSource: metadata.utmSource || null,
                utmMedium: metadata.utmMedium || null,
                utmCampaign: metadata.utmCampaign || null,
                readDuration: metadata.readDuration || 0,
                scrollDepth: metadata.scrollDepth || 0,
                isUnique,
            },
        });
        // Increment article reads counters
        await tx.knowledgeBaseArticle.update({
            where: { id: articleId },
            data: {
                totalReads: { increment: 1 },
                uniqueReads: { increment: isUnique ? 1 : 0 },
                lastReadAt: new Date(),
            },
        });
        return read;
    });
}
async function getArticleAnalytics(articleId, dateRange) {
    const where = { articleId };
    if (dateRange?.startDate || dateRange?.endDate) {
        where.readAt = {};
        if (dateRange.startDate)
            where.readAt.gte = dateRange.startDate;
        if (dateRange.endDate)
            where.readAt.lte = dateRange.endDate;
    }
    // Get total reads and unique visitors
    const aggregate = await prisma_js_1.prisma.knowledgeBaseArticleRead.aggregate({
        where,
        _count: { id: true },
        _avg: {
            readDuration: true,
            scrollDepth: true,
        },
    });
    const uniqueCount = await prisma_js_1.prisma.knowledgeBaseArticleRead.groupBy({
        by: ["sessionFingerprint"],
        where,
        _count: true,
    });
    // Daily reads over time (limit to 30 records)
    const reads = await prisma_js_1.prisma.knowledgeBaseArticleRead.findMany({
        where,
        select: { readAt: true, isUnique: true },
        orderBy: { readAt: "desc" },
        take: 1000, // retrieve sample
    });
    // Calculate daily groups in JS
    const dailyStats = {};
    reads.forEach((r) => {
        const dateStr = r.readAt.toISOString().split("T")[0];
        if (!dailyStats[dateStr]) {
            dailyStats[dateStr] = { read_count: 0, unique_visitors: 0, fingerprints: new Set() };
        }
        dailyStats[dateStr].read_count++;
        // We'll estimate unique visitors on daily basis
        const fp = r.readAt.getTime().toString(); // placeholder fingerprint or query fingerprint
        dailyStats[dateStr].fingerprints.add(fp);
    });
    const readsOverTime = Object.entries(dailyStats)
        .map(([date, val]) => ({
        date,
        read_count: val.read_count,
        unique_visitors: val.fingerprints.size,
    }))
        .slice(0, 30);
    // Referrer distributions
    const rawReferrers = await prisma_js_1.prisma.knowledgeBaseArticleRead.groupBy({
        by: ["referrer"],
        where: { ...where, NOT: { referrer: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
    });
    // Campaign distributions
    const rawCampaigns = await prisma_js_1.prisma.knowledgeBaseArticleRead.groupBy({
        by: ["utmCampaign", "utmSource", "utmMedium"],
        where: { ...where, NOT: { utmCampaign: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
    });
    return {
        stats: {
            total_reads: aggregate._count.id,
            unique_visitors: uniqueCount.length,
            avg_read_duration: Math.round(aggregate._avg.readDuration || 0),
            avg_scroll_depth: Math.round(aggregate._avg.scrollDepth || 0),
            last_read_at: reads[0]?.readAt || null,
        },
        readsOverTime,
        topReferrers: rawReferrers.map((r) => ({ referrer: r.referrer, count: r._count.id })),
        utmCampaigns: rawCampaigns.map((c) => ({
            campaign: c.utmCampaign,
            source: c.utmSource,
            medium: c.utmMedium,
            read_count: c._count.id,
        })),
    };
}
// --- SEO MANAGEMENT ---
async function getArticleSEO(articleId) {
    return prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: { id: articleId },
        select: {
            id: true,
            title: true,
            slug: true,
            metaTitle: true,
            metaDescription: true,
            keywords: true,
            canonicalUrl: true,
            ogImage: true,
            createdAt: true,
            updatedAt: true,
        },
    });
}
async function updateArticleSEO(articleId, input) {
    return prisma_js_1.prisma.knowledgeBaseArticle.update({
        where: { id: articleId },
        data: {
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            keywords: input.keywords,
            canonicalUrl: input.canonicalUrl,
            ogImage: input.ogImage,
        },
    });
}
async function getPublicArticlesForSitemap() {
    return prisma_js_1.prisma.knowledgeBaseArticle.findMany({
        where: {
            isPublished: true,
            isInternal: false,
        },
        select: {
            slug: true,
            canonicalUrl: true,
            createdAt: true,
            updatedAt: true,
            isPublished: true,
        },
        orderBy: { updatedAt: "desc" },
    });
}
async function getPublicArticleBySlug(slug) {
    return prisma_js_1.prisma.knowledgeBaseArticle.findUnique({
        where: {
            slug,
            isPublished: true,
            isInternal: false,
        },
        include: {
            author: { select: { name: true } },
            category: { select: { name: true } },
            tags: { select: { name: true } },
        },
    });
}
// --- SECURITY MONITORING ---
async function listSecurityEvents(filters) {
    const where = {};
    if (filters.eventType)
        where.eventType = filters.eventType;
    if (filters.severity)
        where.severity = filters.severity;
    if (filters.isResolved !== undefined)
        where.isResolved = filters.isResolved;
    return prisma_js_1.prisma.knowledgeBaseSecurityEvent.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: filters.limit || 100,
    });
}
// --- ATTACHMENTS (IMAGE UPLOAD) ---
async function createAttachment(articleId, metadata) {
    return prisma_js_1.prisma.knowledgeBaseArticleAttachment.create({
        data: {
            articleId,
            filename: metadata.filename,
            originalFilename: metadata.originalFilename,
            filePath: metadata.filePath,
            fileSize: metadata.fileSize,
            mimeType: metadata.mimeType,
            width: metadata.width || null,
            height: metadata.height || null,
            uploadedBy: metadata.uploadedBy,
        },
    });
}
async function listAttachments(articleId) {
    return prisma_js_1.prisma.knowledgeBaseArticleAttachment.findMany({
        where: { articleId },
        orderBy: { displayOrder: "asc" },
    });
}
async function deleteAttachment(id) {
    return prisma_js_1.prisma.knowledgeBaseArticleAttachment.delete({
        where: { id },
    });
}
async function setFeaturedImage(articleId, attachmentId) {
    return prisma_js_1.prisma.$transaction(async (tx) => {
        // Clear existing featured images for this article
        await tx.knowledgeBaseArticleAttachment.updateMany({
            where: { articleId, isFeatured: true },
            data: { isFeatured: false },
        });
        // Set new featured image
        return tx.knowledgeBaseArticleAttachment.update({
            where: { id: attachmentId },
            data: { isFeatured: true },
        });
    });
}
async function reorderAttachments(articleId, orderPairs) {
    return prisma_js_1.prisma.$transaction(orderPairs.map((pair) => prisma_js_1.prisma.knowledgeBaseArticleAttachment.update({
        where: { id: pair.id, articleId },
        data: { displayOrder: pair.order },
    })));
}
// --- ADAPTED TICKET PROMOTION ---
async function promoteTicketToKb(ticketId, authorId) {
    const ticket = await prisma_js_1.prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
            category: true,
            customer: { select: { name: true } },
        },
    });
    if (!ticket) {
        const error = new Error("Ticket not found");
        error.statusCode = 404;
        throw error;
    }
    const title = `[TICKET] Resolution: ${ticket.title}`;
    const content = `<h2>Ticket Summary</h2>
<p><strong>Customer:</strong> ${ticket.customer.name}</p>
<p><strong>Category:</strong> ${ticket.category?.name || "Unclassified"}</p>
<p><strong>Priority:</strong> ${ticket.priority}</p>

<h2>Reported Issue</h2>
<p>${ticket.description}</p>

<h2>Resolution Notes</h2>
<p><em>Add resolution steps and solutions here.</em></p>

<p><em>This draft was promoted from Ticket ID #${ticketId.slice(0, 8)}. Please refine and verify before publishing.</em></p>`;
    // Auto-generate tags using NLP clean extractKeywords helper
    const tags = (0, seoHelper_js_1.extractKeywords)(ticket.description || "", 5);
    tags.push("ticket-promo", ticket.priority.toLowerCase());
    if (ticket.category?.name) {
        tags.push(slugify(ticket.category.name));
    }
    // Create article using transactional query
    const slug = await generateUniqueSlug(title);
    const tagConnectOrCreate = tags.map((t) => ({
        where: { name: t },
        create: { name: t },
    }));
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.create({
        data: {
            title,
            slug,
            content,
            isPublished: false, // draft
            isInternal: true, // internal resolution notes
            authorId,
            categoryId: ticket.categoryId || null,
            tags: {
                connectOrCreate: tagConnectOrCreate,
            },
            sources: {
                create: {
                    sourceType: "TICKET",
                    sourceReferenceId: ticketId,
                },
            },
            versions: {
                create: {
                    versionNumber: 1,
                    title,
                    content,
                    changedBy: authorId,
                    changeSummary: `Promoted from ticket #${ticketId.slice(0, 8)}`,
                },
            },
        },
    });
    return article;
}
