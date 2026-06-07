"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables FIRST — before any other imports that may read process.env
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_js_1 = __importDefault(require("./app.js"));
const PORT = process.env["PORT"] ?? 4000;
app_js_1.default.listen(PORT, () => {
    console.log(`✅  API running on http://localhost:${PORT}`);
});
