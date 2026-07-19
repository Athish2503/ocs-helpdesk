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
exports.listSlaPoliciesHandler = listSlaPoliciesHandler;
exports.createSlaPolicyHandler = createSlaPolicyHandler;
exports.updateSlaPolicyHandler = updateSlaPolicyHandler;
exports.deleteSlaPolicyHandler = deleteSlaPolicyHandler;
exports.toggleSlaPolicyHandler = toggleSlaPolicyHandler;
const sla_schemas_js_1 = require("./sla.schemas.js");
const SlaService = __importStar(require("./sla.service.js"));
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function listSlaPoliciesHandler(req, res, next) {
    try {
        const policies = await SlaService.listSlaPolicies();
        ok(res, { policies });
    }
    catch (err) {
        next(err);
    }
}
async function createSlaPolicyHandler(req, res, next) {
    try {
        const input = sla_schemas_js_1.createSlaPolicySchema.parse(req.body);
        const policy = await SlaService.createSlaPolicy(input);
        ok(res, { policy }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateSlaPolicyHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const input = sla_schemas_js_1.updateSlaPolicySchema.parse(req.body);
        const policy = await SlaService.updateSlaPolicy(id, input);
        ok(res, { policy });
    }
    catch (err) {
        next(err);
    }
}
async function deleteSlaPolicyHandler(req, res, next) {
    try {
        const id = req.params["id"];
        await SlaService.deleteSlaPolicy(id);
        ok(res, { message: "SLA policy deleted successfully." });
    }
    catch (err) {
        next(err);
    }
}
async function toggleSlaPolicyHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") {
            res.status(400).json({ success: false, error: { message: "isActive must be a boolean." } });
            return;
        }
        const policy = await SlaService.toggleSlaPolicy(id, isActive);
        ok(res, { policy });
    }
    catch (err) {
        next(err);
    }
}
