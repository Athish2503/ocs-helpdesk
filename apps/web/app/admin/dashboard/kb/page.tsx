"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Plus,
  FolderOpen,
  Shield,
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
      // Build query string
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

  useEffect(() => {
    loadData();
  }, [search, selectedCategoryId, selectedTag, isPublished, isInternal]);

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Are you sure you want to delete this article? All version history and stats will be lost.", "Delete Article");
    if (!confirmed) return;
    try {
      const response = await fetchWithAuth(`/kb/${id}`, { method: "DELETE" });
      if (response.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
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

  // Stats calculation
  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.isPublished).length;
  const draftCount = totalArticles - publishedCount;
  const totalReads = articles.reduce((acc, curr) => acc + (curr.totalReads || 0), 0);

  // Framer Motion Animation Settings
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
  } as const;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100">
      {/* Title & Navigation Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Knowledge Base Portal</h1>
          <p className="text-sm text-slate-400">Create, organize, and track troubleshooting articles</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/admin/dashboard/kb/categories")}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold transition-colors"
          >
            <FolderOpen size={16} />
            <span>Categories</span>
          </button>

          {user?.role === "ADMIN" && (
            <button
              onClick={() => router.push("/admin/dashboard/kb/security")}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold transition-colors"
            >
              <Shield size={16} />
              <span>Security Events</span>
            </button>
          )}

          <button
            onClick={() => router.push("/admin/dashboard/kb/new")}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-colors"
          >
            <Plus size={16} />
            <span>Create Article</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Articles", value: totalArticles, icon: BookOpen, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
          { label: "Published Articles", value: publishedCount, icon: CheckCircle, color: "text-green-500 bg-green-50 dark:bg-green-950/20" },
          { label: "Draft snap", value: draftCount, icon: FileText, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Total Reads", value: totalReads, icon: TrendingUp, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-slate-400">{stat.label}</p>
              <h2 className="text-xl font-bold mt-1">{stat.value}</h2>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stat.color}`}>
              <stat.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Sidebar Filters */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <CategorySidebar
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />
          </div>

          <TagFilter tags={tags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
        </div>

        {/* Right Side: Filters bar & Articles Table */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <AdvancedFilters
            search={search}
            isPublished={isPublished}
            isInternal={isInternal}
            onSearchChange={setSearch}
            onPublishedChange={setIsPublished}
            onInternalChange={setIsInternal}
            onReset={handleResetFilters}
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px]">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400 font-semibold mt-2">Loading articles...</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px] text-center">
              <BookOpen size={48} className="text-slate-300 dark:text-slate-700 mb-2" />
              <h3 className="text-base font-bold">No Articles Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Try widening your search queries, clearing category tree filters, or create a new draft.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold rounded-lg transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {articles.map((art) => (
                <motion.div
                  key={art.id}
                  variants={cardVariants}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-shadow relative flex flex-col justify-between"
                >
                  <div>
                    {/* Tags / Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {art.category?.name && (
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full">
                          {art.category.name}
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          art.isPublished
                            ? "bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}
                      >
                        {art.isPublished ? "Published" : "Draft"}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          art.isInternal
                            ? "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/10 dark:text-blue-400"
                        }`}
                      >
                        {art.isInternal ? (
                          <>
                            <Lock size={10} /> Internal
                          </>
                        ) : (
                          <>
                            <Globe size={10} /> Public
                          </>
                        )}
                      </span>
                    </div>

                    {/* Article title */}
                    <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2 cursor-pointer"
                      onClick={() => router.push(`/admin/dashboard/kb/${art.id}`)}
                    >
                      {art.title}
                    </h3>
                  </div>

                  {/* Footer area: Author, reads & Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <div>
                      <span>By {art.author.name}</span>
                      <span className="mx-2">•</span>
                      <span>{art.totalReads} reads</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!art.isInternal && art.isPublished && (
                        <a
                          href={`/kb/p/${art.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all"
                          title="View public page"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}

                      <button
                        onClick={() => router.push(`/admin/dashboard/kb/${art.id}`)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        onClick={() => router.push(`/admin/dashboard/kb/edit/${art.id}`)}
                        className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all"
                        title="Edit article"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(art.id)}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-all"
                        title="Delete article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
