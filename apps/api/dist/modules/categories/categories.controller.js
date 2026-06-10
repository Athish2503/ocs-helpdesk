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
exports.getActiveCategoriesHandler = getActiveCategoriesHandler;
exports.createCategoryHandler = createCategoryHandler;
const categories_schemas_js_1 = require("./categories.schemas.js");
const CategoriesService = __importStar(require("./categories.service.js"));
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function getActiveCategoriesHandler(req, res, next) {
    try {
        const categories = await CategoriesService.getActiveCategories();
        ok(res, { categories });
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
