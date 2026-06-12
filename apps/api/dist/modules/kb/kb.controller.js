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
exports.listArticlesHandler = listArticlesHandler;
exports.getArticleByIdOrSlugHandler = getArticleByIdOrSlugHandler;
exports.createArticleHandler = createArticleHandler;
exports.updateArticleHandler = updateArticleHandler;
exports.deleteArticleHandler = deleteArticleHandler;
const kb_schemas_js_1 = require("./kb.schemas.js");
const KbService = __importStar(require("./kb.service.js"));
const abac_middleware_js_1 = require("../../middleware/abac.middleware.js");
function ok(res, data, statusCode = 200) {
    res.status(statusCode).json({ success: true, data });
}
async function listArticlesHandler(req, res, next) {
    try {
        const { search, categoryId, isInternal, isPublished } = req.query;
        const articles = await KbService.listArticles(req.user, {
            search: search,
            categoryId: categoryId,
            isInternal: isInternal,
            isPublished: isPublished,
        });
        ok(res, { articles });
    }
    catch (err) {
        next(err);
    }
}
async function getArticleByIdOrSlugHandler(req, res, next) {
    try {
        const { idOrSlug } = req.params;
        let article;
        const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isId) {
            article = await KbService.getArticleById(idOrSlug);
        }
        else {
            article = await KbService.getArticleBySlug(idOrSlug);
        }
        // ABAC Verification
        const allowed = await (0, abac_middleware_js_1.canAccessArticle)(req.user?.id, req.user?.role, article.id);
        if (!allowed) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Access denied to this article" },
            });
            return;
        }
        ok(res, { article });
    }
    catch (err) {
        next(err);
    }
}
async function createArticleHandler(req, res, next) {
    try {
        const input = kb_schemas_js_1.createArticleSchema.parse(req.body);
        const article = await KbService.createArticle(input, req.user.id);
        ok(res, { article }, 201);
    }
    catch (err) {
        next(err);
    }
}
async function updateArticleHandler(req, res, next) {
    try {
        const { id } = req.params;
        const input = kb_schemas_js_1.updateArticleSchema.parse(req.body);
        const article = await KbService.getArticleById(id);
        if (req.user.role !== "ADMIN" && article.authorId !== req.user.id) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Only the author or an admin can edit this article" },
            });
            return;
        }
        const updated = await KbService.updateArticle(id, input);
        ok(res, { article: updated });
    }
    catch (err) {
        next(err);
    }
}
async function deleteArticleHandler(req, res, next) {
    try {
        const { id } = req.params;
        const article = await KbService.getArticleById(id);
        if (req.user.role !== "ADMIN" && article.authorId !== req.user.id) {
            res.status(403).json({
                success: false,
                error: { code: "FORBIDDEN", message: "Only the author or an admin can delete this article" },
            });
            return;
        }
        await KbService.deleteArticle(id);
        ok(res, { message: "Article deleted successfully" });
    }
    catch (err) {
        next(err);
    }
}
