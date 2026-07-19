import type { Request, Response, NextFunction } from "express";
import { createSlaPolicySchema, updateSlaPolicySchema } from "./sla.schemas.js";
import * as SlaService from "./sla.service.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function listSlaPoliciesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const policies = await SlaService.listSlaPolicies();
    ok(res, { policies });
  } catch (err) {
    next(err);
  }
}

export async function createSlaPolicyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSlaPolicySchema.parse(req.body);
    const policy = await SlaService.createSlaPolicy(input);
    ok(res, { policy }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateSlaPolicyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const input = updateSlaPolicySchema.parse(req.body);
    const policy = await SlaService.updateSlaPolicy(id, input);
    ok(res, { policy });
  } catch (err) {
    next(err);
  }
}

export async function deleteSlaPolicyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    await SlaService.deleteSlaPolicy(id);
    ok(res, { message: "SLA policy deleted successfully." });
  } catch (err) {
    next(err);
  }
}

export async function toggleSlaPolicyHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params["id"] as string;
    const { isActive } = req.body as { isActive: boolean };
    if (typeof isActive !== "boolean") {
      res.status(400).json({ success: false, error: { message: "isActive must be a boolean." } });
      return;
    }
    const policy = await SlaService.toggleSlaPolicy(id, isActive);
    ok(res, { policy });
  } catch (err) {
    next(err);
  }
}
