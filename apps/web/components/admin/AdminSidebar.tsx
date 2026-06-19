"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Layers,
  BookOpen,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  UserCog,
  Clock,
  BarChart2,
  Settings,
} from "lucide-react";

type ActiveTab =
  | "overview"
  | "tickets"
  | "teams"
  | "clients"
  | "admins"
  | "kb"
  | "routing"
  | "credits"
  | "sla"
  | string;

interface AdminSidebarProps {
  user: { name: string; role: string };
  activeTab: ActiveTab;
  onTabChange?: (tab: string) => void;
  onLogout: () => void;
  isDark: boolean;
}

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "/admin/dashboard?tab=overview" },
  { id: "tickets", label: "Ticket Queue", icon: Ticket, href: "/admin/dashboard?tab=tickets" },
  { id: "teams", label: "Teams", icon: Layers, href: "/admin/dashboard?tab=teams" },
];

const ADMIN_NAV_ITEMS = [
  { id: "clients", label: "Client Accounts", icon: Users, href: "/admin/dashboard?tab=clients" },
  { id: "admins", label: "Staff Directory", icon: UserCog, href: "/admin/dashboard?tab=admins" },
  { id: "routing", label: "Categories & Routing", icon: Settings, href: "/admin/dashboard?tab=routing" },
  { id: "permissions", label: "Role Permissions", icon: ShieldCheck, href: "/admin/dashboard?tab=permissions" },
  { id: "credits", label: "Client Credits", icon: Clock, href: "/admin/dashboard?tab=credits" },
  { id: "sla", label: "SLA Metrics", icon: BarChart2, href: "/admin/dashboard?tab=sla" },
];

const KB_ITEM = { id: "kb", label: "Knowledge Base", icon: BookOpen, href: "/admin/dashboard/kb" };

export default function AdminSidebar({
  user,
  activeTab,
  onTabChange,
  onLogout,
  isDark,
}: AdminSidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("admin_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_sidebar_collapsed", String(next));
    }
  };

  const navigate = (href: string, tabId: string) => {
    if (onTabChange && !href.includes("kb")) {
      onTabChange(tabId);
    } else {
      router.push(href);
    }
  };

  const isActive = (id: string) => {
    if (id === "kb") return activeTab === "kb" || (typeof window !== "undefined" && window.location.pathname.includes("/kb"));
    return activeTab === id;
  };

  return (
    <aside
      className={`
        admin-sidebar flex flex-col border-r shrink-0 z-30 relative
        hidden md:flex
        ${isCollapsed ? "w-[68px]" : "w-[240px]"}
        ${isDark
          ? "bg-[#0c1525]/80 backdrop-blur-md border-white/[0.06]"
          : "bg-white border-slate-200/80"}
      `}
    >
      {/* ── Brand Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-inherit h-[64px] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          <div
            className="w-8 h-8 rounded-xl bg-[#38b1f7] flex items-center justify-center shadow-lg shadow-[#38b1f7]/25 shrink-0"
            aria-hidden="true"
          >
            <ShieldCheck className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className={`text-sm font-bold leading-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                Admin Center
              </p>
              <p className={`text-[10px] leading-tight truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                OCS Helpdesk
              </p>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapse}
          className={`
            p-1.5 rounded-lg border shrink-0 transition-all duration-150
            ${isDark
              ? "border-white/10 text-slate-500 hover:text-white hover:bg-white/[0.06]"
              : "border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100"}
          `}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />
          }
        </button>
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <nav className={`flex-1 ${isCollapsed ? "overflow-y-visible" : "overflow-y-auto overflow-x-hidden"} px-3 py-3 space-y-0.5`}>
        {/* Main nav */}
        {!isCollapsed && (
          <p className="admin-section-label">Main</p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            active={isActive(item.id)}
            collapsed={isCollapsed}
            isDark={isDark}
            onClick={() => navigate(item.href, item.id)}
          />
        ))}

        {/* Admin-only nav */}
        {user.role === "ADMIN" && (
          <>
            {!isCollapsed && (
              <p className="admin-section-label">Administration</p>
            )}
            {ADMIN_NAV_ITEMS.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={isActive(item.id)}
                collapsed={isCollapsed}
                isDark={isDark}
                onClick={() => navigate(item.href, item.id)}
              />
            ))}
          </>
        )}

        {/* KB Section */}
        {!isCollapsed && (
          <p className="admin-section-label">Content</p>
        )}
        <NavItem
          item={KB_ITEM}
          active={isActive("kb")}
          collapsed={isCollapsed}
          isDark={isDark}
          onClick={() => router.push(KB_ITEM.href)}
        />
      </nav>

      {/* ── User Profile & Logout ─────────────────────────────────── */}
      <div className={`
        px-3 py-3 border-t shrink-0
        ${isDark ? "border-white/[0.06]" : "border-slate-100"}
      `}>
        <div className={`
          flex items-center gap-3 p-2.5 rounded-xl
          ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}
          ${isCollapsed ? "justify-center" : ""}
        `}>
          {/* Avatar */}
          <div
            className={`
              w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0
              ${isDark
                ? "bg-[#38b1f7]/15 text-[#5fc0f9] border border-[#38b1f7]/20"
                : "bg-[#38b1f7]/10 text-[#0d7fc0] border border-[#38b1f7]/15"}
            `}
            title={isCollapsed ? user.name : undefined}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>

          {!isCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {user.name}
                </p>
                <p className={`text-[11px] truncate leading-tight ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {user.role}
                </p>
              </div>

              <button
                onClick={onLogout}
                className={`
                  p-1.5 rounded-lg border transition-all shrink-0
                  ${isDark
                    ? "border-red-500/20 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/30"
                    : "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"}
                `}
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>

        {isCollapsed && (
          <button
            onClick={onLogout}
            className={`
              mt-2 w-full p-2 rounded-lg border transition-all flex items-center justify-center
              ${isDark
                ? "border-red-500/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/30"
                : "border-red-200 text-red-500 hover:bg-red-50"}
            `}
            title="Logout"
            aria-label="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}

/* ── Nav Item Sub-component ───────────────────────────────────────── */
interface NavItemProps {
  item: { id: string; label: string; icon: React.ElementType; href: string };
  active: boolean;
  collapsed: boolean;
  isDark: boolean;
  onClick: () => void;
}

function NavItem({ item, active, collapsed, isDark, onClick }: NavItemProps) {
  const Icon = item.icon;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative flex items-center w-full"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        className={`
          admin-nav-item w-full
          ${active ? "admin-nav-item-active" : ""}
          ${isDark ? "admin-dark" : ""}
          ${collapsed ? "justify-center px-0" : ""}
        `}
      >
        <Icon
          className={`w-[18px] h-[18px] shrink-0 ${collapsed ? "" : "mr-2.5"} ${active ? "text-[#38b1f7]" : ""}`}
          strokeWidth={active ? 2.5 : 2}
          aria-hidden="true"
        />
        {!collapsed && (
          <span className="truncate">{item.label}</span>
        )}
      </button>

      {collapsed && showTooltip && (
        <div 
          className={`absolute left-[54px] z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xl whitespace-nowrap pointer-events-none tooltip-premium-animate ${
            isDark 
              ? "bg-[#0c1525]/95 border-white/[0.08] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)]" 
              : "bg-white/95 border-slate-200/80 text-slate-800 shadow-[0_4px_16px_rgba(148,163,184,0.15)]"
          }`}
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Arrow Pointer */}
          <div 
            className={`absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-y-transparent border-r-[5px] ${
              isDark ? "border-r-[#0c1525]/95" : "border-r-white/95"
            }`}
            style={{ marginRight: "-1px" }}
          />
          {/* Accent Color Bar */}
          <div className="w-1 h-3 rounded-full bg-[#38b1f7] shrink-0" />
          <span>{item.label}</span>
        </div>
      )}
    </div>
  );
}
