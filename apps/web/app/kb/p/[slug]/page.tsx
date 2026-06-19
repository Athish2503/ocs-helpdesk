"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Printer,
  Share2,
  Calendar,
  User as UserIcon,
  Tag as TagIcon,
  ChevronLeft,
  BookOpen,
  Copy,
  Check,
} from "lucide-react";
import useReadTracking from "../../../../components/kb/ReadTracking";
import SEOMetaTags from "../../../../components/kb/SEOMetaTags";
import { fetchWithAuth } from "../../../../lib/api";
import Loader from "../../../../components/Loader";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name: string;
  category_name?: string | null;
  tags?: string[];
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string | null;
  canonical_url?: string | null;
  og_image?: string | null;
}

export default function PublicArticlePage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Read Telemetry
  useReadTracking(article?.id || "");

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const response = await fetchWithAuth(`/kb/public/articles/${slug}`);
        const resData = await response.json();

        if (!response.ok) {
          throw new Error(resData.error?.message || "Failed to load article.");
        }

        setArticle(resData.data.article);
      } catch (err: any) {
        setError(err.message || "Failed to retrieve article.");
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [slug]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader size="xl" theme="auto" label="Loading documentation..." />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
          <BookOpen size={32} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">Article Not Found</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {error || "The article you are looking for may have been retired or made internal."}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-colors"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  // Generate Table of Contents & Headings Anchor ID Injection
  const headings: { text: string; id: string; level: string }[] = [];
  let renderedContent = article.content || "";

  renderedContent = renderedContent.replace(
    /<h([2-3])([^>]*)>(.*?)<\/h\1>/gi,
    (match, level, attrs, text) => {
      const cleanText = text.replace(/<[^>]*>/g, "").trim();
      if (!cleanText) return match;
      const id = cleanText
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      headings.push({ text: cleanText, id, level: `h${level}` });
      return `<h${level} id="${id}" ${attrs} class="scroll-mt-20">${text}</h${level}>`;
    }
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      {/* Client-side Dynamic SEO Injections */}
      <SEOMetaTags
        title={article.meta_title || article.title}
        description={article.meta_description || undefined}
        keywords={article.keywords || undefined}
        canonicalUrl={article.canonical_url || undefined}
        ogImage={article.og_image || undefined}
        author={article.author_name}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "headline": article.title,
          "description": article.meta_description || "Helpdesk documentation",
          "author": { "@type": "Person", "name": article.author_name },
          "datePublished": article.created_at,
          "dateModified": article.updated_at,
        }}
      />

      {/* Header Bar */}
      <header className="sticky top-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur border-b border-slate-200 dark:border-slate-800 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-semibold"
          >
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyShareLink}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
              title="Copy shareable link"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
              title="Print layout"
            >
              <Printer size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Meta layout */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8 print:block">
        {/* Article Container */}
        <article className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm print:border-none print:shadow-none print:p-0">
          {/* Breadcrumb / Category */}
          {article.category_name && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 rounded-full mb-4">
              {article.category_name}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
            {article.title}
          </h1>

          {/* Author/Date metadata */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs text-slate-400 dark:text-slate-500 pb-6 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <UserIcon size={14} />
              <span>Written by {article.author_name}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              <span>Updated {new Date(article.updated_at).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
            </span>
          </div>

          {/* Content rendered safely */}
          <div
            className="prose prose-slate dark:prose-invert max-w-none mt-8 text-slate-700 dark:text-slate-300 leading-relaxed font-normal
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-slate-100
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-p:mb-4 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-700
              prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
              prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
              prose-li:mb-1
              prose-img:rounded-xl prose-img:shadow-md
              prose-code:text-xs prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
              prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-xl prose-pre:overflow-x-auto
            "
            dangerouslySetInnerHTML={{ __html: renderedContent }}
          />

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
                >
                  <TagIcon size={12} />
                  <span>#{tag}</span>
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Sidebar: Table of Contents & Quick metadata */}
        <aside className="lg:col-span-1 flex flex-col gap-6 print:hidden">
          {headings.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm sticky top-24">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                On this page
              </span>
              <nav className="flex flex-col gap-2.5 max-h-[70vh] overflow-y-auto pr-1">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`text-xs text-left transition-colors font-medium border-l pl-3 hover:text-blue-600 dark:hover:text-blue-400 ${
                      h.level === "h3" ? "ml-3 text-slate-400 border-slate-100 dark:border-slate-800" : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
