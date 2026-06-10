import type { Request, Response, NextFunction } from "express";
import { createCategorySchema } from "./categories.schemas.js";
import * as CategoriesService from "./categories.service.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function getActiveCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await CategoriesService.getActiveCategories();
    ok(res, { categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createCategorySchema.parse(req.body);
    const category = await CategoriesService.createCategory(input);
    ok(res, { category }, 201);
  } catch (err) {
    next(err);
  }
}
