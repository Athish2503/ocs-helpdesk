"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listArticlesHandler = listArticlesHandler;
exports.getArticleByIdOrSlugHandler = getArticleByIdOrSlugHandler;
exports.createArticleHandler = createArticleHandler;
exports.updateArticleHandler = updateArticleHandler;
exports.deleteArticleHandler = deleteArticleHandler;
exports.listCategoriesHandler = listCategoriesHandler;
exports.createCategoryHandler = createCategoryHandler;
exports.updateCategoryHandler = updateCategoryHandler;
exports.deleteCategoryHandler = deleteCategoryHandler;
exports.listTagsHandler = listTagsHandler;
exports.listVersionsHandler = listVersionsHandler;
exports.recordArticleReadHandler = recordArticleReadHandler;
exports.getArticleAnalyticsHandler = getArticleAnalyticsHandler;
exports.getArticleSEOHandler = getArticleSEOHandler;
exports.updateArticleSEOHandler = updateArticleSEOHandler;
exports.listSecurityEventsHandler = listSecurityEventsHandler;
exports.uploadKBImageHandler = uploadKBImageHandler;
exports.listAttachmentsHandler = listAttachmentsHandler;
exports.deleteAttachmentHandler = deleteAttachmentHandler;
exports.setFeaturedImageHandler = setFeaturedImageHandler;
exports.reorderAttachmentsHandler = reorderAttachmentsHandler;
exports.promoteTicketToKbHandler = promoteTicketToKbHandler;
exports.getPublicSitemapHandler = getPublicSitemapHandler;
exports.getPublicArticleBySlugHandler = getPublicArticleBySlugHandler;
const kb_schemas_js_1 = require("./kb.schemas.js");
const KbService = __importStar(require("./kb.service.js"));
const abac_middleware_js_1 = require("../../middleware/abac.middleware.js");
const seoHelper_js_1 = require("../../utils/seoHelper.js");
const securityHelper_js_1 = require("../../utils/securityHelper.js");
const uploadMiddleware_js_1 = require("../../middleware/uploadMiddleware.js");
const publicSecurity_js_1 = require("../../middleware/publicSecurity.js");
const prisma_js_1 = require("../../config/prisma.js");
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
// --- ARTICLES ---
async function listArticlesHandler(req, res, next) {
    try {
        const { search, categoryId, isInternal, isPublished, tag } = req.query;
        const result = await KbService.listArticles(req.user, {
            search: search,
            categoryId: categoryId,
            isInternal: isInternal,
            isPublished: isPublished,
            tag: tag,
        });
        ok(res, result);
    }
    catch (err) {
        next(err);
    }
}
async function getArticleByIdOrSlugHandler(req, res, next) {
    try {
        const { idOrSlug } = req.params;
        let article;
        const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isId) {
            article = await KbService.getArticleById(idOrSlug);
        }
        else {
            article = await KbService.getArticleBySlug(idOrSlug);
        }
        // ABAC Verification
        const allowed = await (0, abac_middleware_js_1.canAccessArticle)(req.user?.id, req.user?.role, article.id);
        if (!allowed) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Access denied to this article" },
            });
            return;
        }
        ok(res, { article });
    }
    catch (err) {
        next(err);
    }
}
async function createArticleHandler(req, res, next) {
    try {
        const input = kb_schemas_js_1.createArticleSchema.parse(req.body);
        const article = await KbService.createArticle(input, req.user.id);
        ok(res, { article }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateArticleHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = kb_schemas_js_1.updateArticleSchema.parse(req.body);
        const article = await KbService.getArticleById(id);
        if (req.user.role !== "ADMIN" && article.authorId !== req.user.id) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Only the author or an admin can edit this article" },
            });
            return;
        }
        const updated = await KbService.updateArticle(id, input, req.user.id);
        ok(res, { article: updated });
    }
    catch (err) {
        next(err);
    }
}
async function deleteArticleHandler(req, res, next) {
    try {
        const { id } = req.params;
        const article = await KbService.getArticleById(id);
        if (req.user.role !== "ADMIN" && article.authorId !== req.user.id) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Only the author or an admin can delete this article" },
            });
            return;
        }
        await KbService.deleteArticle(id);
        ok(res, { message: "Article deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
// --- CATEGORIES ---
async function listCategoriesHandler(req, res, next) {
    try {
        const categories = await KbService.listCategories();
        ok(res, { categories });
    }
    catch (err) {
        next(err);
    }
}
async function createCategoryHandler(req, res, next) {
    try {
        const input = kb_schemas_js_1.createCategorySchema.parse(req.body);
        const category = await KbService.createCategory(input);
        ok(res, { category }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateCategoryHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = kb_schemas_js_1.updateCategorySchema.parse(req.body);
        const category = await KbService.updateCategory(id, input);
        ok(res, { category });
    }
    catch (err) {
        next(err);
    }
}
async function deleteCategoryHandler(req, res, next) {
    try {
        const { id } = req.params;
        await KbService.deleteCategory(id);
        ok(res, { message: "Category deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
// --- TAGS ---
async function listTagsHandler(req, res, next) {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const tags = await KbService.listTags(limit);
        ok(res, { tags });
    }
    catch (err) {
        next(err);
    }
}
// --- VERSIONS ---
async function listVersionsHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const versions = await KbService.listVersions(articleId);
        ok(res, { versions });
    }
    catch (err) {
        next(err);
    }
}
// --- TELEMETRY READ TRACKING ---
async function recordArticleReadHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const { utmSource, utmMedium, utmCampaign, readDuration, scrollDepth } = req.body;
        const sessionFingerprint = (0, securityHelper_js_1.generateFingerprint)(req);
        const ipHash = (0, securityHelper_js_1.hashIP)(req.ip || "");
        const read = await KbService.recordArticleRead(articleId, {
            sessionFingerprint,
            ipHash,
            userAgent: req.get("user-agent"),
            referrer: req.get("referer") || req.get("referrer"),
            utmSource: utmSource,
            utmMedium: utmMedium,
            utmCampaign: utmCampaign,
            readDuration: readDuration ? parseInt(readDuration, 10) : undefined,
            scrollDepth: scrollDepth ? parseInt(scrollDepth, 10) : undefined,
        });
        ok(res, { read });
    }
    catch (err) {
        next(err);
    }
}
// --- ANALYTICS ---
async function getArticleAnalyticsHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const { startDate, endDate } = req.query;
        const dateRange = {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        };
        const analytics = await KbService.getArticleAnalytics(articleId, dateRange);
        ok(res, { analytics });
    }
    catch (err) {
        next(err);
    }
}
// --- SEO MANAGEMENT ---
async function getArticleSEOHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const seo = await KbService.getArticleSEO(articleId);
        ok(res, { seo });
    }
    catch (err) {
        next(err);
    }
}
async function updateArticleSEOHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const input = kb_schemas_js_1.updateArticleSEOSchema.parse(req.body);
        const seo = await KbService.updateArticleSEO(articleId, input);
        ok(res, { seo });
    }
    catch (err) {
        next(err);
    }
}
// --- SECURITY MONITORING ---
async function listSecurityEventsHandler(req, res, next) {
    try {
        const { eventType, severity, isResolved, limit } = req.query;
        const filters = {
            eventType: eventType,
            severity: severity,
            isResolved: isResolved !== undefined ? isResolved === "true" : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
        };
        const events = await KbService.listSecurityEvents(filters);
        ok(res, { events });
    }
    catch (err) {
        next(err);
    }
}
// --- ATTACHMENTS (IMAGE UPLOAD) ---
async function uploadKBImageHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        if (!req.file) {
            res.status(400).json({ success: false, error: { message: "No file uploaded" } });
            return;
        }
        const { width, height } = await (0, uploadMiddleware_js_1.getImageDimensions)(req.file.path);
        const attachment = await KbService.createAttachment(articleId, {
            filename: req.file.filename,
            originalFilename: req.file.originalname,
            filePath: req.file.path,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            width: width || undefined,
            height: height || undefined,
            uploadedBy: req.user.id,
        });
        ok(res, { attachment }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function listAttachmentsHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const attachments = await KbService.listAttachments(articleId);
        ok(res, { attachments });
    }
    catch (err) {
        next(err);
    }
}
async function deleteAttachmentHandler(req, res, next) {
    try {
        const { id } = req.params;
        const attachment = await prisma_js_1.prisma.knowledgeBaseArticleAttachment.findUnique({
            where: { id: id },
        });
        if (!attachment) {
            res.status(404).json({ success: false, error: { message: "Attachment not found" } });
            return;
        }
        await KbService.deleteAttachment(id);
        (0, uploadMiddleware_js_1.deleteUploadedFile)(attachment.filePath);
        ok(res, { message: "Attachment deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
async function setFeaturedImageHandler(req, res, next) {
    try {
        const { articleId, attachmentId } = req.params;
        const attachment = await KbService.setFeaturedImage(articleId, attachmentId);
        ok(res, { attachment });
    }
    catch (err) {
        next(err);
    }
}
async function reorderAttachmentsHandler(req, res, next) {
    try {
        const { articleId } = req.params;
        const { orderPairs } = req.body;
        if (!Array.isArray(orderPairs)) {
            res.status(400).json({ success: false, error: { message: "orderPairs must be an array" } });
            return;
        }
        await KbService.reorderAttachments(articleId, orderPairs);
        ok(res, { message: "Attachments reordered successfully" });
    }
    catch (err) {
        next(err);
    }
}
// --- ADAPTED TICKET PROMOTION ---
async function promoteTicketToKbHandler(req, res, next) {
    try {
        const { ticketId } = req.params;
        const article = await KbService.promoteTicketToKb(ticketId, req.user.id);
        ok(res, { article }, 201);
    }
    catch (err) {
        next(err);
    }
}
// --- PUBLIC VIEW ---
async function getPublicSitemapHandler(req, res, next) {
    try {
        const articles = await KbService.getPublicArticlesForSitemap();
        const mapped = articles.map((a) => ({
            slug: a.slug,
            canonical_url: a.canonicalUrl,
            created_at: a.createdAt,
            updated_at: a.updatedAt,
            isPublished: a.isPublished,
        }));
        const xml = (0, seoHelper_js_1.generateSitemap)(mapped);
        res.header("Content-Type", "application/xml");
        res.status(200).send(xml);
    }
    catch (err) {
        next(err);
    }
}
async function getPublicArticleBySlugHandler(req, res, next) {
    try {
        const { slug } = req.params;
        const article = await KbService.getPublicArticleBySlug(slug);
        if (!article) {
            res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Article not found" } });
            return;
        }
        const sanitized = (0, publicSecurity_js_1.sanitizeResponse)(article);
        ok(res, { article: sanitized });
    }
    catch (err) {
        next(err);
    }
}
