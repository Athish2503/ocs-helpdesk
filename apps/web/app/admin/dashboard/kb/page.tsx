"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  FolderOpen,
  Eye,
  Edit2,
  Trash2,
  BookOpen,
  CheckCircle,
  FileText,
  TrendingUp,
  ExternalLink,
  Lock,
  Globe,
  Search,
  X,
  Shield,
} from "lucide-react";
import { fetchWithAuth } from "../../../../lib/api";
import { useAuth } from "../../../../context/AuthContext";
import { useDialog } from "../../../../context/DialogContext";
import CategorySidebar from "../../../../components/kb/CategorySidebar";
import AdvancedFilters from "../../../../components/kb/AdvancedFilters";
import TagFilter from "../../../../components/kb/TagFilter";

interface Article {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isInternal: boolean;
  totalReads: number;
  uniqueReads: number;
  createdAt: string;
  updatedAt: string;
  author: { name: string };
  category?: { name: string } | null;
  tags?: string[];
}

export default function KbManagementPage() {
  const router = useRouter();
  const { user } = useAuth();
  const dialog = useDialog();

  // Theme — reactive tracker
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState("all");
  const [isInternal, setIsInternal] = useState("all");

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedCategoryId) params.append("categoryId", selectedCategoryId);
      if (selectedTag) params.append("tag", selectedTag);
      if (isPublished !== "all") params.append("isPublished", isPublished);
      if (isInternal !== "all") params.append("isInternal", isInternal);

      const [artRes, catRes, tagRes] = await Promise.all([
        fetchWithAuth(`/kb?${params.toString()}`),
        fetchWithAuth("/kb/categories"),
        fetchWithAuth("/kb/tags"),
      ]);

      const artData = await artRes.json();
      const catData = await catRes.json();
      const tagData = await tagRes.json();

      if (artRes.ok) setArticles(artData.data.articles || []);
      if (catRes.ok) setCategories(catData.data.categories || []);
      if (tagRes.ok) setTags(tagData.data.tags || []);
    } catch (err) {
      console.error("Failed to load KB data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [search, selectedCategoryId, selectedTag, isPublished, isInternal]); // eslint-disable-line

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm(
      "Delete this article? All version history and read statistics will be permanently lost.",
      "Delete Article"
    );
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/kb/${id}`, { method: "DELETE" });
      if (res.ok) setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCategoryId(null);
    setSelectedTag(null);
    setIsPublished("all");
    setIsInternal("all");
  };

  // Stats
  const totalArticles = articles.length;
  const publishedCount = articles.filter(a => a.isPublished).length;
  const draftCount = totalArticles - publishedCount;
  const totalReads = articles.reduce((acc, a) => acc + (a.totalReads || 0), 0);

  const hasFilters = search || selectedCategoryId || selectedTag || isPublished !== "all" || isInternal !== "all";

  return (
    <div className={`p-5 md:p-7 space-y-6 min-h-full admin-fade-in ${isDark ? "admin-dark" : ""}`}>

      {/* ── Stats Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: totalArticles, icon: <BookOpen className="w-5 h-5" />, iconCls: isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600" },
          { label: "Published", value: publishedCount, icon: <CheckCircle className="w-5 h-5" />, iconCls: isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600" },
          { label: "Drafts", value: draftCount, icon: <FileText className="w-5 h-5" />, iconCls: isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-600" },
          { label: "Total Reads", value: totalReads, icon: <TrendingUp className="w-5 h-5" />, iconCls: isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600" },
        ].map((stat, i) => (
          <div key={i} className={`admin-card p-4 flex items-center justify-between ${isDark ? "admin-dark" : ""}`}>
            <div>
              <p className={`text-xs font-medium mb-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{stat.label}</p>
              <p className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{stat.value}</p>
            </div>
            <div className={`admin-stat-icon-wrap ${stat.iconCls}`}>{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* ── Content Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">

        {/* Left: Category + Tag sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <div className={`admin-card p-4 ${isDark ? "admin-dark" : ""}`}>
            <CategorySidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>
          <div className={`admin-card ${isDark ? "admin-dark" : ""}`}>
            <TagFilter tags={tags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
          </div>
        </div>

        {/* Right: Filters + Article list */}
        <div className="lg:col-span-3 space-y-4">
          {/* Advanced Filters */}
          <div className={`admin-card ${isDark ? "admin-dark" : ""}`}>
            <AdvancedFilters
              search={search}
              isPublished={isPublished}
              isInternal={isInternal}
              selectedCategoryId={selectedCategoryId}
              categories={categories}
              onSearchChange={setSearch}
              onPublishedChange={setIsPublished}
              onInternalChange={setIsInternal}
              onCategoryIdChange={setSelectedCategoryId}
              onReset={handleResetFilters}
            />
          </div>

          {/* Filter active indicator */}
          {hasFilters && !loading && (
            <div className={`flex items-center justify-between px-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <span>{articles.length} article{articles.length !== 1 ? "s" : ""} found</span>
              <button onClick={handleResetFilters} className={`flex items-center gap-1.5 text-xs font-medium hover:underline ${isDark ? "text-[#5fc0f9]" : "text-[#0d7fc0]"}`}>
                <X className="w-3 h-3" />
                Clear filters
              </button>
            </div>
          )}

          {/* Article content */}
          {loading ? (
            <div className={`admin-card py-16 flex flex-col items-center justify-center gap-3 ${isDark ? "admin-dark" : ""}`}>
              <div className="w-7 h-7 border-[3px] border-[#38b1f7] border-t-transparent rounded-full animate-spin" />
              <span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>Loading articles…</span>
            </div>
          ) : articles.length === 0 ? (
            <div className={`admin-card py-12 ${isDark ? "admin-dark" : ""}`}>
              <div className="admin-empty-state">
                <BookOpen className={`w-10 h-10 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                <h3>No articles found</h3>
                <p>{hasFilters ? "Try widening your search or clearing category filters." : "Create your first article to get started."}</p>
                <div className="mt-4 flex gap-2">
                  {hasFilters && (
                    <button onClick={handleResetFilters} className={`admin-btn admin-btn-ghost admin-btn-sm`}>
                      Clear filters
                    </button>
                  )}
                  <button onClick={() => router.push("/admin/dashboard/kb/new")} className="admin-btn admin-btn-primary admin-btn-sm">
                    <Plus className="w-3.5 h-3.5" />
                    New Article
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {articles.map(art => (
                <ArticleCard key={art.id} art={art} isDark={isDark} onView={() => router.push(`/admin/dashboard/kb/${art.id}`)} onEdit={() => router.push(`/admin/dashboard/kb/edit/${art.id}`)} onDelete={() => handleDelete(art.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ art, isDark, onView, onEdit, onDelete }: {
  art: Article; isDark: boolean;
  onView: () => void; onEdit: () => void; onDelete: () => void;
}) {
  return (
    <div className={`admin-card admin-card-hover p-5 flex flex-col justify-between gap-4 ${isDark ? "admin-dark" : ""}`}>
      <div>
        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {art.category?.name && (
            <span className={`admin-badge ${isDark ? "bg-[#38b1f7]/10 text-[#5fc0f9] border-[#38b1f7]/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {art.category.name}
            </span>
          )}
          <span className={`admin-badge ${art.isPublished ? "admin-badge-resolved" : "admin-badge-medium"}`}>
            {art.isPublished ? "Published" : "Draft"}
          </span>
          <span className={`admin-badge ${art.isInternal ? "admin-badge-closed" : isDark ? "bg-[#38b1f7]/8 text-[#5fc0f9] border-[#38b1f7]/15" : "bg-blue-50 text-blue-600 border-blue-200"} flex items-center gap-1`}>
            {art.isInternal ? <><Lock className="w-2.5 h-2.5" />Internal</> : <><Globe className="w-2.5 h-2.5" />Public</>}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={onView}
          className={`text-sm font-semibold leading-snug cursor-pointer line-clamp-2 transition-colors ${isDark ? "text-slate-100 hover:text-[#5fc0f9]" : "text-slate-900 hover:text-[#0d7fc0]"}`}
        >
          {art.title}
        </h3>
      </div>

      {/* Footer */}
      <div className={`flex items-center justify-between pt-3 border-t text-xs ${isDark ? "border-white/[0.05] text-slate-500" : "border-slate-100 text-slate-400"}`}>
        <div className="flex items-center gap-2">
          <span>{art.author.name}</span>
          <span>·</span>
          <span>{art.totalReads.toLocaleString()} reads</span>
        </div>
        <div className="flex items-center gap-1">
          {!art.isInternal && art.isPublished && (
            <a href={`/kb/p/${art.slug}`} target="_blank" rel="noreferrer" title="View public page" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={onView} title="View article" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={onEdit} title="Edit article" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-[#5fc0f9] hover:bg-white/[0.05]" : "text-slate-400 hover:text-[#0d7fc0] hover:bg-blue-50"}`}>
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} title="Delete article" className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-950/15" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
