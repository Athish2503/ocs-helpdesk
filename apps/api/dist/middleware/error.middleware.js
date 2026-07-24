import { ZodError } from "zod";
import multer from "multer";
/**
 * Centralised Express error-handling middleware.
 * Must be registered LAST (after all routes).
 *
 * Handles:
 *  - ZodError → 422 Unprocessable Entity with field-level details
 *  - MulterError → 400 Bad Request with clean file size/type validation details
 *  - AppError  → statusCode from the thrown error
 *  - Unknown   → 500 Internal Server Error
 */
export function errorHandler(err, _req, res, _next) {
    // ── Zod validation errors ────────────────────────────────────────────────
    if (err instanceof ZodError) {
        console.log("[ZodError] Validation failed details:", JSON.stringify(err.issues, null, 2));
        res.status(422).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Validation failed",
                details: err.issues.map((e) => ({
                    field: e.path.join("."),
                    message: e.message,
                })),
            },
        });
        return;
    }
    // ── Multer errors ────────────────────────────────────────────────────────
    if (err instanceof multer.MulterError) {
        let message = err.message;
        if (err.code === "LIMIT_FILE_SIZE") {
            message = "File too large. Maximum size allowed is 5MB.";
        }
        res.status(400).json({
            success: false,
            error: {
                code: "UPLOAD_ERROR",
                message,
            },
        });
        return;
    }
    // ── Application errors (with explicit statusCode) ─────────────────────
    if (err instanceof Error) {
        const status = err.statusCode ?? 500;
        const message = status === 500 ? "An unexpected error occurred. Please try again later." : err.message;
        if (status === 500) {
            console.error("[ERROR]", err);
        }
        res.status(status).json({
            success: false,
            error: {
                code: status === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
                message,
            },
        });
        return;
    }
    // ── Completely unknown throws ─────────────────────────────────────────
    console.error("[UNKNOWN ERROR]", err);
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred.",
        },
    });
}
