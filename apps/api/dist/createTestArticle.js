"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("./config/prisma.js");
async function main() {
    // Let's find an author
    const user = await prisma_js_1.prisma.user.findFirst();
    if (!user) {
        console.log("No user found in DB. Please register a user first.");
        return;
    }
    const article = await prisma_js_1.prisma.knowledgeBaseArticle.create({
        data: {
            title: "Test HTML Article",
            slug: "test-html-article-" + Math.floor(Math.random() * 1000),
            content: "<strong><h2>This is to be bold</h2></strong>",
            isPublished: true,
            isInternal: false,
            authorId: user.id,
        }
    });
    console.log("CREATED ARTICLE:", JSON.stringify(article, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma_js_1.prisma.$disconnect());
