import { createTeamSchema, updateTeamSchema } from "./teams.schemas.js";
import * as TeamsService from "./teams.service.js";
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
export async function listTeamsHandler(req, res, next) {
    try {
        const teams = await TeamsService.listTeams();
        ok(res, { teams });
    }
    catch (err) {
        next(err);
    }
}
export async function getTeamByIdHandler(req, res, next) {
    try {
        const { id } = req.params;
        const team = await TeamsService.getTeamById(id);
        ok(res, { team });
    }
    catch (err) {
        next(err);
    }
}
export async function createTeamHandler(req, res, next) {
    try {
        const input = createTeamSchema.parse(req.body);
        const team = await TeamsService.createTeam(input);
        ok(res, { team }, 201);
    }
    catch (err) {
        next(err);
    }
}
export async function updateTeamHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = updateTeamSchema.parse(req.body);
        const team = await TeamsService.updateTeam(id, input);
        ok(res, { team });
    }
    catch (err) {
        next(err);
    }
}
export async function deleteTeamHandler(req, res, next) {
    try {
        const { id } = req.params;
        await TeamsService.deleteTeam(id);
        ok(res, { message: "Team deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
