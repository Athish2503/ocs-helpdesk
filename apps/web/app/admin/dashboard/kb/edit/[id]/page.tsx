"use client";

import React, { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Home, 
  ChevronRight, 
  Rocket, 
  FolderPlus, 
  Lock, 
  Plus, 
  X, 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Quote, 
  Code, 
  Minus, 
  Trash2,
  FileText,
  Sliders,
  Check
} from "lucide-react";
import { fetchWithAuth } from "../../../../../../lib/api";
import { useDialog } from "../../../../../../context/DialogContext";
import ImageUploader from "../../../../../../components/kb/ImageUploader";
import ImageGallery from "../../../../../../components/kb/ImageGallery";
import RichTextEditor from "../../../../../../components/kb/RichTextEditor";
import Loader from "../../../../../../components/Loader";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditArticlePage({ params }: PageProps) {
  const router = useRouter();
  const { id } = use(params);
  const dialog = useDialog();

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "seo" | "images">("editor");

  // Form Fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
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

  // Collection Creator State
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const loadCategories = async () => {
    try {
      const res = await fetchWithAuth("/kb/categories");
      const data = await res.json();
      if (res.ok) {
        setCategories(data.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

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
        setTags(art.tags || []);
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
      await dialog.alert("Title and content are required.", "Validation Error");
      return;
    }

    setSaving(true);

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
        await dialog.alert(resData.error?.message || "Failed to update article.", "Error");
      }
    } catch (err) {
      console.error("Failed to save updates:", err);
    } finally {
      setSaving(false);
    }
  };



  // Tag Add / Remove Handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      e.preventDefault();
      setTags(tags.slice(0, -1));
    }
  };

  // Image Upload Success Handler
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

  // Create Collection Handler
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setCreatingCategory(true);
    try {
      const res = await fetchWithAuth("/kb/categories", {
        method: "POST",
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || null,
          parentId: null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const createdCat = data.data.category;
        
        await loadCategories();
        setCategoryId(createdCat.id);
        
        setNewCategoryName("");
        setNewCategoryDesc("");
        setShowNewCollectionModal(false);
      } else {
        const data = await res.json();
        await dialog.alert(data.error?.message || "Failed to create category", "Error");
      }
    } catch (err) {
      console.error(err);
      await dialog.alert("Failed to create category", "Error");
    } finally {
      setCreatingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader size="xl" theme="auto" label="Loading editor workspace..." />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#F8F9FC] dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300">
      {/* Top Header & Breadcrumb Container */}
      <div className="max-w-5xl mx-auto flex flex-col gap-4 mb-8">
        {/* Breadcrumb Path */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <Home size={14} className="stroke-[2.5px]" />
          <ChevronRight size={12} className="stroke-[3px]" />
          <span 
            onClick={() => router.push("/admin/dashboard/kb")}
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Knowledge Base
          </span>
          <ChevronRight size={12} className="stroke-[3px]" />
          <span 
            onClick={() => router.push(`/admin/dashboard/kb/${id}`)}
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer truncate max-w-[200px]"
          >
            {title}
          </span>
          <ChevronRight size={12} className="stroke-[3px]" />
          <span className="text-slate-650 dark:text-slate-300">Edit</span>
        </div>

        {/* Action Title Bar */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Edit Article</h1>
          <button
            onClick={() => router.push(`/admin/dashboard/kb/${id}`)}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={16} className="stroke-[3px]" />
            <span>Back to Details</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Work Tabs & Editor */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Card holding Workspace Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            {/* Header with Navigation Tabs */}
            <div className="flex border-b border-slate-100 dark:border-slate-800/80 pb-3 mb-6 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("editor")}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  activeTab === "editor" 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                }`}
              >
                <FileText size={14} className="stroke-[2.5px]" />
                <span>Content Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("seo")}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  activeTab === "seo" 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                }`}
              >
                <Sliders size={14} className="stroke-[2.5px]" />
                <span>SEO Parameters</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("images")}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
                  activeTab === "images" 
                    ? "border-blue-600 text-blue-600 dark:text-blue-400" 
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-350"
                }`}
              >
                <ImageIcon size={14} className="stroke-[2.5px]" />
                <span>Image Attachments ({attachments.length})</span>
              </button>
            </div>

            {/* TAB: CONTENT EDITOR */}
            {activeTab === "editor" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Title Metadata field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Article Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., How to Reset Your Password"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 focus:border-blue-500 rounded-2xl text-sm font-medium text-slate-850 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-all"
                  />
                </div>

                {/* Body Content textarea and toolbar */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Article Body (HTML/Text)
                    </label>
                  </div>

                  <RichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Write article details. HTML formatting is supported (e.g. <p>, <h2>, <ul>, <li>)."
                  />
                </div>
              </div>
            )}

            {/* TAB: SEO PARAMETERS */}
            {activeTab === "seo" && (
              <div className="flex flex-col gap-4 animate-fade-in">
                {/* Meta Title */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta Title</label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Search Engine Title override"
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>

                {/* Meta Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Meta Description</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    placeholder="Summary shown in search engine results snippets"
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 resize-none text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Keywords */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Keywords</label>
                    <input
                      type="text"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="e.g., login, reset, password"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  {/* OG Image URL */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">OG Image URL</label>
                    <input
                      type="url"
                      value={ogImage}
                      onChange={(e) => setOgImage(e.target.value)}
                      placeholder="https://yourdomain.com/social-banner.png"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                </div>

                {/* Canonical URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Canonical URL</label>
                  <input
                    type="url"
                    value={canonicalUrl}
                    onChange={(e) => setCanonicalUrl(e.target.value)}
                    placeholder="https://yourdomain.com/kb/p/custom-slug"
                    className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            {/* TAB: IMAGES ATTACHMENTS */}
            {activeTab === "images" && (
              <div className="flex flex-col gap-6 animate-fade-in">
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

        {/* Right Sidebar Column - Actions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Card 1: Publishing */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)]">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-4">
              Publishing Options
            </span>

            {/* Live status toggle */}
            <div className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between mb-5 select-none">
              <div>
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100 block tracking-wide">
                  LIVE STATUS
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                  {isPublished ? "PUBLISHED" : "DRAFT MODE"}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => setIsPublished(!isPublished)}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out focus:outline-none outline-none ${
                  isPublished ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-800"
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-all duration-300 ease-in-out absolute left-0.5 top-0.5 ${
                    isPublished ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Save Button */}
            <button
              disabled={saving}
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-extrabold shadow-[0_4px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.3)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              <Rocket size={14} className="stroke-[2.5px]" />
              <span>{saving ? "SAVING UPDATES..." : "LAUNCH ARTICLE"}</span>
            </button>
          </div>

          {/* Card 2: Categorization */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                Categorization
              </span>
            </div>

            {/* Category dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Article Folder / Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-650 dark:text-slate-350 cursor-pointer"
              >
                <option value="">Unclassified / Search categories...</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* New Collection trigger button */}
            <button
              type="button"
              onClick={() => setShowNewCollectionModal(true)}
              className="w-full py-3 border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-all duration-200"
            >
              <FolderPlus size={14} className="stroke-[2.5px]" />
              <span>NEW COLLECTION</span>
            </button>
          </div>

          {/* Card 3: Access Control */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#EC4899] uppercase tracking-wider block">
                Access Control
              </span>
            </div>

            {/* Visibility toggle select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Visibility Scope
              </label>
              <select
                value={isInternal ? "internal" : "public"}
                onChange={(e) => setIsInternal(e.target.value === "internal")}
                className="w-full px-3 py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-650 dark:text-slate-355 cursor-pointer"
              >
                <option value="internal">Staff Vault (Internal)</option>
                <option value="public">Public / Customer-facing</option>
              </select>
            </div>

            {/* Internal Vault alert box */}
            {isInternal && (
              <div className="bg-[#FFFBEB] dark:bg-amber-950/10 border border-[#FDE68A]/60 dark:border-amber-900/30 p-3 rounded-2xl text-[9px] text-amber-800 dark:text-amber-400 font-bold tracking-wide flex items-center gap-1.5 select-none uppercase">
                <Lock size={12} className="stroke-[2.5px] shrink-0" />
                <span>Restricted to authorized employees only.</span>
              </div>
            )}
          </div>

          {/* Card 4: Discoverability */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                Discoverability
              </span>
            </div>

            {/* Tag add/remove pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                Index Tags
              </label>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press enter"
                  className="flex-1 px-3 py-2 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-650 dark:text-slate-350"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400"
                >
                  Add
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tags.map((tag, i) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-semibold"
                    >
                      <span>#{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(i)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <X size={10} className="stroke-[3px]" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block mt-1.5 uppercase select-none">
                {tags.length}/10 tags • Press Enter to add, Backspace to remove last
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Inline Popup Modal for creating a New Collection */}
      {showNewCollectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-slide-in">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                New Collection (Category)
              </h3>
              <button
                type="button"
                onClick={() => setShowNewCollectionModal(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Collection Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Billing Guides, API References"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="Describe collection scope..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/20 resize-none text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all flex items-center gap-1.5"
                >
                  {creatingCategory ? "Creating..." : (
                    <>
                      <Check size={12} className="stroke-[3px]" />
                      <span>Save Collection</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
