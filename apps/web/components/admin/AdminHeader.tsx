"use client";

import React from "react";
import { Sun, Moon, RefreshCw, LogOut } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  description?: string;
  isDark: boolean;
  isLoading?: boolean;
  onToggleTheme: () => void;
  onRefresh?: () => void;
  onLogout?: () => void;
  children?: React.ReactNode; // extra right-side actions
}

export default function AdminHeader({
  title,
  description,
  isDark,
  isLoading,
  onToggleTheme,
  onRefresh,
  onLogout,
  children,
}: AdminHeaderProps) {
  return (
    <header
      className={`
        h-[64px] flex items-center justify-between px-6 shrink-0 border-b
        ${isDark
          ? "bg-[#0c1525]/80 backdrop-blur-md border-white/[0.06]"
          : "bg-white/90 backdrop-blur-md border-slate-200"}
      `}
    >
      {/* Left: Title */}
      <div className="min-w-0 flex-1 mr-4">
        <h1
          className={`text-base font-bold leading-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}
        >
          {title}
        </h1>
        {description && (
          <p className={`text-xs leading-tight truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {description}
          </p>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {children}

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`
            p-2 rounded-lg border transition-all duration-150 active:scale-95
            ${isDark
              ? "border-white/10 text-amber-400 hover:bg-white/[0.05] hover:border-white/20"
              : "border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"}
          `}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Refresh */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`
              p-2 rounded-lg border transition-all duration-150 active:scale-95 disabled:opacity-50
              ${isDark
                ? "border-white/10 text-slate-400 hover:bg-white/[0.05] hover:text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800"}
            `}
            title="Refresh data"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#38b1f7]" : ""}`} />
          </button>
        )}

        {/* Mobile logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            className={`
              md:hidden p-2 rounded-lg border transition-all
              ${isDark
                ? "border-red-500/25 text-red-400 hover:bg-red-950/20"
                : "border-red-200 text-red-500 hover:bg-red-50"}
            `}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
