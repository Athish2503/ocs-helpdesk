"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../context/ToastContext";
import AdminShell, { AdminShellSkeleton } from "../../../../components/admin/AdminShell";
import Loader from "../../../../components/Loader";
import { BookOpen, Plus, FolderOpen, ShieldAlert } from "lucide-react";

export default function KbLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") return s;
    }
    return "light";
  });

  useEffect(() => {
    const handler = () => {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") setTheme(s);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n);
    localStorage.setItem("theme", n);
    toast.info(`Switched to ${n === "dark" ? "Dark" : "Light"} Mode`);
  };

  const isDark = theme === "dark";

  // Derive page title from pathname
  const getTitle = () => {
    if (pathname.includes("/kb/new")) return "New Article";
    if (pathname.includes("/kb/categories")) return "KB Categories";
    if (pathname.includes("/kb/edit")) return "Edit Article";
    if (pathname.includes("/kb/security")) return "Security Events";
    return "Knowledge Base";
  };
  const getDesc = () => {
    if (pathname.includes("/kb/new")) return "Create a new knowledge base article";
    if (pathname.includes("/kb/categories")) return "Manage article categories and classification";
    if (pathname.includes("/kb/edit")) return "Update an existing knowledge base article";
    return "Manage articles, categories, and documentation";
  };

  if (authLoading || !user) {
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'
      }`}>
        <Loader size="xl" theme={isDark ? "dark" : "light"} label="Loading Knowledge Base..." />
      </div>
    );
  }

  // Header actions for the KB section
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push("/admin/dashboard/kb/categories")}
        className={`
          flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all
          ${isDark
            ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]"
            : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"}
        `}
      >
        <FolderOpen className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Categories</span>
      </button>

      {user.role === "ADMIN" && (
        <button
          onClick={() => router.push("/admin/dashboard/kb/security")}
          className={`
            flex items-center gap-1.5 h-9 px-3 rounded-lg border text-sm font-medium transition-all
            ${isDark
              ? "border-white/10 text-slate-400 hover:text-white hover:bg-white/[0.05]"
              : "border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"}
          `}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Security</span>
        </button>
      )}

      <button
        onClick={() => router.push("/admin/dashboard/kb/new")}
        className="admin-btn admin-btn-primary admin-btn-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">New Article</span>
      </button>
    </div>
  );

  return (
    <AdminShell
      user={user}
      onLogout={() => logout("/admin/login")}
      activeTab="kb"
      headerTitle={getTitle()}
      headerDescription={getDesc()}
      isDark={isDark}
      onToggleTheme={toggleTheme}
      headerActions={headerActions}
      onRefresh={() => window.location.reload()}
    >
      {children}
    </AdminShell>
  );
}
