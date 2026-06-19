"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_js_1 = require("./config/prisma.js");
async function main() {
    const articles = await prisma_js_1.prisma.knowledgeBaseArticle.findMany({
        take: 5
    });
    console.log("ARTICLES IN DB:", JSON.stringify(articles, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma_js_1.prisma.$disconnect());
