import multer from "multer";
import path from "path";
import fs from "fs";
// @ts-ignore
import sharp from "sharp";
import type { Request } from "express";

// Upload configuration
export const UPLOAD_CONFIG = {
  KB_IMAGES: {
    destination: "./uploads/kb/images",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  },
};

// Ensure upload directory exists
const ensureUploadDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = UPLOAD_CONFIG.KB_IMAGES.destination;
    ensureUploadDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `kb-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter for validation
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = UPLOAD_CONFIG.KB_IMAGES.allowedMimeTypes;
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = UPLOAD_CONFIG.KB_IMAGES.allowedExtensions;

  if (allowedTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${allowedExts.join(", ")} files are allowed.`) as any, false);
  }
};

// Multer upload middleware
export const uploadKBImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: UPLOAD_CONFIG.KB_IMAGES.maxFileSize,
  },
});

/**
 * Get image dimensions using sharp
 */
export async function getImageDimensions(filePath: string): Promise<{ width: number | null; height: number | null }> {
  try {
    const metadata = await sharp(filePath).metadata();
    return {
      width: metadata.width || null,
      height: metadata.height || null,
    };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return { width: null, height: null };
  }
}

/**
 * Delete uploaded file
 */
export function deleteUploadedFile(filePath: string): boolean {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}
