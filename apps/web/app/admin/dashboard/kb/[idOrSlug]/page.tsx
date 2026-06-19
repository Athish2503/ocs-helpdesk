"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Home,
  ChevronRight,
  Edit,
  BarChart2,
  Share2,
  HelpCircle,
  Clock,
  User,
  Printer,
  Trash2,
  CheckCircle,
  FileCheck,
  TrendingUp,
  History,
  Eye,
  ChevronDown,
  ChevronUp,
  Compass,
  Lock,
  Globe,
  Tag as TagIcon
} from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/api";
import { useDialog } from "../../../../../context/DialogContext";
import Loader from "../../../../../components/Loader";

interface PageProps {
  params: Promise<{ idOrSlug: string }>;
}

export default function ArticleDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { idOrSlug } = use(params);
  const dialog = useDialog();
  
  const [article, setArticle] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Collapsible panel toggles (integrating original logs)
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  // UI state actions
  const [copied, setCopied] = useState(false);

  const loadArticleData = async () => {
    try {
      const artRes = await fetchWithAuth(`/kb/${idOrSlug}`);
      const artData = await artRes.json();

      if (!artRes.ok) {
        throw new Error(artData.error?.message || "Failed to load article details.");
      }

      const art = artData.data.article;
      setArticle(art);

      // Fetch analytics and versions
      const [analyticsRes, versionsRes] = await Promise.all([
        fetchWithAuth(`/kb/articles/${art.id}/analytics`),
        fetchWithAuth(`/kb/articles/${art.id}/versions`),
      ]);

      const analyticsData = await analyticsRes.json();
      const versionsData = await versionsRes.json();

      if (analyticsRes.ok) setAnalytics(analyticsData.data.analytics);
      if (versionsRes.ok) setVersions(versionsData.data.versions || []);
    } catch (err) {
      console.error("Failed to load article metadata dashboards:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticleData();
  }, [idOrSlug]);

  const handleDelete = async () => {
    if (!article) return;
    const confirmed = await dialog.confirm("Are you sure you want to delete this article? All version history and stats will be lost.", "Delete Article");
    if (!confirmed) return;
    
    try {
      const response = await fetchWithAuth(`/kb/${article.id}`, { method: "DELETE" });
      if (response.ok) {
        router.push("/admin/dashboard/kb");
      } else {
        await dialog.alert("Failed to delete article.", "Error");
      }
    } catch (err) {
      console.error("Failed to delete article:", err);
    }
  };

  const handleShare = () => {
    if (!article) return;
    const shareUrl = `${window.location.origin}/kb/p/${article.slug}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader size="xl" theme="auto" label="Loading article details..." />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] dark:bg-slate-950 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Article not found</h2>
        <button
          onClick={() => router.push("/admin/dashboard/kb")}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-all"
        >
          Back to list
        </button>
      </div>
    );
  }

  // Calculate Read pace & Quantity metadata
  const cleanText = article.content ? article.content.replace(/<[^>]*>/g, "") : "";
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  const readTimeMins = Math.max(1, Math.ceil(wordCount / 200));

  // Determine latest revision
  const latestRevision = versions.length > 0 ? versions[0].versionNumber : 1;

  // Retrieve stats
  const stats = analytics?.stats || {
    total_reads: article.totalReads || 0,
    unique_visitors: article.uniqueReads || 0,
    avg_read_duration: 0,
    avg_scroll_depth: 0,
  };

  return (
    <div className="flex-1 bg-[#F8F9FC] dark:bg-slate-950 p-6 md:p-10 transition-colors duration-300 print:bg-white print:p-0">
      {/* Top Header & Breadcrumbs Area */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
        {/* Left-side Path navigators */}
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">
          <button
            onClick={() => router.push("/admin/dashboard/kb")}
            className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <ChevronLeft size={15} className="stroke-[3px]" />
            <span>Back</span>
          </button>
          <span className="text-slate-200 dark:text-slate-800">|</span>
          <Home size={14} className="stroke-[2.5px] cursor-pointer hover:text-slate-700 dark:hover:text-slate-200" onClick={() => router.push("/admin/dashboard")} />
          <ChevronRight size={12} className="stroke-[3px]" />
          <span 
            onClick={() => router.push("/admin/dashboard/kb")}
            className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Knowledge Base
          </span>
          <ChevronRight size={12} className="stroke-[3px]" />
          <span className="text-slate-600 dark:text-slate-350 truncate max-w-[150px]">{article.title}</span>
        </div>

        {/* Right-side quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/admin/dashboard/kb/edit/${article.id}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-xs"
          >
            <Edit size={13} className="stroke-[2.5px]" />
            <span>Edit Article</span>
          </button>
          <button
            onClick={() => setAnalyticsOpen(!analyticsOpen)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-xs"
          >
            <BarChart2 size={13} className="stroke-[2.5px]" />
            <span>Analytics</span>
          </button>
          <button
            onClick={handleShare}
            className={`flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all shadow-xs ${
              copied ? "text-green-600 dark:text-green-400" : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <Share2 size={13} className="stroke-[2.5px]" />
            <span>{copied ? "Link Copied" : "Share"}</span>
          </button>
          <button
            className="p-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-650 dark:hover:text-slate-300 transition-colors shadow-xs"
            title="Help Support Scope"
          >
            <HelpCircle size={15} className="stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Main content split viewport */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column - Article Content & Expanded Analytics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Card View wrapper */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.015)] print:shadow-none print:border-none print:p-0">
            {/* Meta Publication Badges */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4 print:hidden">
              <span className="text-[9px] font-extrabold text-green-600 dark:text-green-400 bg-green-50/70 dark:bg-green-950/20 border border-green-150/50 dark:border-green-900/30 px-3 py-1 rounded-full uppercase tracking-wider select-none">
                Official Publication
              </span>
              
              {article.category?.name && (
                <span className="text-[9px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/20 border border-blue-150/50 dark:border-blue-900/30 px-3 py-1 rounded-full uppercase tracking-wider select-none">
                  {article.category.name}
                </span>
              )}
            </div>

            {/* Main Title Header */}
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {article.title}
            </h1>

            {/* Author Attribution Meta Block */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 mt-5 pb-5 border-b border-slate-100 dark:border-slate-800/80 text-xs text-slate-400 dark:text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                {/* Visual Avatar pill */}
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  {article.author?.name ? article.author.name.charAt(0).toUpperCase() : "A"}
                </div>
                <span>
                  <strong className="text-slate-700 dark:text-slate-350">{article.author?.name}</strong> (Author)
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 font-semibold">
                <Clock size={13} className="stroke-[2.5px]" />
                <span>Published {new Date(article.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              </div>

              <div className="flex items-center gap-1.5 font-semibold">
                <History size={13} className="stroke-[2.5px]" />
                <span>Last Revision {new Date(article.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
              </div>

              <div className="flex items-center gap-1.5 font-semibold">
                <Eye size={13} className="stroke-[2.5px]" />
                <span>{stats.total_reads} Views</span>
              </div>
            </div>

            {/* Safe HTML Content Render Area */}
            <div 
              className="prose prose-slate dark:prose-invert max-w-none mt-8 text-slate-700 dark:text-slate-300 leading-relaxed font-normal
                prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-slate-950 dark:prose-headings:text-slate-100
                prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4
                prose-h3:text-base prose-h3:mt-6 prose-h3:mb-3
                prose-p:mb-4 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:underline hover:prose-a:text-blue-700
                prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
                prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
                prose-li:mb-1.5
                prose-img:rounded-2xl prose-img:shadow-md
                prose-code:text-[11px] prose-code:bg-slate-50 dark:prose-code:bg-slate-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:font-mono
                prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:p-4 prose-pre:rounded-2xl prose-pre:overflow-x-auto
              "
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Index Taxonomy Pills listing */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Article Taxonomy
                </span>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 bg-slate-50 dark:bg-slate-800/60 border border-slate-150/40 dark:border-slate-700/50 rounded-lg text-slate-550 dark:text-slate-400 font-semibold"
                    >
                      <TagIcon size={11} className="stroke-[2.5px]" />
                      <span>{tag}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLLAPSIBLE SECTION: Telemetry and Traffic analytics (Integrated functionality) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] print:hidden">
            <button
              type="button"
              onClick={() => setAnalyticsOpen(!analyticsOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-500 stroke-[2.5px]" />
                <div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                    Telemetry & Analytics Stats
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5 uppercase tracking-wide">
                    Telemetries, UTM Campaigns, and reader interactions
                  </span>
                </div>
              </div>
              <span className="text-slate-400 hover:text-slate-600">
                {analyticsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {analyticsOpen && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-6 animate-slide-in">
                {/* 4 Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Total Reads", value: stats.total_reads, icon: Eye, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100/30" },
                    { label: "Unique Readers", value: stats.unique_visitors, icon: TrendingUp, color: "text-green-500 bg-green-50 dark:bg-green-950/20 border-green-100/30" },
                    { label: "Avg Duration", value: `${stats.avg_read_duration || 0}s`, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100/30" },
                    { label: "Avg Scroll", value: `${stats.avg_scroll_depth || 0}%`, icon: Compass, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100/30" },
                  ].map((card, i) => (
                    <div key={i} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${card.color}`}>
                        <card.icon size={15} />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wide">{card.label}</span>
                        <span className="text-base font-extrabold mt-0.5">{card.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Referrers & UTM Distributions */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* Referrers */}
                    <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                        Traffic Referrers
                      </span>
                      {!analytics.topReferrers || analytics.topReferrers.length === 0 ? (
                        <span className="text-[10px] font-semibold text-slate-400">No referrer logged.</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {analytics.topReferrers.map((ref: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="truncate max-w-[150px] font-semibold text-slate-655 dark:text-slate-400">{ref.referrer || "direct"}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{ref.count} hits</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Campaigns */}
                    <div className="bg-slate-50/40 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
                        UTM Campaigns
                      </span>
                      {!analytics.utmCampaigns || analytics.utmCampaigns.length === 0 ? (
                        <span className="text-[10px] font-semibold text-slate-400">No UTM campaigns logged.</span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {analytics.utmCampaigns.map((c: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="truncate max-w-[150px] font-semibold text-slate-655 dark:text-slate-400">
                                {c.campaign} ({c.source}/{c.medium})
                              </span>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{c.read_count} hits</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* COLLAPSIBLE SECTION: Version snapshots logs (Integrated functionality) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] print:hidden">
            <button
              type="button"
              onClick={() => setVersionsOpen(!versionsOpen)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <History size={16} className="text-purple-500 stroke-[2.5px]" />
                <div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                    Version Snapshots History
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 block mt-0.5 uppercase tracking-wide">
                    Historical revisions, modifications descriptions, and restore options
                  </span>
                </div>
              </div>
              <span className="text-slate-400 hover:text-slate-600">
                {versionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </span>
            </button>

            {versionsOpen && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-3 animate-slide-in">
                {versions.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400">No revisions logged.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {versions.map((ver) => {
                      const isExpanded = expandedVersionId === ver.id;
                      return (
                        <div key={ver.id} className="border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col gap-2 bg-slate-50/20">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-slate-850 dark:text-slate-200">
                                Version {ver.versionNumber}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2 font-medium">
                                {new Date(ver.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-500 italic font-medium">{ver.changeSummary || "No description logged."}</p>
                          <p className="text-[10px] text-slate-400 font-semibold">Edited by {ver.editor?.name}</p>

                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 animate-slide-in">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Snapshot Title
                              </span>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-3">{ver.title}</p>
                              
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Snapshot Content
                              </span>
                              <div className="bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 max-h-[180px] overflow-y-auto text-[10.5px] font-mono text-slate-750 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {ver.content}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column - Widgets */}
        <div className="lg:col-span-1 flex flex-col gap-6 print:hidden">
          {/* Action button: REVIEW DOCUMENT */}
          <button
            type="button"
            className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-3xl text-xs font-extrabold shadow-[0_4px_16px_rgba(37,99,235,0.2)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.3)] transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <FileCheck size={15} className="stroke-[2.5px]" />
            <span>REVIEW DOCUMENT</span>
          </button>

          {/* Card 1: Version Control Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] select-none">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-100/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Clock size={16} className="stroke-[2.5px]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block">
                Revision {latestRevision}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                Version Control
              </span>
            </div>
          </div>

          {/* Card 2: Document Owner Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-5 flex items-center gap-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] select-none">
            <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/20 border border-purple-100/30 flex items-center justify-center text-purple-650 dark:text-purple-400 shrink-0">
              <User size={16} className="stroke-[2.5px]" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-white block uppercase">
                {article.author?.name || "AVINASH"}
              </span>
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mt-0.5">
                Document Owner
              </span>
            </div>
          </div>

          {/* Card 3: Quick Operations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Quick Operations
            </span>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push(`/admin/dashboard/kb/edit/${article.id}`)}
                className="w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-650 dark:text-slate-300 transition-colors"
              >
                <Edit size={13} className="stroke-[2.5px] text-slate-400" />
                <span>Edit Workspace</span>
              </button>
              
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-150/40 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-655 dark:text-slate-300 transition-colors"
              >
                <Printer size={13} className="stroke-[2.5px] text-slate-400" />
                <span>Print Document</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="w-full py-2.5 bg-red-50/50 dark:bg-red-950/10 border border-red-200/50 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-red-650 dark:text-red-400 transition-colors"
              >
                <Trash2 size={13} className="stroke-[2.5px]" />
                <span>Remove Permanently</span>
              </button>
            </div>
          </div>

          {/* Card 4: Reading Metadata */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-3xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.015)] flex flex-col gap-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Reading Metadata
            </span>

            <div className="flex flex-col gap-3.5 text-xs font-bold font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase">Pace</span>
                <span className="text-slate-800 dark:text-slate-200">~{readTimeMins} MINS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase">Quantity</span>
                <span className="text-slate-800 dark:text-slate-200">{wordCount} WORDS</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] uppercase">Scope</span>
                <span className={`px-2 py-0.5 rounded text-[10px] border ${
                  article.isInternal 
                    ? "text-[#EC4899] border-pink-500/20 bg-pink-500/5 dark:bg-pink-950/10" 
                    : "text-blue-600 border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/10"
                }`}>
                  {article.isInternal ? "Internal" : "Customer"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
