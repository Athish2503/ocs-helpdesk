import { prisma } from "../../config/prisma.js";
import type { CreateArticleInput, UpdateArticleInput } from "./kb.schemas.js";
import type { Role } from "../../generated/prisma/enums.js";
import crypto from "crypto";

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

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title) || "article";
  const randomSuffix = crypto.randomBytes(3).toString("hex");
  return `${baseSlug}-${randomSuffix}`;
}

export async function listArticles(
  user?: { id: string; role: Role },
  query?: { search?: string; categoryId?: string; isInternal?: string; isPublished?: string }
) {
  const where: any = {};

  // Enforcement of ABAC / RBAC visibility rules
  if (!user || user.role === "CUSTOMER") {
    // Customers and anonymous users can only see published external articles
    where.isPublished = true;
    where.isInternal = false;
  } else {
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

  return prisma.knowledgeBaseArticle.findMany({
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

export async function getArticleById(id: string) {
  const article = await prisma.knowledgeBaseArticle.findUnique({
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
    const error = new Error("Article not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return article;
}

export async function getArticleBySlug(slug: string) {
  const article = await prisma.knowledgeBaseArticle.findUnique({
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
    const error = new Error("Article not found") as Error & { statusCode: number };
    error.statusCode = 404;
    throw error;
  }

  return article;
}

export async function createArticle(input: CreateArticleInput, authorId: string) {
  const slug = await generateUniqueSlug(input.title);

  return prisma.knowledgeBaseArticle.create({
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

export async function updateArticle(id: string, input: UpdateArticleInput) {
  const article = await getArticleById(id);

  const data: any = { ...input };
  if (input.title && input.title !== article.title) {
    data.slug = await generateUniqueSlug(input.title);
  }

  return prisma.knowledgeBaseArticle.update({
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

export async function deleteArticle(id: string) {
  await getArticleById(id);

  return prisma.knowledgeBaseArticle.delete({
    where: { id },
  });
}
