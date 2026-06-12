"use strict";
/**
 * SEO Helper Utilities
 * Provides functions for generating SEO metadata, structured data, and sitemaps
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateMetaTags = generateMetaTags;
exports.generateStructuredData = generateStructuredData;
exports.generateSitemap = generateSitemap;
exports.sanitizeMetaContent = sanitizeMetaContent;
exports.extractKeywords = extractKeywords;
exports.generateRobotsTxt = generateRobotsTxt;
exports.validateSEOMetadata = validateSEOMetadata;
/**
 * Generate meta tags for an article
 */
function generateMetaTags(article) {
    const baseUrl = process.env["PUBLIC_KB_BASE_URL"] || "https://yourdomain.com/kb/p";
    const canonicalUrl = article.canonical_url || `${baseUrl}/${article.slug}`;
    const authorName = article.author_name || article.author?.name || "System";
    // Extract plain text from HTML content for description
    const plainText = article.content
        ? article.content.replace(/<[^>]*>/g, "").substring(0, 160)
        : "";
    return {
        title: article.meta_title || article.title,
        description: article.meta_description || plainText,
        keywords: article.keywords || extractKeywords(article.content).join(", "),
        canonical: canonicalUrl,
        ogTitle: article.meta_title || article.title,
        ogDescription: article.meta_description || plainText,
        ogImage: article.og_image || `${baseUrl}/default-og-image.png`,
        ogUrl: canonicalUrl,
        ogType: "article",
        twitterCard: "summary_large_image",
        twitterTitle: article.meta_title || article.title,
        twitterDescription: article.meta_description || plainText,
        twitterImage: article.og_image || `${baseUrl}/default-og-image.png`,
        author: authorName,
        publishedTime: article.created_at,
        modifiedTime: article.updated_at,
    };
}
/**
 * Generate JSON-LD structured data for an article
 */
function generateStructuredData(article) {
    const baseUrl = process.env["PUBLIC_KB_BASE_URL"] || "https://yourdomain.com/kb/p";
    const canonicalUrl = article.canonical_url || `${baseUrl}/${article.slug}`;
    const authorName = article.author_name || article.author?.name || "System";
    const categoryName = article.category_name || article.category?.name || "General";
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": article.title,
        "description": article.meta_description || article.content?.replace(/<[^>]*>/g, "").substring(0, 160),
        "image": article.og_image || `${baseUrl}/default-og-image.png`,
        "author": {
            "@type": "Person",
            "name": authorName,
        },
        "publisher": {
            "@type": "Organization",
            "name": process.env["COMPANY_NAME"] || "Your Company",
            "logo": {
                "@type": "ImageObject",
                "url": `${baseUrl}/logo.png`,
            },
        },
        "datePublished": article.created_at,
        "dateModified": article.updated_at,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonicalUrl,
        },
        "keywords": article.keywords || extractKeywords(article.content).join(", "),
        "articleSection": categoryName,
        "wordCount": article.content ? article.content.split(/\s+/).length : 0,
    };
}
/**
 * Generate XML sitemap for public articles
 */
function generateSitemap(articles) {
    const baseUrl = process.env["PUBLIC_KB_BASE_URL"] || "https://yourdomain.com/kb/p";
    const urls = articles
        .map((article) => {
        const url = article.canonical_url || `${baseUrl}/${article.slug}`;
        const lastmod = article.updated_at || article.created_at;
        const priority = article.isPublished ? "0.8" : "0.5";
        return `
    <url>
        <loc>${escapeXml(url)}</loc>
        <lastmod>${new Date(lastmod).toISOString().split("T")[0]}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>${priority}</priority>
    </url>`;
    })
        .join("");
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
/**
 * Sanitize meta content (remove HTML, limit length)
 */
function sanitizeMetaContent(content, maxLength = 160) {
    if (!content || typeof content !== "string") {
        return "";
    }
    // Remove HTML tags
    let sanitized = content.replace(/<[^>]*>/g, "");
    // Remove extra whitespace
    sanitized = sanitized.replace(/\s+/g, " ").trim();
    // Truncate to max length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength - 3) + "...";
    }
    // Escape special characters
    sanitized = sanitized
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    return sanitized;
}
/**
 * Extract keywords from content
 */
function extractKeywords(content, maxKeywords = 10) {
    if (!content || typeof content !== "string") {
        return [];
    }
    // Remove HTML tags
    const plainText = content.replace(/<[^>]*>/g, " ");
    // Common stop words to exclude
    const stopWords = new Set([
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "is", "was", "are", "were", "been", "be", "have", "has",
        "had", "do", "does", "did", "will", "would", "should", "could", "may",
        "might", "must", "can", "this", "that", "these", "those", "i", "you",
        "he", "she", "it", "we", "they", "what", "which", "who", "when", "where",
        "why", "how", "all", "each", "every", "both", "few", "more", "most",
        "other", "some", "such", "no", "nor", "not", "only", "own", "same",
        "so", "than", "too", "very", "just", "now",
    ]);
    // Extract words
    const words = plainText
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 3 && !stopWords.has(word));
    // Count word frequency
    const frequency = {};
    words.forEach((word) => {
        frequency[word] = (frequency[word] || 0) + 1;
    });
    // Sort by frequency and get top keywords
    const keywords = Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxKeywords)
        .map(([word]) => word);
    return keywords;
}
/**
 * Escape XML special characters
 */
function escapeXml(str) {
    if (!str || typeof str !== "string") {
        return "";
    }
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}
/**
 * Generate robots.txt content
 */
function generateRobotsTxt() {
    const baseUrl = process.env["PUBLIC_KB_BASE_URL"] || "https://yourdomain.com";
    return `User-agent: *
Allow: /kb/public/
Disallow: /kb/articles/
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/kb/public/sitemap.xml
`;
}
/**
 * Validate SEO metadata
 */
function validateSEOMetadata(seoData) {
    const errors = [];
    // Meta title validation
    if (seoData.meta_title) {
        if (seoData.meta_title.length > 60) {
            errors.push("Meta title should be 60 characters or less");
        }
        if (seoData.meta_title.length < 10) {
            errors.push("Meta title should be at least 10 characters");
        }
    }
    // Meta description validation
    if (seoData.meta_description) {
        if (seoData.meta_description.length > 160) {
            errors.push("Meta description should be 160 characters or less");
        }
        if (seoData.meta_description.length < 50) {
            errors.push("Meta description should be at least 50 characters");
        }
    }
    // Keywords validation
    if (seoData.keywords) {
        const keywordArray = seoData.keywords.split(",").map((k) => k.trim());
        if (keywordArray.length > 10) {
            errors.push("Maximum 10 keywords recommended");
        }
    }
    // OG image validation
    if (seoData.og_image) {
        const validExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        const hasValidExt = validExtensions.some((ext) => seoData.og_image.toLowerCase().endsWith(ext));
        if (!hasValidExt && !seoData.og_image.startsWith("http")) {
            errors.push("OG image should be a valid image URL");
        }
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
