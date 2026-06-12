"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALLOWED_PUBLIC_FIELDS = void 0;
exports.setSecurityHeaders = setSecurityHeaders;
exports.configureCORS = configureCORS;
exports.validateSlug = validateSlug;
exports.detectSuspiciousActivity = detectSuspiciousActivity;
exports.sanitizeResponse = sanitizeResponse;
exports.logPublicAccess = logPublicAccess;
exports.publicErrorHandler = publicErrorHandler;
exports.publicSecurityMiddleware = publicSecurityMiddleware;
const prisma_js_1 = require("../config/prisma.js");
const securityHelper_js_1 = require("../utils/securityHelper.js");
/**
 * Public Security Middleware
 * Comprehensive security middleware for public KB routes
 */
/**
 * Allowed response fields for public articles
 */
exports.ALLOWED_PUBLIC_FIELDS = [
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
function setSecurityHeaders(req, res, next) {
    // Content Security Policy
    res.set("Content-Security-Policy", (0, securityHelper_js_1.generateCSPHeader)());
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
function configureCORS(req, res, next) {
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
function validateSlug(req, res, next) {
    const slug = req.params["slug"];
    if (!slug) {
        res.status(400).json({
            error: "Bad Request",
            message: "Article slug is required",
        });
        return;
    }
    if (!(0, securityHelper_js_1.validateSlugFormat)(slug)) {
        // Log suspicious activity
        logSecurityEvent("SUSPICIOUS_PATTERN", "MEDIUM", req.ip || "", req.get("user-agent") || "", req.path, "Invalid slug format").catch((err) => console.error("Failed to log security event:", err));
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
function detectSuspiciousActivity(req, res, next) {
    const suspicion = (0, securityHelper_js_1.isSuspiciousRequest)(req);
    if (suspicion.isSuspicious) {
        // Log security event
        logSecurityEvent(suspicion.reasons.some((r) => r.includes("SQL"))
            ? "SQL_INJECTION_ATTEMPT"
            : suspicion.reasons.some((r) => r.includes("XSS"))
                ? "XSS_ATTEMPT"
                : "SUSPICIOUS_PATTERN", "HIGH", req.ip || "", req.get("user-agent") || "", req.path, suspicion.reasons.join("; ")).catch((err) => console.error("Failed to log security event:", err));
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
function sanitizeResponse(data) {
    if (Array.isArray(data)) {
        return data.map((item) => (0, securityHelper_js_1.whitelistResponseFields)(item, exports.ALLOWED_PUBLIC_FIELDS));
    }
    return (0, securityHelper_js_1.whitelistResponseFields)(data, exports.ALLOWED_PUBLIC_FIELDS);
}
/**
 * Log access to public articles
 */
function logPublicAccess(req, res, next) {
    const ipAddress = req.ip || req.socket.remoteAddress || "";
    const userAgent = req.get("user-agent") || "";
    const articleSlug = req.params["slug"] || null;
    // Don't block the request, log asynchronously
    setImmediate(async () => {
        try {
            await prisma_js_1.prisma.knowledgeBaseArticleAccessLog.create({
                data: {
                    articleSlug,
                    ipAddress,
                    ipHash: (0, securityHelper_js_1.hashIP)(ipAddress),
                    userAgent,
                    requestMethod: req.method,
                    requestPath: req.path,
                    queryParams: JSON.stringify(req.query),
                    isBot: (0, securityHelper_js_1.isBot)(userAgent),
                },
            });
        }
        catch (error) {
            console.error("Failed to log public access:", error);
        }
    });
    next();
}
/**
 * Error handler for public routes (sanitize error messages)
 */
function publicErrorHandler(err, req, res, next) {
    // Log the actual error server-side
    console.error("Public route error:", err);
    const status = err.status || 500;
    // Log security event for 500 errors
    if (status >= 500) {
        logSecurityEvent("ANOMALY_DETECTED", "MEDIUM", req.ip || "", req.get("user-agent") || "", req.path, "Internal server error on public endpoint").catch((e) => console.error("Failed to log security event:", e));
    }
    // Send sanitized error to client (no stack traces or internal details)
    const message = status === 500
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
async function logSecurityEvent(eventType, severity, ipAddress, userAgent, requestPath, description) {
    try {
        await prisma_js_1.prisma.knowledgeBaseSecurityEvent.create({
            data: {
                eventType,
                severity,
                ipAddress,
                userAgent,
                requestPath,
                description,
            },
        });
    }
    catch (error) {
        console.error("Failed to log security event:", error);
    }
}
/**
 * Combine all public security middleware
 */
function publicSecurityMiddleware() {
    return [setSecurityHeaders, configureCORS, detectSuspiciousActivity];
}
