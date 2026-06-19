"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tickets_controller_js_1 = require("./tickets.controller.js");
const auth_middleware_js_1 = require("../../middleware/auth.middleware.js");
const uploadMiddleware_js_1 = require("../../middleware/uploadMiddleware.js");
const router = (0, express_1.Router)();
// Apply requireAuth middleware globally to all ticket routes
router.use(auth_middleware_js_1.requireAuth);
router.post("/", tickets_controller_js_1.createTicketHandler);
router.get("/", tickets_controller_js_1.listTicketsHandler);
router.get("/:id", tickets_controller_js_1.getTicketByIdHandler);
router.post("/:id/messages", tickets_controller_js_1.addTicketMessageHandler);
router.patch("/:id", tickets_controller_js_1.updateTicketHandler);
router.post("/:id/attachments", uploadMiddleware_js_1.uploadKBImage.single("file"), tickets_controller_js_1.uploadTicketAttachmentHandler);
exports.default = router;
