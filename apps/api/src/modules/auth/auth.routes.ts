import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  meHandler,
  logoutHandler,
  requestMagicLinkHandler,
  magicLoginHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
} from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Public routes
router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.post("/logout", logoutHandler);
router.post("/magic-link", requestMagicLinkHandler);
router.post("/magic-login", magicLoginHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

// Protected routes (requires a valid access token)
router.get("/me", requireAuth, meHandler);

export default router;
