import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

interface AppError extends Error {
  statusCode?: number;
}

/**
 * Centralised Express error-handling middleware.
 * Must be registered LAST (after all routes).
 *
 * Handles:
 *  - ZodError → 422 Unprocessable Entity with field-level details
 *  - AppError  → statusCode from the thrown error
 *  - Unknown   → 500 Internal Server Error
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── Zod validation errors ────────────────────────────────────────────────
  if (err instanceof ZodError) {
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

  // ── Application errors (with explicit statusCode) ─────────────────────
  if (err instanceof Error) {
    const status = (err as AppError).statusCode ?? 500;
    const message =
      status === 500 ? "An unexpected error occurred. Please try again later." : err.message;

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
