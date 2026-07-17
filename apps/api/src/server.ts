// Load environment variables FIRST — before any other imports that may read process.env
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { seedInitialData } from "./utils/seed.js";
import { startQueueScheduler } from "./services/crm-queue.service.js";

const PORT = process.env["PORT"] ?? 4000;

async function startServer() {
  try {
    // Seed initial admin data
    await seedInitialData();
  } catch (err) {
    console.error("❌ Database seeding failed:", err);
  }

  // Start background CRM event queue scheduler
  startQueueScheduler();

  app.listen(PORT, () => {
    console.log(`✅  API running on http://localhost:${PORT}`);
  });
}

startServer(); // Trigger watch reload for env changes.