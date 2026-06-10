"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDefaultCategories = seedDefaultCategories;
const prisma_js_1 = require("../config/prisma.js");
async function seedDefaultCategories() {
    const defaultCategories = [
        { name: "Technical Support", description: "Hardware, software, or networking issues." },
        { name: "Billing & Invoicing", description: "Subscription plans, invoices, and payment issues." },
        { name: "Account Access & Security", description: "Password resets, multi-factor authentication, or permissions." },
        { name: "Feature Requests & Feedback", description: "Suggestions and enhancements for products or services." },
        { name: "General Inquiry", description: "Any general questions not covered by other categories." },
    ];
    console.log("🌱  Seeding default categories...");
    for (const cat of defaultCategories) {
        await prisma_js_1.prisma.category.upsert({
            where: { name: cat.name },
            update: { description: cat.description },
            create: { name: cat.name, description: cat.description, isActive: true },
        });
    }
    console.log("✅  Default categories seeded successfully!");
}
