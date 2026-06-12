"use client";

import { useEffect } from "react";

interface SEOMetaTagsProps {
  title: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  author?: string;
  structuredData?: any;
}

export default function SEOMetaTags({
  title,
  description,
  keywords,
  canonicalUrl,
  ogImage,
  author,
  structuredData,
}: SEOMetaTagsProps) {
  useEffect(() => {
    document.title = title;

    const setMetaTag = (nameOrProperty: string, content: string, isProperty = false) => {
      if (!content) return;
      const selector = isProperty ? `meta[property="${nameOrProperty}"]` : `meta[name="${nameOrProperty}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement("meta");
        if (isProperty) {
          element.setAttribute("property", nameOrProperty);
        } else {
          element.setAttribute("name", nameOrProperty);
        }
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    setMetaTag("description", description || "");
    setMetaTag("keywords", keywords || "");
    setMetaTag("author", author || "Helpdesk");
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description || "", true);
    setMetaTag("og:image", ogImage || "", true);

    if (canonicalUrl) {
      let linkElement = document.querySelector('link[rel="canonical"]');
      if (!linkElement) {
        linkElement = document.createElement("link");
        linkElement.setAttribute("rel", "canonical");
        document.head.appendChild(linkElement);
      }
      linkElement.setAttribute("href", canonicalUrl);
    }

    if (structuredData) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]#kb-jsonld');
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.setAttribute("type", "application/ld+json");
        scriptElement.setAttribute("id", "kb-jsonld");
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(structuredData);
    }

    return () => {
      const scriptElement = document.querySelector('script[type="application/ld+json"]#kb-jsonld');
      if (scriptElement) {
        scriptElement.remove();
      }
    };
  }, [title, description, keywords, canonicalUrl, ogImage, author, structuredData]);

  return null;
}
