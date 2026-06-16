"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import { useToast } from "../../../../context/ToastContext";
import {
  Server,
  Users,
  Layers,
  BookOpen,
  Ticket,
  Sun,
  Moon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function KbLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  // Sidebar collapsible state synced with localStorage
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      return saved === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  };

  // Theme state synced with localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
    }
    return "light";
  });

  useEffect(() => {
    const handleStorage = () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    toast.info(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const isDark = theme === 'dark';

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  // Determine active tab name for breadcrumbs & sidebar styling
  const getActiveTab = () => {
    if (pathname.includes("/kb/new")) return "new article";
    if (pathname.includes("/kb/categories")) return "categories";
    if (pathname.includes("/kb/edit")) return "edit article";
    return "knowledge base";
  };

  // ── SKELETON LOADING STATE (Matching dashboard/page.tsx layout skeleton) ──
  if (authLoading || !user) {
    const isDarkTheme = typeof window !== "undefined" && localStorage.getItem("theme") === "dark";
    const sk = isDarkTheme ? "skeleton" : "skeleton-light";

    return (
      <div className={`min-h-screen flex font-body select-none transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}>
        <aside className={`w-[280px] border-r p-6 flex flex-col justify-between hidden md:flex shrink-0 ${
          isDarkTheme ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white border-slate-200/80'
        }`}>
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${sk}`}></div>
              <div className={`h-5 w-24 ${sk}`}></div>
            </div>
            <div className="space-y-4">
              <div className={`h-10 w-full ${sk}`}></div>
              <div className={`h-10 w-full ${sk}`}></div>
              <div className={`h-10 w-full ${sk}`}></div>
            </div>
          </div>
          <div className={`h-12 w-full ${sk}`}></div>
        </aside>

        <div className="flex-grow flex flex-col">
          <header className={`h-[72px] border-b px-8 flex items-center justify-between ${
            isDarkTheme ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white border-slate-200/80'
          }`}>
            <div className={`h-6 w-48 ${sk}`}></div>
            <div className={`h-8 w-24 ${sk}`}></div>
          </header>
          <main className="flex-grow p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <div className={`h-32 w-full ${sk}`}></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`h-44 w-full ${sk}`}></div>
              <div className={`h-44 w-full ${sk}`}></div>
              <div className={`h-44 w-full ${sk}`}></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex-1 flex font-body selection:bg-[#38b1f7]/30 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Background cyber grid and glow orbs */}
      <div className={`absolute inset-0 grid-bg pointer-events-none z-0 transition-opacity duration-300 ${
        isDark ? 'opacity-40' : 'opacity-10'
      }`}></div>
      <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] z-0 animate-float-1 pointer-events-none rounded-full blur-[100px] ${
        isDark ? 'bg-[#38b1f7]/15' : 'bg-[#38b1f7]/5'
      }`}></div>
      <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] z-0 animate-float-2 pointer-events-none rounded-full blur-[100px] ${
        isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/3'
      }`}></div>

      {/* ── SIDEBAR NAVIGATION (Matching admin panel sidebar style) ── */}
      <aside className={`border-r p-4 flex flex-col justify-between hidden md:flex shrink-0 z-25 transition-all duration-300 ease-in-out group/sidebar ${
        isSidebarCollapsed 
          ? "w-[76px] hover:w-[280px]" 
          : "w-[280px]"
      } ${
        isDark 
          ? 'bg-[#0F172A]/70 backdrop-blur-md border-[#1E293B] text-[#F8FAFC]' 
          : 'bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-800'
      }`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#38b1f7] flex items-center justify-center shadow-[0_0_15px_rgba(56,177,247,0.4)] shrink-0">
                <span className="font-extrabold text-[#020617] text-md">🛡️</span>
              </div>
              <div className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto" : "opacity-100 w-auto"
              }`}>
                <h2 className={`font-bold text-sm transition-colors whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>Admin Center</h2>
                <p className={`text-[9px] font-mono tracking-wider uppercase whitespace-nowrap ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>OCS Operations</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg border transition-all duration-200 active:scale-95 shrink-0 ${
                isSidebarCollapsed ? "opacity-0 group-hover/sidebar:opacity-100" : "opacity-100"
              } ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => router.push("/admin/dashboard?tab=overview")}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isDark 
                  ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Server className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Console Desk</span>
            </button>
            <button
              onClick={() => router.push("/admin/dashboard?tab=tickets")}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isDark 
                  ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Ticket className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>All Ticket Queue</span>
            </button>
            <button
              onClick={() => router.push("/admin/dashboard?tab=teams")}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isDark 
                  ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Team control</span>
            </button>
            {user.role === "ADMIN" && (
              <>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=clients")}
                  className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isDark 
                      ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4.5 h-4.5 mr-2.5 shrink-0" />
                  <span className={`transition-all duration-300 ${
                    isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
                  }`}>Client Accounts</span>
                </button>
                <button
                  onClick={() => router.push("/admin/dashboard?tab=admins")}
                  className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isDark 
                      ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <ShieldAlert className="w-4.5 h-4.5 mr-2.5 shrink-0" />
                  <span className={`transition-all duration-300 ${
                    isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
                  }`}>Staff Directory</span>
                </button>
              </>
            )}
            <button
              onClick={() => router.push("/admin/dashboard/kb")}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isDark
                  ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                  : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Knowledge Base</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className={`p-3 rounded-xl border flex flex-col space-y-3 transition-colors ${
          isDark ? 'bg-[#111827]/80 border-[#1E293B]' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border ${
              isDark 
                ? 'bg-[#38b1f7]/20 border-[#38b1f7]/20 text-[#38b1f7]' 
                : 'bg-[#38b1f7]/10 border-[#38b1f7]/20 text-[#0d7fc0]'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${
              isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto" : "opacity-100 w-auto"
            }`}>
              <p className={`text-xs font-semibold truncate whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>{user.name}</p>
              <p className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout("/admin/login")}
            className={`w-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all duration-150 active:scale-98 ${
              isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:h-8 py-0" : "opacity-100 h-8 py-2"
            } ${
              isDark 
                ? 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40' 
                : 'text-red-655 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600'
            }`}
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE SHELL ── */}
      <div className="flex-grow flex flex-col overflow-hidden z-10">
        
        {/* Header (Top Bar matching dashboard top header layout) */}
        <header className={`h-[72px] backdrop-blur-md border-b px-8 flex items-center justify-between shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white/80 border-slate-200/80'
        }`}>
          <div>
            <h1 className={`font-bold text-lg tracking-tight capitalize ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
              {getActiveTab()} Panel
            </h1>
            <p className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              Administrative dashboard & operational center
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                isDark 
                  ? 'border-[#1E293B] hover:border-[#38b1f7]/30 text-yellow-400 hover:bg-white/5' 
                  : 'border-slate-200 hover:border-[#38b1f7]/30 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Sync Console / Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className={`p-2 rounded border transition-colors ${
                isDark 
                  ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/30 text-[#94A3B8] hover:text-[#F8FAFC]' 
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            
            {/* Mobile Logout */}
            <button
              onClick={() => logout("/admin/login")}
              className={`md:hidden text-xs font-bold px-3 py-1.5 rounded-lg border ${
                isDark 
                  ? 'bg-[#111827] border-[#1E293B] text-red-400 hover:text-white' 
                  : 'bg-white border-slate-200 text-red-600 hover:bg-slate-55'
              }`}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Dynamic Workspace Scroll View */}
        <main className="flex-grow overflow-y-auto flex flex-col relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
