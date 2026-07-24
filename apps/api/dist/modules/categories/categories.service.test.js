import { describe, it, expect, vi, beforeEach } from "vitest";
vi.mock("../../config/prisma.js", () => ({
    prisma: {
        category: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            deleteMany: vi.fn(),
            updateMany: vi.fn(),
        },
        ticket: {
            updateMany: vi.fn(),
        },
        knowledgeBaseArticle: {
            updateMany: vi.fn(),
        },
        $transaction: vi.fn((fns) => Promise.all(fns)),
    },
}));
import { prisma } from "../../config/prisma.js";
import { createCategory, updateCategory, deleteCategory, } from "./categories.service.js";
describe("Categories Service - Business Logic & Edge Cases", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("createCategory should throw 409 if category name exists", async () => {
        prisma.category.findUnique.mockResolvedValue({ id: "cat1", name: "Billing" });
        await expect(createCategory({ name: "Billing", isActive: true, credits: 0 })).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining("already exists"),
        });
    });
    it("createCategory should generate a slug from the name", async () => {
        prisma.category.findUnique.mockResolvedValue(null);
        prisma.category.create.mockResolvedValue({ id: "c1", name: "Technical Support & Hosting", slug: "technical-support-hosting" });
        const result = await createCategory({ name: "Technical Support & Hosting", isActive: true, credits: 0 });
        expect(prisma.category.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                slug: "technical-support-hosting",
            }),
        }));
    });
    it("updateCategory should throw 400 if category tries to set itself as parent", async () => {
        prisma.category.findUnique.mockResolvedValue({ id: "cat1", name: "Billing" });
        await expect(updateCategory("cat1", { parentId: "cat1" })).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("cannot be its own parent"),
        });
    });
    it("deleteCategory should throw 400 if category has associated tickets but no replacement category is provided", async () => {
        prisma.category.findUnique.mockResolvedValue({
            id: "cat1",
            _count: { tickets: 5, kbArticles: 0 },
        });
        await expect(deleteCategory("cat1")).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining("associated with tickets or articles"),
        });
    });
    it("deleteCategory should reassign associated tickets and articles when reassignToId is provided", async () => {
        prisma.category.findUnique
            .mockResolvedValueOnce({
            id: "cat1",
            _count: { tickets: 5, kbArticles: 2 },
        })
            .mockResolvedValueOnce({
            id: "cat2",
            name: "Replacement",
            isActive: true,
        });
        prisma.category.delete.mockResolvedValue({ id: "cat1" });
        await deleteCategory("cat1", "cat2");
        expect(prisma.ticket.updateMany).toHaveBeenCalledWith({
            where: { categoryId: "cat1" },
            data: { categoryId: "cat2" },
        });
        expect(prisma.knowledgeBaseArticle.updateMany).toHaveBeenCalledWith({
            where: { categoryId: "cat1" },
            data: { categoryId: "cat2" },
        });
        expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat1" } });
    });
});
