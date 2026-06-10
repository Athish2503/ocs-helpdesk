import { prisma } from "../../config/prisma.js";
import type { CreateCategoryInput } from "./categories.schemas.js";

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
 * Create a new category (for setup/admin seeding).
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

  return prisma.category.create({
    data: {
      name: input.name,
      description: input.description || null,
      isActive: true,
    },
  });
}
