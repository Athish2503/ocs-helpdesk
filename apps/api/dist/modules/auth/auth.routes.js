"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("./auth.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", auth_controller_js_1.registerHandler);
router.post("/login", auth_controller_js_1.loginHandler);
router.post("/refresh", auth_controller_js_1.refreshHandler);
router.post("/logout", auth_controller_js_1.logoutHandler);
router.post("/magic-link", auth_controller_js_1.requestMagicLinkHandler);
router.post("/magic-login", auth_controller_js_1.magicLoginHandler);
router.post("/forgot-password", auth_controller_js_1.forgotPasswordHandler);
router.post("/reset-password", auth_controller_js_1.resetPasswordHandler);
// Protected routes (requires a valid access token)
router.get("/me", auth_middleware_js_1.requireAuth, auth_controller_js_1.meHandler);
exports.default = router;
