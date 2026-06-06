// Load environment variables FIRST — before any other imports that may read process.env
import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env["PORT"] ?? 4000;

app.listen(PORT, () => {
  console.log(`✅  API running on http://localhost:${PORT}`);
});