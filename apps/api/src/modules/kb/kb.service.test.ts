import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/prisma.js", () => ({
  prisma: {
    knowledgeBaseArticle: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    crmService: {
      findMany: vi.fn(),
    },
    category: {
      findMany: vi.fn(),
    },
    knowledgeBaseArticleVersion: {
      create: vi.fn(),
    },
  },
}));

import { prisma } from "../../config/prisma.js";
import {
  listArticles,
  getArticleById,
  getArticleBySlug,
  createArticle,
} from "./kb.service.js";

describe("Knowledge Base Service - Business Logic & Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listArticles for CUSTOMER role should only return published public articles", async () => {
    (prisma.user.findUnique as any).mockResolvedValue({ crmCustomerId: null });
    (prisma.knowledgeBaseArticle.findMany as any).mockResolvedValue([]);
    (prisma.knowledgeBaseArticle.count as any).mockResolvedValue(0);

    await listArticles({ id: "cust1", role: "CUSTOMER" });

    expect(prisma.knowledgeBaseArticle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPublished: true,
          isInternal: false,
        }),
      })
    );
  });

  it("getArticleById should throw 404 if article not found", async () => {
    (prisma.knowledgeBaseArticle.findUnique as any).mockResolvedValue(null);

    await expect(getArticleById("nonexistent")).rejects.toMatchObject({ statusCode: 404 });
  });

  it("createArticle should create article with generated unique slug", async () => {
    (prisma.knowledgeBaseArticle.create as any).mockResolvedValue({
      id: "art1",
      title: "How to configure DNS",
      slug: "how-to-configure-dns-a1b2c3",
      content: "Steps...",
      tags: [],
    });
    (prisma.knowledgeBaseArticleVersion.create as any).mockResolvedValue({});

    const article = await createArticle(
      { title: "How to configure DNS", content: "Steps..." },
      "author1"
    );

    expect(article.id).toBe("art1");
    expect(prisma.knowledgeBaseArticle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "How to configure DNS",
          authorId: "author1",
        }),
      })
    );
  });
});
