"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Calendar,
  User,
  Eye,
  Edit,
  History,
  TrendingUp,
  Clock,
  Compass,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/api";

interface PageProps {
  params: Promise<{ idOrSlug: string }>;
}

export default function ArticleDetailsPage({ params }: PageProps) {
  const router = useRouter();
  const { idOrSlug } = use(params);
  const [article, setArticle] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded states
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);

  const loadArticleData = async () => {
    try {
      const artRes = await fetchWithAuth(`/kb/${idOrSlug}`);
      const artData = await artRes.json();

      if (!artRes.ok) {
        throw new Error(artData.error?.message || "Failed to load article details.");
      }

      const art = artData.data.article;
      setArticle(art);

      // Fetch analytics and versions using the uuid article ID resolved
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-slate-500">Loading details...</span>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-lg font-bold">Article not found</h2>
        <button
          onClick={() => router.push("/admin/dashboard/kb")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
        >
          Back to list
        </button>
      </div>
    );
  }

  const stats = analytics?.stats || {
    total_reads: article.totalReads || 0,
    unique_visitors: article.uniqueReads || 0,
    avg_read_duration: 0,
    avg_scroll_depth: 0,
    last_read_at: article.lastReadAt,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/dashboard/kb")}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Article Management</h1>
            <p className="text-xs text-slate-400">View telemetry stats, versions snapshot logs, and previews</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!article.isInternal && article.isPublished && (
            <a
              href={`/kb/p/${article.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-semibold rounded-xl transition-colors"
            >
              <ExternalLink size={16} />
              <span>Public Link</span>
            </a>
          )}

          <button
            onClick={() => router.push(`/admin/dashboard/kb/edit/${article.id}`)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 transition-colors"
          >
            <Edit size={16} />
            <span>Edit Article</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section: Previews & Analytics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Info Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {article.category?.name && (
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full">
                  {article.category.name}
                </span>
              )}
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  article.isPublished ? "bg-green-50 text-green-600 dark:bg-green-950/20" : "bg-amber-50 text-amber-600"
                }`}
              >
                {article.isPublished ? "Published" : "Draft"}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  article.isInternal ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" : "bg-blue-50 text-blue-600"
                }`}
              >
                {article.isInternal ? "Internal" : "Public"}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white leading-tight">{article.title}</h2>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <User size={13} /> Written by {article.author?.name}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={13} /> Updated {new Date(article.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Analytics Dashboards */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 px-1">
              Article Telemetry Stats
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total Reads", value: stats.total_reads, icon: Eye, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                { label: "Unique Readers", value: stats.unique_visitors, icon: TrendingUp, color: "text-green-500 bg-green-50 dark:bg-green-950/20" },
                { label: "Avg Duration", value: `${stats.avg_read_duration}s`, icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                { label: "Avg Scroll", value: `${stats.avg_scroll_depth}%`, icon: Compass, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
              ].map((card, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${card.color}`}>
                    <card.icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 block">{card.label}</span>
                    <span className="text-lg font-extrabold mt-0.5">{card.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral Distributions */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Referrers */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  Top Traffic Referrers
                </span>
                {analytics.topReferrers?.length === 0 ? (
                  <span className="text-xs text-slate-400">No referrer data logged.</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {analytics.topReferrers?.map((ref: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="truncate max-w-[200px] font-medium text-slate-600 dark:text-slate-400">{ref.referrer}</span>
                        <span className="font-bold">{ref.count} hits</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UTM Campaigns */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                  UTM Campaigns
                </span>
                {analytics.utmCampaigns?.length === 0 ? (
                  <span className="text-xs text-slate-400">No UTM campaigns tracked.</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    {analytics.utmCampaigns?.map((c: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <span className="truncate max-w-[200px] font-medium text-slate-600 dark:text-slate-400">
                          {c.campaign} ({c.source}/{c.medium})
                        </span>
                        <span className="font-bold">{c.read_count} reads</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Version snapshot logs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
              Version Snapshots
            </span>

            {versions.length === 0 ? (
              <p className="text-xs text-slate-400">No saved snapshots recorded.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto pr-1">
                {versions.map((ver) => {
                  const isExpanded = expandedVersionId === ver.id;
                  return (
                    <div key={ver.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            v{ver.versionNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {new Date(ver.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={() => setExpandedVersionId(isExpanded ? null : ver.id)}
                          className="text-slate-400 hover:text-slate-600 p-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 italic truncate">{ver.changeSummary || "No description"}</p>
                      <p className="text-[10px] text-slate-400">Edited by {ver.editor?.name}</p>

                      {isExpanded && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Snapshot Title
                          </h4>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">{ver.title}</p>
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Snapshot Content
                          </h4>
                          <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded border border-slate-100 dark:border-slate-800 max-h-[150px] overflow-y-auto text-[10px] font-mono whitespace-pre-wrap">
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
        </div>
      </div>
    </div>
  );
}
