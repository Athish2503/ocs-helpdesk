import type { Request, Response, NextFunction } from "express";
import { createTeamSchema, updateTeamSchema } from "./teams.schemas.js";
import * as TeamsService from "./teams.service.js";

function ok(res: Response, data: unknown, statusCode = 200) {
  res.status(statusCode).json({ success: true, data });
}

export async function listTeamsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const teams = await TeamsService.listTeams();
    ok(res, { teams });
  } catch (err) {
    next(err);
  }
}

export async function getTeamByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const team = await TeamsService.getTeamById(id as string);
    ok(res, { team });
  } catch (err) {
    next(err);
  }
}

export async function createTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createTeamSchema.parse(req.body);
    const team = await TeamsService.createTeam(input);
    ok(res, { team }, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const input = updateTeamSchema.parse(req.body);
    const team = await TeamsService.updateTeam(id as string, input);
    ok(res, { team });
  } catch (err) {
    next(err);
  }
}

export async function deleteTeamHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await TeamsService.deleteTeam(id as string);
    ok(res, { message: "Team deleted successfully" });
  } catch (err) {
    next(err);
  }
}
