import type { Request, Response, NextFunction } from "express";
import { createCategorySchema, updateCategorySchema } from "./categories.schemas.js";
import * as CategoriesService from "./categories.service.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function getCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const isStaff = req.user?.role === "ADMIN" || req.user?.role === "AGENT";
    const all = req.query["all"] === "true";

    if (isStaff && all) {
      const categories = await CategoriesService.getAllCategories();
      ok(res, { categories });
    } else {
      const categories = await CategoriesService.getActiveCategories();
      ok(res, { categories });
    }
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

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateCategorySchema.parse(req.body);
    const category = await CategoriesService.updateCategory(id as string, input);
    ok(res, { category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategoryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reassignToId } = req.body;
    await CategoriesService.deleteCategory(id as string, reassignToId);
    ok(res, { message: "Category deleted successfully" });
  } catch (err) {
    next(err);
  }
}

export async function bulkDeleteCategoriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, reassignToId } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: { message: "ids array is required and cannot be empty" } });
      return;
    }
    await CategoriesService.bulkDeleteCategories(ids, reassignToId);
    ok(res, { message: "Categories deleted successfully" });
  } catch (err) {
    next(err);
  }
}


