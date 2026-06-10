import { Router } from "express";
import {
  createTicketHandler,
  listTicketsHandler,
  getTicketByIdHandler,
  addTicketMessageHandler,
  updateTicketHandler,
} from "./tickets.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router = Router();

// Apply requireAuth middleware globally to all ticket routes
router.use(requireAuth);

router.post("/", createTicketHandler);
router.get("/", listTicketsHandler);
router.get("/:id", getTicketByIdHandler);
router.post("/:id/messages", addTicketMessageHandler);
router.patch("/:id", updateTicketHandler);

export default router;
