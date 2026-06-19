import { prisma } from "../../config/prisma.js";
import type { CreateCategoryInput, UpdateCategoryInput } from "./categories.schemas.js";

function slugify(text: string): string {
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

async function isDescendant(categoryId: string, candidateParentId: string): Promise<boolean> {
  let currentId = candidateParentId;
  while (currentId) {
    const cat = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!cat) break;
    if (cat.parentId === categoryId) return true;
    currentId = cat.parentId || "";
  }
  return false;
}

/**
 * Fetch all active support categories.
 */
export async function getActiveCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Fetch all categories with parent relationships and ticket/article usage metrics.
 */
export async function getAllCategories() {
  const categories = await prisma.category.findMany({
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
export async function createCategory(input: CreateCategoryInput) {
  const existing = await prisma.category.findUnique({
    where: { name: input.name },
  });

  if (existing) {
    const error = new Error("Category with this name already exists") as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  const slug = slugify(input.name) || "category";

  return prisma.category.create({
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
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  // Check name uniqueness if changed
  if (input.name && input.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      const error = new Error("Category with this name already exists") as Error & { statusCode: number };
      error.statusCode = 409;
      throw error;
    }
  }

  // Prevent parenting loops
  if (input.parentId) {
    if (input.parentId === id) {
      const error = new Error("A category cannot be its own parent") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const formsCycle = await isDescendant(id, input.parentId);
    if (formsCycle) {
      const error = new Error("Cycle detected: a category cannot have its descendant as a parent") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }
  }

  const data: any = { ...input };
  if (input.name) {
    data.slug = slugify(input.name) || "category";
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

/**
 * Delete a category, optionally reassigned to a replacement category to merge usage.
 */
export async function deleteCategory(id: string, reassignToId?: string) {
  const count = await prisma.category.findUnique({
    where: { id },
    select: {
      _count: {
        select: { tickets: true, kbArticles: true },
      },
    },
  });

  if (!count) {
    const error = new Error("Category not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  const hasAssociations = count._count.tickets > 0 || count._count.kbArticles > 0;

  if (hasAssociations) {
    if (!reassignToId) {
      const error = new Error(
        "Cannot delete category: it is associated with tickets or articles. Please select a replacement category to reassign them."
      ) as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    if (reassignToId === id) {
      const error = new Error("Cannot reassign associated items to the same category being deleted") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const replacement = await prisma.category.findUnique({
      where: { id: reassignToId },
    });

    if (!replacement || !replacement.isActive) {
      const error = new Error("Replacement category not found or is inactive") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    // Reassign all associated tickets and articles in transaction
    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignToId },
      }),
      prisma.knowledgeBaseArticle.updateMany({
        where: { categoryId: id },
        data: { categoryId: reassignToId },
      }),
    ]);
  }

  // Adjust child categories to shift parent association
  await prisma.category.updateMany({
    where: { parentId: id },
    data: { parentId: reassignToId || null },
  });

  return prisma.category.delete({
    where: { id },
  });
}

/**
 * Bulk delete categories, optionally reassigned to a replacement category to merge usage.
 */
export async function bulkDeleteCategories(ids: string[], reassignToId?: string) {
  if (!ids || ids.length === 0) return;

  // Find all ticket and article counts for the categories to be deleted
  const categoriesData = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      _count: {
        select: { tickets: true, kbArticles: true },
      },
    },
  });

  const totalTickets = categoriesData.reduce((acc, cat) => acc + cat._count.tickets, 0);
  const totalArticles = categoriesData.reduce((acc, cat) => acc + cat._count.kbArticles, 0);
  const hasAssociations = totalTickets > 0 || totalArticles > 0;

  if (hasAssociations) {
    if (!reassignToId) {
      const error = new Error(
        "Cannot delete categories: one or more are associated with tickets or articles. Please select a replacement category to reassign them."
      ) as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    if (ids.includes(reassignToId)) {
      const error = new Error("Cannot reassign associated items to a category that is being deleted") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    const replacement = await prisma.category.findUnique({
      where: { id: reassignToId },
    });

    if (!replacement || !replacement.isActive) {
      const error = new Error("Replacement category not found or is inactive") as Error & { statusCode: number };
      error.statusCode = 400;
      throw error;
    }

    // Reassign all associated tickets and articles in transaction
    await prisma.$transaction([
      prisma.ticket.updateMany({
        where: { categoryId: { in: ids } },
        data: { categoryId: reassignToId },
      }),
      prisma.knowledgeBaseArticle.updateMany({
        where: { categoryId: { in: ids } },
        data: { categoryId: reassignToId },
      }),
    ]);
  }

  // Adjust child categories to shift parent association
  await prisma.category.updateMany({
    where: { parentId: { in: ids } },
    data: { parentId: reassignToId || null },
  });

  // Delete categories
  return prisma.category.deleteMany({
    where: { id: { in: ids } },
  });
}


