import type { Request, Response, NextFunction } from "express";
import { createArticleSchema, updateArticleSchema } from "./kb.schemas.js";
import * as KbService from "./kb.service.js";
import { canAccessArticle } from "../../middleware/abac.middleware.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function listArticlesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, categoryId, isInternal, isPublished } = req.query;
    const articles = await KbService.listArticles(req.user, {
      search: search as string,
      categoryId: categoryId as string,
      isInternal: isInternal as string,
      isPublished: isPublished as string,
    });
    ok(res, { articles });
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

    const updated = await KbService.updateArticle(id as string, input);
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
