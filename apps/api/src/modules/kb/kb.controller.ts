import type { Request, Response, NextFunction } from "express";
import {
  createArticleSchema,
  updateArticleSchema,
  createCategorySchema,
  updateCategorySchema,
  updateArticleSEOSchema,
} from "./kb.schemas.js";
import * as KbService from "./kb.service.js";
import { canAccessArticle } from "../../middleware/abac.middleware.js";
import { generateSitemap, extractKeywords } from "../../utils/seoHelper.js";
import { generateFingerprint, hashIP } from "../../utils/securityHelper.js";
import { getImageDimensions, deleteUploadedFile } from "../../middleware/uploadMiddleware.js";
import { sanitizeResponse } from "../../middleware/publicSecurity.js";
import { prisma } from "../../config/prisma.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

// --- ARTICLES ---

export async function listArticlesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, isInternal, isPublished, tag } = req.query;
    const result = await KbService.listArticles(req.user, {
      search: search as string,
      categoryId: categoryId as string,
      isInternal: isInternal as string,
      isPublished: isPublished as string,
      tag: tag as string,
    });
    ok(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getArticleByIdOrSlugHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { idOrSlug } = req.params;
    let article;
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug as string);

    if (isId) {
      article = await KbService.getArticleById(idOrSlug as string);
    } else {
      article = await KbService.getArticleBySlug(idOrSlug as string);
    }

    // ABAC Verification
    const allowed = await canAccessArticle(req.user?.id, req.user?.role, article.id);
    if (!allowed) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Access denied to this article" },
      });
      return;
    }

    ok(res, { article });
  } catch (err) {
    next(err);
  }
}

export async function createArticleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createArticleSchema.parse(req.body);
    const article = await KbService.createArticle(input, req.user!.id);
    ok(res, { article }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateArticleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateArticleSchema.parse(req.body);

    const article = await KbService.getArticleById(id as string);
    if (req.user!.role !== "ADMIN" && article.authorId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only the author or an admin can edit this article" },
      });
      return;
    }

    const updated = await KbService.updateArticle(id as string, input, req.user!.id);
    ok(res, { article: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteArticleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const article = await KbService.getArticleById(id as string);
    if (req.user!.role !== "ADMIN" && article.authorId !== req.user!.id) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Only the author or an admin can delete this article" },
      });
      return;
    }

    await KbService.deleteArticle(id as string);
    ok(res, { message: "Article deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// --- CATEGORIES ---

export async function listCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await KbService.listCategories();
    ok(res, { categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await KbService.createCategory(input);
    ok(res, { category }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateCategorySchema.parse(req.body);
    const category = await KbService.updateCategory(id as string, input);
    ok(res, { category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await KbService.deleteCategory(id as string);
    ok(res, { message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
}

// --- TAGS ---

export async function listTagsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const tags = await KbService.listTags(limit);
    ok(res, { tags });
  } catch (err) {
    next(err);
  }
}

// --- VERSIONS ---

export async function listVersionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const versions = await KbService.listVersions(articleId as string);
    ok(res, { versions });
  } catch (err) {
    next(err);
  }
}

// --- TELEMETRY READ TRACKING ---

export async function recordArticleReadHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const { utmSource, utmMedium, utmCampaign, readDuration, scrollDepth } = req.body;

    const sessionFingerprint = generateFingerprint(req);
    const ipHash = hashIP(req.ip || "");

    const read = await KbService.recordArticleRead(articleId as string, {
      sessionFingerprint,
      ipHash,
      userAgent: req.get("user-agent"),
      referrer: req.get("referer") || req.get("referrer"),
      utmSource: utmSource as string,
      utmMedium: utmMedium as string,
      utmCampaign: utmCampaign as string,
      readDuration: readDuration ? parseInt(readDuration, 10) : undefined,
      scrollDepth: scrollDepth ? parseInt(scrollDepth, 10) : undefined,
    });

    ok(res, { read });
  } catch (err) {
    next(err);
  }
}

// --- ANALYTICS ---

export async function getArticleAnalyticsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const { startDate, endDate } = req.query;

    const dateRange = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const analytics = await KbService.getArticleAnalytics(articleId as string, dateRange);
    ok(res, { analytics });
  } catch (err) {
    next(err);
  }
}

// --- SEO MANAGEMENT ---

export async function getArticleSEOHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const seo = await KbService.getArticleSEO(articleId as string);
    ok(res, { seo });
  } catch (err) {
    next(err);
  }
}

export async function updateArticleSEOHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const input = updateArticleSEOSchema.parse(req.body);
    const seo = await KbService.updateArticleSEO(articleId as string, input);
    ok(res, { seo });
  } catch (err) {
    next(err);
  }
}

// --- SECURITY MONITORING ---

export async function listSecurityEventsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { eventType, severity, isResolved, limit } = req.query;
    const filters = {
      eventType: eventType as string,
      severity: severity as string,
      isResolved: isResolved !== undefined ? isResolved === "true" : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    };

    const events = await KbService.listSecurityEvents(filters);
    ok(res, { events });
  } catch (err) {
    next(err);
  }
}

// --- ATTACHMENTS (IMAGE UPLOAD) ---

export async function uploadKBImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    if (!req.file) {
      res.status(400).json({ success: false, error: { message: "No file uploaded" } });
      return;
    }

    const { width, height } = await getImageDimensions(req.file.path);

    const attachment = await KbService.createAttachment(articleId as string, {
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      width: width || undefined,
      height: height || undefined,
      uploadedBy: req.user!.id,
    });

    ok(res, { attachment }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listAttachmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const attachments = await KbService.listAttachments(articleId as string);
    ok(res, { attachments });
  } catch (err) {
    next(err);
  }
}

export async function deleteAttachmentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const attachment = await prisma.knowledgeBaseArticleAttachment.findUnique({
      where: { id: id as string },
    });
    if (!attachment) {
      res.status(404).json({ success: false, error: { message: "Attachment not found" } });
      return;
    }

    await KbService.deleteAttachment(id as string);
    deleteUploadedFile(attachment.filePath);

    ok(res, { message: "Attachment deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function setFeaturedImageHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId, attachmentId } = req.params;
    const attachment = await KbService.setFeaturedImage(articleId as string, attachmentId as string);
    ok(res, { attachment });
  } catch (err) {
    next(err);
  }
}

export async function reorderAttachmentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { articleId } = req.params;
    const { orderPairs } = req.body;

    if (!Array.isArray(orderPairs)) {
      res.status(400).json({ success: false, error: { message: "orderPairs must be an array" } });
      return;
    }

    await KbService.reorderAttachments(articleId as string, orderPairs);
    ok(res, { message: "Attachments reordered successfully" });
  } catch (err) {
    next(err);
  }
}

// --- ADAPTED TICKET PROMOTION ---

export async function promoteTicketToKbHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { ticketId } = req.params;
    const article = await KbService.promoteTicketToKb(ticketId as string, req.user!.id);
    ok(res, { article }, 201);
  } catch (err) {
    next(err);
  }
}

// --- PUBLIC VIEW ---

export async function getPublicSitemapHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const articles = await KbService.getPublicArticlesForSitemap();
    const mapped = articles.map((a) => ({
      slug: a.slug,
      canonical_url: a.canonicalUrl,
      created_at: a.createdAt,
      updated_at: a.updatedAt,
      isPublished: a.isPublished,
    }));
    const xml = generateSitemap(mapped);
    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
}

export async function getPublicArticleBySlugHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;
    const article = await KbService.getPublicArticleBySlug(slug as string);
    if (!article) {
      res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Article not found" } });
      return;
    }

    const sanitized = sanitizeResponse(article);
    ok(res, { article: sanitized });
  } catch (err) {
    next(err);
  }
}

export async function getArticleSuggestionsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const text = (req.query["text"] as string) || "";
    const categoryId = (req.query["categoryId"] as string) || undefined;

    if (!text.trim()) {
      res.status(200).json({ success: true, data: { articles: [] } });
      return;
    }

    const keywords = extractKeywords(text, 5);

    if (keywords.length === 0) {
      res.status(200).json({ success: true, data: { articles: [] } });
      return;
    }

    const where: any = {
      isPublished: true,
      isInternal: false,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    where.OR = keywords.flatMap((keyword) => [
      { title: { contains: keyword, mode: "insensitive" } },
      { content: { contains: keyword, mode: "insensitive" } },
    ]);

    const articles = await prisma.knowledgeBaseArticle.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      take: 5,
    });

    res.status(200).json({ success: true, data: { articles } });
  } catch (err) {
    next(err);
  }
}
