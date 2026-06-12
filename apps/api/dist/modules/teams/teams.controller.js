"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTeamsHandler = listTeamsHandler;
exports.getTeamByIdHandler = getTeamByIdHandler;
exports.createTeamHandler = createTeamHandler;
exports.updateTeamHandler = updateTeamHandler;
exports.deleteTeamHandler = deleteTeamHandler;
const teams_schemas_js_1 = require("./teams.schemas.js");
const TeamsService = __importStar(require("./teams.service.js"));
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function listTeamsHandler(req, res, next) {
    try {
        const teams = await TeamsService.listTeams();
        ok(res, { teams });
    }
    catch (err) {
        next(err);
    }
}
async function getTeamByIdHandler(req, res, next) {
    try {
        const { id } = req.params;
        const team = await TeamsService.getTeamById(id);
        ok(res, { team });
    }
    catch (err) {
        next(err);
    }
}
async function createTeamHandler(req, res, next) {
    try {
        const input = teams_schemas_js_1.createTeamSchema.parse(req.body);
        const team = await TeamsService.createTeam(input);
        ok(res, { team }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateTeamHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = teams_schemas_js_1.updateTeamSchema.parse(req.body);
        const team = await TeamsService.updateTeam(id, input);
        ok(res, { team });
    }
    catch (err) {
        next(err);
    }
}
async function deleteTeamHandler(req, res, next) {
    try {
        const { id } = req.params;
        await TeamsService.deleteTeam(id);
        ok(res, { message: "Team deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
