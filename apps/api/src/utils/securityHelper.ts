import crypto from "crypto";
import type { Request } from "express";

/**
 * Security Helper Utilities
 * Provides security functions for input validation, sanitization, and threat detection
 */

/**
 * Sanitize and validate article slug
 */
export function sanitizeSlug(slug: unknown): string {
  if (!slug || typeof slug !== "string") {
    return "";
  }

  // Convert to lowercase, replace spaces with hyphens, remove special chars
  return slug
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 255);
}

/**
 * Validate slug format
 */
export function validateSlugFormat(slug: unknown): boolean {
  if (!slug || typeof slug !== "string") {
    return false;
  }

  const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  const MAX_SLUG_LENGTH = 255;

  return SLUG_PATTERN.test(slug) && slug.length <= MAX_SLUG_LENGTH;
}

/**
 * Sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHTML(content: unknown): string {
  if (!content || typeof content !== "string") {
    return "";
  }

  // Remove potentially dangerous tags and attributes
  const dangerous = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^*]*>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers
    /javascript:/gi,
    /data:text\/html/gi,
  ];

  let sanitized = content;
  dangerous.forEach((pattern) => {
    sanitized = sanitized.replace(pattern, "");
  });

  return sanitized;
}

/**
 * Detect potential SQL injection attempts
 */
export function detectSQLInjection(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bEXEC\b|\bEXECUTE\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
    /(';|";)/,
    /(\bxp_\w+)/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Detect potential XSS attempts
 */
export function detectXSS(input: string): boolean {
  if (!input || typeof input !== "string") {
    return false;
  }

  const xssPatterns = [
    /<script\b/i,
    /<iframe\b/i,
    /<object\b/i,
    /<embed\b/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<img[^>]+src\s*=\s*["']?javascript:/i,
    /data:text\/html/i,
    /<svg\b.*onload/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

/**
 * Generate Content Security Policy header
 */
export function generateCSPHeader(): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'"], // TODO: Remove unsafe-inline in production
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": ["'self'"],
    "font-src": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'self'"],
    "frame-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Whitelist response fields (remove sensitive data)
 */
export function whitelistResponseFields(data: Record<string, any>, allowedFields: string[]): Record<string, any> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const filtered: Record<string, any> = {};
  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      filtered[field] = data[field];
    }
  });

  return filtered;
}

/**
 * Hash IP address for privacy-compliant logging
 */
export function hashIP(ipAddress: string, salt: string | null = null): string {
  if (!ipAddress) {
    return "";
  }

  // Use daily rotating salt if not provided
  const dailySalt = salt || new Date().toISOString().split("T")[0];

  return crypto
    .createHash("sha256")
    .update(ipAddress + dailySalt)
    .digest("hex");
}

/**
 * Detect if user agent is a bot
 */
export function isBot(userAgent: string | undefined): boolean {
  if (!userAgent || typeof userAgent !== "string") {
    return false;
  }

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /http/i,
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /whatsapp/i,
    /telegrambot/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Detect suspicious request patterns
 */
export function isSuspiciousRequest(req: Request): { isSuspicious: boolean; reasons: string[] } {
  const checks: string[] = [];

  // Check for SQL injection in query params
  if (req.query) {
    Object.values(req.query).forEach((value) => {
      if (typeof value === "string" && detectSQLInjection(value)) {
        checks.push("SQL injection attempt in query params");
      }
    });
  }

  // Check for XSS in query params
  if (req.query) {
    Object.values(req.query).forEach((value) => {
      if (typeof value === "string" && detectXSS(value)) {
        checks.push("XSS attempt in query params");
      }
    });
  }

  // Check for path traversal
  if (req.path && (req.path.includes("../") || req.path.includes("..\\") || req.path.includes("%2e%2e"))) {
    checks.push("Path traversal attempt");
  }

  // Check for missing or suspicious user agent
  const ua = req.get("user-agent");
  if (!ua || ua.length < 10) {
    checks.push("Missing or suspicious user agent");
  }

  // Check for unusual request methods on public endpoints
  if (req.path.includes("/kb/public/") && !["GET", "POST"].includes(req.method)) {
    checks.push("Unusual HTTP method on public endpoint");
  }

  return {
    isSuspicious: checks.length > 0,
    reasons: checks,
  };
}

/**
 * Generate anonymous session fingerprint
 */
export function generateFingerprint(req: Request): string {
  const components = [
    req.get("user-agent") || "",
    req.get("accept-language") || "",
    req.get("accept-encoding") || "",
    req.ip || "",
  ];

  return crypto
    .createHash("sha256")
    .update(components.join("|"))
    .digest("hex");
}
