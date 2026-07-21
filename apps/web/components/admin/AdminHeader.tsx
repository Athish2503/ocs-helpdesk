"use client";

import React, { useState } from "react";
import { Sun, Moon, RefreshCw, LogOut } from "lucide-react";
import LogoutTransition from "../LogoutTransition";
import OcsLogo from "../OcsLogo";

interface AdminHeaderProps {
  title: string;
  description?: string;
  isDark: boolean;
  isLoading?: boolean;
  onToggleTheme: () => void;
  onRefresh?: () => void;
  onLogout?: () => void;
  user?: { name: string; role: string; permissions?: string[] };
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
  user,
  children,
}: AdminHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  return (
    <>
      <header
        className={`
          h-[64px] flex items-center justify-between px-6 shrink-0 border-b
          ${isDark
            ? "bg-[#0c1525]/80 backdrop-blur-md border-white/[0.06]"
            : "bg-white/90 backdrop-blur-md border-slate-200"}
        `}
      >
        {/* Left: Title & Mobile Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <div className="md:hidden shrink-0">
            <OcsLogo className="h-6 w-auto" color="#38b1f7" />
          </div>
          <div className="min-w-0 flex-1">
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
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
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

          {/* User Profile & Logout (Top Right Corner) */}
          {(user || onLogout) && (
            <>
              <div className={`h-6 w-[1px] ${isDark ? "bg-white/10" : "bg-slate-200"} mx-0.5`} />

              {user && (
                <div className="flex items-center gap-2 px-1">
                  <div
                    className={`
                      w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border
                      ${isDark
                        ? "bg-[#38b1f7]/15 text-[#5fc0f9] border-[#38b1f7]/20"
                        : "bg-[#38b1f7]/10 text-[#0d7fc0] border-[#38b1f7]/15"}
                    `}
                    title={user.name}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : "A"}
                  </div>

                  <div className="hidden sm:flex flex-col min-w-0 max-w-[140px]">
                    <span className={`text-xs font-bold truncate leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                      {user.name}
                    </span>
                    <span className={`text-[10px] truncate leading-tight uppercase font-mono tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => setIsLoggingOut(true)}
                  className={`
                    px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer shadow-sm
                    ${isDark
                      ? "bg-slate-800/80 hover:bg-rose-600/90 text-slate-300 hover:text-white border-slate-700/60 hover:border-rose-500/50"
                      : "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-300"}
                  `}
                  title="Logout from Admin Center"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5 opacity-80" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </>
          )}
        </div>
      </header>

      {/* Clean Full-Screen Logout Transition */}
      {onLogout && (
        <LogoutTransition
          isLoggingOut={isLoggingOut}
          onComplete={() => onLogout()}
          isDark={isDark}
        />
      )}
    </>
  );
}
