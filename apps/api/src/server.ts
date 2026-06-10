// Load environment variables FIRST — before any other imports that may read process.env
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { seedDefaultCategories } from "./utils/seed.js";

const PORT = process.env["PORT"] ?? 4000;

async function startServer() {
  try {
    // Seed default categories
    await seedDefaultCategories();
  } catch (err) {
    console.error("❌ Database seeding failed:", err);
  }

  app.listen(PORT, () => {
    console.log(`✅  API running on http://localhost:${PORT}`);
  });
}

startServer();