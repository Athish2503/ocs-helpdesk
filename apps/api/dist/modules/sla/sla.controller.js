import { createSlaPolicySchema, updateSlaPolicySchema } from "./sla.schemas.js";
import * as SlaService from "./sla.service.js";
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
export async function listSlaPoliciesHandler(req, res, next) {
    try {
        const policies = await SlaService.listSlaPolicies();
        ok(res, { policies });
    }
    catch (err) {
        next(err);
    }
}
export async function createSlaPolicyHandler(req, res, next) {
    try {
        const input = createSlaPolicySchema.parse(req.body);
        const policy = await SlaService.createSlaPolicy(input);
        ok(res, { policy }, 201);
    }
    catch (err) {
        next(err);
    }
}
export async function updateSlaPolicyHandler(req, res, next) {
    try {
        const id = req.params["id"];
        const input = updateSlaPolicySchema.parse(req.body);
        const policy = await SlaService.updateSlaPolicy(id, input);
        ok(res, { policy });
    }
    catch (err) {
        next(err);
    }
}
export async function deleteSlaPolicyHandler(req, res, next) {
    try {
        const id = req.params["id"];
        await SlaService.deleteSlaPolicy(id);
        ok(res, { message: "SLA policy deleted successfully." });
    }
    catch (err) {
        next(err);
    }
}
export async function toggleSlaPolicyHandler(req, res, next) {
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
