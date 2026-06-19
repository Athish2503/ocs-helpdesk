"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadKBImage = exports.UPLOAD_CONFIG = void 0;
exports.getImageDimensions = getImageDimensions;
exports.deleteUploadedFile = deleteUploadedFile;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// @ts-ignore
const sharp_1 = __importDefault(require("sharp"));
// Upload configuration
exports.UPLOAD_CONFIG = {
    KB_IMAGES: {
        destination: "./uploads/kb/images",
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
};
// Ensure upload directory exists
const ensureUploadDir = (dir) => {
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
};
// Multer storage configuration
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = exports.UPLOAD_CONFIG.KB_IMAGES.destination;
        ensureUploadDir(uploadPath);
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname).toLowerCase();
        const filename = `kb-${uniqueSuffix}${ext}`;
        cb(null, filename);
    },
});
// File filter for validation
const fileFilter = (req, file, cb) => {
    const allowedTypes = exports.UPLOAD_CONFIG.KB_IMAGES.allowedMimeTypes;
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const allowedExts = exports.UPLOAD_CONFIG.KB_IMAGES.allowedExtensions;
    if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
        cb(null, true);
    }
    else {
        const err = new Error(`Invalid file type. Only ${allowedExts.join(", ")} files are allowed.`);
        err.statusCode = 400;
        cb(err, false);
    }
};
// Multer upload middleware
exports.uploadKBImage = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: exports.UPLOAD_CONFIG.KB_IMAGES.maxFileSize,
    },
});
/**
 * Get image dimensions using sharp
 */
async function getImageDimensions(filePath) {
    try {
        const metadata = await (0, sharp_1.default)(filePath).metadata();
        return {
            width: metadata.width || null,
            height: metadata.height || null,
        };
    }
    catch (error) {
        console.error("Error getting image dimensions:", error);
        return { width: null, height: null };
    }
}
/**
 * Delete uploaded file
 */
function deleteUploadedFile(filePath) {
    try {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
            return true;
        }
        return false;
    }
    catch (error) {
        console.error("Error deleting file:", error);
        return false;
    }
}
