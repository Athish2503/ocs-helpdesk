"use client";

import React, { useState, useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useToast } from "../../context/ToastContext";

interface AdminShellProps {
  user: { name: string; role: string };
  onLogout: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  headerTitle: string;
  headerDescription?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  /** Let the page control theme externally (pass isDark + setter) */
  isDark: boolean;
  onToggleTheme: () => void;
}

export default function AdminShell({
  user,
  onLogout,
  activeTab = "overview",
  onTabChange,
  headerTitle,
  headerDescription,
  isLoading,
  onRefresh,
  headerActions,
  children,
  isDark,
  onToggleTheme,
}: AdminShellProps) {
  return (
    <div
      className={`
        min-h-screen flex font-body overflow-hidden relative
        ${isDark ? "admin-dark bg-[#020617] text-[#f8fafc]" : "bg-[#f8fafc] text-[#0f172a]"}
      `}
    >
      {/* Subtle ambient background — toned down vs original */}
      <div
        className={`absolute inset-0 grid-bg pointer-events-none z-0 ${isDark ? "opacity-20" : "opacity-5"}`}
        aria-hidden="true"
      />
      <div
        className={`absolute top-0 right-0 w-[480px] h-[480px] rounded-full pointer-events-none z-0 blur-[120px] ${isDark ? "bg-[#38b1f7]/8" : "bg-[#38b1f7]/3"}`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <AdminSidebar
        user={user}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
        isDark={isDark}
      />

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden z-10 min-w-0">
        <AdminHeader
          title={headerTitle}
          description={headerDescription}
          isDark={isDark}
          isLoading={isLoading}
          onToggleTheme={onToggleTheme}
          onRefresh={onRefresh}
          onLogout={onLogout}
        >
          {headerActions}
        </AdminHeader>

        <main
          className="flex-1 overflow-y-auto"
          id="admin-main-content"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Skeleton shell for auth-loading states ──────────────────────── */
export function AdminShellSkeleton({ isDark }: { isDark: boolean }) {
  const sk = isDark ? "skeleton" : "skeleton-light";
  return (
    <div
      className={`min-h-screen flex ${isDark ? "bg-[#020617]" : "bg-[#f8fafc]"}`}
    >
      <aside
        className={`w-[240px] border-r hidden md:flex flex-col p-4 gap-4 shrink-0 ${isDark ? "bg-[#0c1525]/80 border-white/[0.06]" : "bg-white border-slate-200"}`}
      >
        <div className="flex items-center gap-3 h-[56px]">
          <div className={`w-8 h-8 rounded-xl ${sk}`} />
          <div className={`h-4 w-24 rounded ${sk}`} />
        </div>
        <div className="space-y-2 flex-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-10 w-full rounded-xl ${sk}`} />
          ))}
        </div>
        <div className={`h-14 w-full rounded-xl ${sk}`} />
      </aside>
      <div className="flex-1 flex flex-col">
        <div className={`h-[64px] border-b ${isDark ? "bg-[#0c1525]/80 border-white/[0.06]" : "bg-white border-slate-200"} flex items-center px-6 gap-4`}>
          <div className={`h-5 w-40 rounded ${sk}`} />
          <div className="ml-auto flex gap-2">
            <div className={`h-8 w-8 rounded-lg ${sk}`} />
            <div className={`h-8 w-8 rounded-lg ${sk}`} />
          </div>
        </div>
        <main className="flex-1 p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-28 rounded-2xl ${sk}`} />
            ))}
          </div>
          <div className={`h-64 w-full rounded-2xl ${sk}`} />
        </main>
      </div>
    </div>
  );
}
