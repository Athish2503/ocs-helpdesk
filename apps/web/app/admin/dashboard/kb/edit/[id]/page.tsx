"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, FileText, Sliders, Image as ImageIcon, Sparkles } from "lucide-react";
import { fetchWithAuth } from "../../../../../../lib/api";
import ImageUploader from "../../../../../../components/kb/ImageUploader";
import ImageGallery from "../../../../../../components/kb/ImageGallery";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "images">("editor");

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isInternal, setIsInternal] = useState(true);

  // SEO Override Fields
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImage, setOgImage] = useState("");

  // Attachments State
  const [attachments, setAttachments] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const [artRes, catRes, attachRes] = await Promise.all([
        fetchWithAuth(`/kb/${id}`),
        fetchWithAuth("/kb/categories"),
        fetchWithAuth(`/kb/articles/${id}/attachments`),
      ]);

      const artData = await artRes.json();
      const catData = await catRes.json();
      const attachData = await attachRes.json();

      if (artRes.ok) {
        const art = artData.data.article;
        setTitle(art.title);
        setContent(art.content);
        setCategoryId(art.categoryId || "");
        setTagsInput(art.tags?.join(", ") || "");
        setIsPublished(art.isPublished);
        setIsInternal(art.isInternal);
        setMetaTitle(art.metaTitle || "");
        setMetaDescription(art.metaDescription || "");
        setKeywords(art.keywords || "");
        setCanonicalUrl(art.canonicalUrl || "");
        setOgImage(art.ogImage || "");
      }

      if (catRes.ok) setCategories(catData.data.categories || []);
      if (attachRes.ok) setAttachments(attachData.data.attachments || []);
    } catch (err) {
      console.error("Failed to load edit workspace data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required.");
      return;
    }

    setSaving(true);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const payload = {
      title: title.trim(),
      content: content.trim(),
      categoryId: categoryId || null,
      tags,
      isPublished,
      isInternal,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
      keywords: keywords.trim() || null,
      canonicalUrl: canonicalUrl.trim() || null,
      ogImage: ogImage.trim() || null,
    };

    try {
      const response = await fetchWithAuth(`/kb/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (response.ok) {
        router.push(`/admin/dashboard/kb/${id}`);
      } else {
        alert(resData.error?.message || "Failed to update article.");
      }
    } catch (err) {
      console.error("Failed to save updates:", err);
    } finally {
      setSaving(false);
    }
  };

  // Content helper toolbar function
  const insertText = (before: string, after: string) => {
    const textarea = document.getElementById("content-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const replacement = before + (selected || "text") + after;

    setContent(text.substring(0, start) + replacement + text.substring(end));

    // Refocus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selected || "text").length);
    }, 10);
  };

  // Image Upload handler
  const handleUploadSuccess = (newAttachment: any) => {
    setAttachments((prev) => [...prev, newAttachment]);
  };

  const handleDeleteSuccess = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSetFeaturedSuccess = (attachmentId: string) => {
    setAttachments((prev) =>
      prev.map((a) => ({
        ...a,
        isFeatured: a.id === attachmentId,
      }))
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100">
      {/* Top Header Controls */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/admin/dashboard/kb/${id}`)}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Edit KB Article</h1>
            <p className="text-xs text-slate-400">Modify title, metadata, versions, and upload image files</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            disabled={saving}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            <span>{saving ? "Saving..." : "Save Updates"}</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Workspace Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            {/* Tab selection */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-4 gap-4">
              <button
                onClick={() => setActiveTab("editor")}
                className={`text-sm font-semibold flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                  activeTab === "editor" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <FileText size={16} />
                <span>Content Editor</span>
              </button>
              <button
                onClick={() => setActiveTab("seo")}
                className={`text-sm font-semibold flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                  activeTab === "seo" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <Sliders size={16} />
                <span>SEO Parameters</span>
              </button>
              <button
                onClick={() => setActiveTab("images")}
                className={`text-sm font-semibold flex items-center gap-1.5 pb-1 border-b-2 transition-all ${
                  activeTab === "images" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <ImageIcon size={16} />
                <span>Image Attachments ({attachments.length})</span>
              </button>
            </div>

            {activeTab === "editor" ? (
              <div className="flex flex-col gap-4">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Article Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. How to Reset Password credentials"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Content area with Formatting helpers */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Article Body (HTML/Text)</label>
                    <div className="flex gap-1">
                      {[
                        { label: "B", before: "<strong>", after: "</strong>", title: "Bold" },
                        { label: "I", before: "<em>", after: "</em>", title: "Italic" },
                        { label: "H2", before: "<h2>", after: "</h2>", title: "Header 2" },
                        { label: "H3", before: "<h3>", after: "</h3>", title: "Header 3" },
                        { label: "Link", before: '<a href="https://example.com" target="_blank">', after: "</a>", title: "Hyperlink" },
                        { label: "Pre", before: "<pre><code>", after: "</code></pre>", title: "Code block" },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => insertText(btn.before, btn.after)}
                          className="px-2 py-0.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 rounded text-[10px] font-bold text-slate-500 transition-colors"
                          title={btn.title}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    id="content-textarea"
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write article details. HTML formatting is supported (e.g. <p>, <h2>, <ul>, <li>)."
                    rows={15}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-y"
                  />
                </div>
              </div>
            ) : activeTab === "seo" ? (
              <div className="flex flex-col gap-4">
                {/* Meta Title */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta Title (Max 60 chars)</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Search Engine Title override"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Meta Description */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta Description (Max 160 chars)</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Summary shown in search engine results snippets"
                    rows={3}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {/* Keywords */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Keywords (Comma separated)</label>
                  <input
                    type="text"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. login, reset, password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Canonical URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Canonical URL</label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://yourdomain.com/kb/p/custom-slug"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* OG Image URL */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Graph Image (Social Image URL)</label>
                  <input
                    type="url"
                    value={ogImage}
                    onChange={(e) => setOgImage(e.target.value)}
                    placeholder="https://yourdomain.com/social-banner.png"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <ImageUploader articleId={id} onUploadSuccess={handleUploadSuccess} />
                <div className="mt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                    Uploaded Gallery
                  </h4>
                  <ImageGallery
                    articleId={id}
                    attachments={attachments}
                    onDeleteSuccess={handleDeleteSuccess}
                    onSetFeaturedSuccess={handleSetFeaturedSuccess}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configurations Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Publishing Options
            </h3>

            {/* Category Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Unclassified</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tags (Comma-separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="trouble, guide, server"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Visibility Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Visibility</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsInternal(true)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                    isInternal
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Internal Only
                </button>
                <button
                  type="button"
                  onClick={() => setIsInternal(false)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                    !isInternal
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Public/Customer
                </button>
              </div>
            </div>

            {/* Publish Toggle */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Publication Status</label>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mt-0.5">
                <button
                  type="button"
                  onClick={() => setIsPublished(false)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                    !isPublished
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Draft Draft
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublished(true)}
                  className={`flex-1 py-1.5 text-xs font-bold transition-all ${
                    isPublished
                      ? "bg-green-600 text-white shadow-inner"
                      : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Published
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <span className="font-bold flex items-center gap-1 mb-1">
              <Sparkles size={12} /> Rich Content Tip
            </span>
            Upload images in the <strong>Image Attachments</strong> tab, then copy their markdown tag to embed them inline in your content editor.
          </div>
        </div>
      </div>
    </div>
  );
}
