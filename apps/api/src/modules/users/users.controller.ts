import type { Request, Response, NextFunction } from "express";
import { updateUserSchema } from "./users.schemas.js";
import * as UsersService from "./users.service.js";

function ok(res: Response, data: unknown) {
  res.status(200).json({ success: true, data });
}

export async function listUsersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, role, isActive } = req.query;
    const users = await UsersService.listUsers({
      search: search as string,
      role: role as string,
      isActive: isActive as string,
    });
    ok(res, { users });
  } catch (err) {
    next(err);
  }
}

export async function getAgentsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const agents = await UsersService.getAgents();
    ok(res, { agents });
  } catch (err) {
    next(err);
  }
}

export async function getUserByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await UsersService.getUserById(id as string);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}

export async function updateUserHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateUserSchema.parse(req.body);
    const user = await UsersService.updateUser(id as string, input);
    ok(res, { user });
  } catch (err) {
    next(err);
  }
}
