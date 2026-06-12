import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/prisma.js";
import {
  generateCSPHeader,
  isSuspiciousRequest,
  validateSlugFormat,
  whitelistResponseFields,
  hashIP,
  isBot,
} from "../utils/securityHelper.js";

/**
 * Public Security Middleware
 * Comprehensive security middleware for public KB routes
 */

/**
 * Allowed response fields for public articles
 */
export const ALLOWED_PUBLIC_FIELDS = [
  "id",
  "title",
  "slug",
  "content",
  "category_name",
  "author_name",
  "created_at",
  "updated_at",
  "tags",
  "meta_title",
  "meta_description",
  "keywords",
  "total_reads",
  "unique_reads",
  "og_image",
  "canonical_url",
];

/**
 * Set security headers
 */
export function setSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Content Security Policy
  res.set("Content-Security-Policy", generateCSPHeader());

  // Prevent clickjacking
  res.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  res.set("X-Content-Type-Options", "nosniff");

  // XSS Protection
  res.set("X-XSS-Protection", "1; mode=block");

  // Referrer Policy
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove server identification
  res.removeHeader("X-Powered-By");

  // Strict Transport Security (HTTPS only)
  if (req.secure) {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

/**
 * CORS middleware for public endpoints
 */
export function configureCORS(req: Request, res: Response, next: NextFunction): void {
  const allowedOrigins = process.env["ALLOWED_ORIGINS"]?.split(",") || [];
  const origin = req.get("origin");

  // Allow requests without origin (direct browser access)
  if (!origin) {
    return next();
  }

  // Check if origin is allowed
  if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "86400"); // 24 hours
  }

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
}

/**
 * Validate slug parameter
 */
export function validateSlug(req: Request, res: Response, next: NextFunction): void {
  const slug = req.params["slug"];

  if (!slug) {
    res.status(400).json({
      error: "Bad Request",
      message: "Article slug is required",
    });
    return;
  }

  if (!validateSlugFormat(slug)) {
    // Log suspicious activity
    logSecurityEvent(
      "SUSPICIOUS_PATTERN",
      "MEDIUM",
      req.ip || "",
      req.get("user-agent") || "",
      req.path,
      "Invalid slug format"
    ).catch((err) => console.error("Failed to log security event:", err));

    res.status(400).json({
      error: "Bad Request",
      message: "Invalid article slug format",
    });
    return;
  }

  next();
}

/**
 * Detect and log suspicious requests
 */
export function detectSuspiciousActivity(req: Request, res: Response, next: NextFunction): void {
  const suspicion = isSuspiciousRequest(req);

  if (suspicion.isSuspicious) {
    // Log security event
    logSecurityEvent(
      suspicion.reasons.some((r) => r.includes("SQL"))
        ? "SQL_INJECTION_ATTEMPT"
        : suspicion.reasons.some((r) => r.includes("XSS"))
          ? "XSS_ATTEMPT"
          : "SUSPICIOUS_PATTERN",
      "HIGH",
      req.ip || "",
      req.get("user-agent") || "",
      req.path,
      suspicion.reasons.join("; ")
    ).catch((err) => console.error("Failed to log security event:", err));

    res.status(400).json({
      error: "Bad Request",
      message: "Invalid request parameters",
    });
    return;
  }

  next();
}

/**
 * Sanitize response data (whitelist fields)
 */
export function sanitizeResponse(data: any) {
  if (Array.isArray(data)) {
    return data.map((item) => whitelistResponseFields(item, ALLOWED_PUBLIC_FIELDS));
  }

  return whitelistResponseFields(data, ALLOWED_PUBLIC_FIELDS);
}

/**
 * Log access to public articles
 */
export function logPublicAccess(req: Request, res: Response, next: NextFunction): void {
  const ipAddress = req.ip || req.socket.remoteAddress || "";
  const userAgent = req.get("user-agent") || "";
  const articleSlug = (req.params["slug"] as string) || null;

  // Don't block the request, log asynchronously
  setImmediate(async () => {
    try {
      await prisma.knowledgeBaseArticleAccessLog.create({
        data: {
          articleSlug,
          ipAddress,
          ipHash: hashIP(ipAddress),
          userAgent,
          requestMethod: req.method,
          requestPath: req.path,
          queryParams: JSON.stringify(req.query),
          isBot: isBot(userAgent),
        },
      });
    } catch (error) {
      console.error("Failed to log public access:", error);
    }
  });

  next();
}

/**
 * Error handler for public routes (sanitize error messages)
 */
export function publicErrorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  // Log the actual error server-side
  console.error("Public route error:", err);

  const status = err.status || 500;

  // Log security event for 500 errors
  if (status >= 500) {
    logSecurityEvent(
      "ANOMALY_DETECTED",
      "MEDIUM",
      req.ip || "",
      req.get("user-agent") || "",
      req.path,
      "Internal server error on public endpoint"
    ).catch((e) => console.error("Failed to log security event:", e));
  }

  // Send sanitized error to client (no stack traces or internal details)
  const message =
    status === 500
      ? "An error occurred while processing your request"
      : err.message || "Bad Request";

  res.status(status).json({
    error: status === 500 ? "Internal Server Error" : "Error",
    message: message,
  });
}

/**
 * Log security event to database
 */
async function logSecurityEvent(
  eventType: string,
  severity: string,
  ipAddress: string,
  userAgent: string,
  requestPath: string,
  description: string
): Promise<void> {
  try {
    await prisma.knowledgeBaseSecurityEvent.create({
      data: {
        eventType,
        severity,
        ipAddress,
        userAgent,
        requestPath,
        description,
      },
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}

/**
 * Combine all public security middleware
 */
export function publicSecurityMiddleware() {
  return [setSecurityHeaders, configureCORS, detectSuspiciousActivity];
}
