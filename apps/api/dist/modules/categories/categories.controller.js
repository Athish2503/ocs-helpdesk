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
exports.getCategoriesHandler = getCategoriesHandler;
exports.createCategoryHandler = createCategoryHandler;
exports.updateCategoryHandler = updateCategoryHandler;
exports.deleteCategoryHandler = deleteCategoryHandler;
const categories_schemas_js_1 = require("./categories.schemas.js");
const CategoriesService = __importStar(require("./categories.service.js"));
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function getCategoriesHandler(req, res, next) {
    try {
        const isStaff = req.user?.role === "ADMIN" || req.user?.role === "AGENT";
        const all = req.query["all"] === "true";
        if (isStaff && all) {
            const categories = await CategoriesService.getAllCategories();
            ok(res, { categories });
        }
        else {
            const categories = await CategoriesService.getActiveCategories();
            ok(res, { categories });
        }
    }
    catch (err) {
        next(err);
    }
}
async function createCategoryHandler(req, res, next) {
    try {
        const input = categories_schemas_js_1.createCategorySchema.parse(req.body);
        const category = await CategoriesService.createCategory(input);
        ok(res, { category }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateCategoryHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = categories_schemas_js_1.updateCategorySchema.parse(req.body);
        const category = await CategoriesService.updateCategory(id, input);
        ok(res, { category });
    }
    catch (err) {
        next(err);
    }
}
async function deleteCategoryHandler(req, res, next) {
    try {
        const { id } = req.params;
        const { reassignToId } = req.body;
        await CategoriesService.deleteCategory(id, reassignToId);
        ok(res, { message: "Category deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
