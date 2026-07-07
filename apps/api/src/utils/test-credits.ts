import "dotenv/config";

import { prisma } from "../config/prisma.js";
import { updateTicket } from "../modules/tickets/tickets.service.js";

async function runTests() {
  console.log("🚀 Running Credit Calculation Integration Tests...");

  // 1. Get system admin for ticket resolution
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" }
  });
  if (!admin) {
    throw new Error("No admin user found. Run seeding first.");
  }
  const adminCtx = {
    id: admin.id,
    role: admin.role,
    email: admin.email
  };

  // Get a category for tickets
  let category = await prisma.category.findFirst();
  if (!category) {
    category = await prisma.category.create({
      data: { name: "Billing & Accounts", slug: "billing" }
    });
  }

  // 2. Create a customer with NO registered domains in OCS
  const customerNoDomains = await prisma.user.upsert({
    where: { email: "test-new-client@no-domains.com" },
    update: {},
    create: {
      name: "New Client No Domains",
      email: "test-new-client@no-domains.com",
      role: "CUSTOMER",
      isActive: true,
      emailVerified: true
    }
  });

  // Ensure CustomerCredits is reset
  await prisma.customerCredits.upsert({
    where: { customerId: customerNoDomains.id },
    update: {
      allocatedHours: 1000.0,
      usedHours: 0.0,
      remainingHours: 1000.0,
      billableHours: 0.0,
      creditCategoryId: null
    },
    create: {
      customerId: customerNoDomains.id,
      allocatedHours: 1000.0,
      usedHours: 0.0,
      remainingHours: 1000.0,
      billableHours: 0.0,
    }
  });

  // Create a ticket for a domain outside of OCS (e.g. external.com)
  const ticket1 = await prisma.ticket.create({
    data: {
      title: "Help with external domain email setup",
      description: "My email on external.com is not working",
      categoryId: category.id,
      customerId: customerNoDomains.id,
      priority: "MEDIUM",
      affectedDomain: "external.com",
      status: "OPEN"
    }
  });

  // Create a dummy attachment to pass backend screenshot validation
  await prisma.ticketAttachment.create({
    data: {
      ticketId: ticket1.id,
      filename: "test-resolution-proof.png",
      filePath: "/uploads/kb/images/test-resolution-proof.png",
      mimeType: "image/png"
    }
  });

  console.log("Resolving ticket for domain outside of OCS with 0.2 hours consumed (less than 0.5h min)...");
  // Resolve the ticket
  await updateTicket(ticket1.id, { status: "RESOLVED", hoursConsumed: 0.2 }, adminCtx);

  // Retrieve customer credits
  const credits1 = await prisma.customerCredits.findUnique({
    where: { customerId: customerNoDomains.id }
  });

  console.log("Credits after ticket 1 resolution:", credits1);

  // We expect:
  // Actual hours consumed < 0.5, so rounded to 0.5
  // Multiplied by 750 credits/hr = 375 credits
  // Used: 375, Remaining: 625
  if (!credits1 || credits1.usedHours !== 375.0 || credits1.remainingHours !== 625.0) {
    throw new Error(`❌ Test Case 1 Failed: Expected usedHours = 375 and remainingHours = 625, but got usedHours = ${credits1?.usedHours} and remainingHours = ${credits1?.remainingHours}`);
  }
  console.log("✅ Test Case 1 Passed: 750 hourly rate and 1/2 hour min billing applied successfully!");

  // 3. Create a Category to test the credit categories linkage
  const bronzeCategory = await prisma.category.upsert({
    where: { name: "Bronze Package" },
    update: {},
    create: {
      name: "Bronze Package",
      slug: "bronze-package",
      credits: 15.0
    }
  });
  console.log("Created Category:", bronzeCategory);

  // Assign bronze package to customerNoDomains
  await prisma.customerCredits.update({
    where: { customerId: customerNoDomains.id },
    data: {
      creditCategoryId: bronzeCategory.id,
      allocatedHours: bronzeCategory.credits,
      remainingHours: Math.max(0, bronzeCategory.credits - credits1.usedHours),
      billableHours: Math.max(0, credits1.usedHours - bronzeCategory.credits)
    }
  });

  const updatedCredits = await prisma.customerCredits.findUnique({
    where: { customerId: customerNoDomains.id },
    include: { creditCategory: true }
  });
  console.log("Customer Credits with category:", updatedCredits);
  if (!updatedCredits || updatedCredits.creditCategoryId !== bronzeCategory.id || updatedCredits.creditCategory?.name !== "Bronze Package") {
    throw new Error("❌ Test Case 2 Failed: Credit category relationship was not set correctly");
  }
  console.log("✅ Test Case 2 Passed: Exclusive credit categories assigned correctly!");

  // Cleanup
  await prisma.ticket.deleteMany({
    where: { customerId: customerNoDomains.id }
  });
  await prisma.customerCredits.delete({
    where: { customerId: customerNoDomains.id }
  });
  await prisma.user.delete({
    where: { id: customerNoDomains.id }
  });
  await prisma.category.delete({
    where: { id: bronzeCategory.id }
  });

  console.log("\n🎉 ALL credit tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
