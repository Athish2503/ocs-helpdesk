"use client";

import { useAuth } from "../../../context/AuthContext";

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();

  const formatJoinedDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // ── SKELETON LOADING STATE (Mandated: No full-page blocking spinners) ─────
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex font-sans select-none">
        {/* Sidebar Skeleton */}
        <aside className="w-[280px] bg-[#0F172A] border-r border-[#1E293B] p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg skeleton"></div>
              <div className="h-5 w-24 skeleton"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full skeleton"></div>
              <div className="h-10 w-full skeleton"></div>
              <div className="h-10 w-full skeleton"></div>
            </div>
          </div>
          <div className="h-12 w-full skeleton"></div>
        </aside>

        {/* Content Shell Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar Skeleton */}
          <header className="h-[72px] bg-[#0F172A] border-b border-[#1E293B] px-8 flex items-center justify-between">
            <div className="h-6 w-48 skeleton"></div>
            <div className="h-8 w-24 skeleton"></div>
          </header>

          {/* Main Dashboard Space Skeleton */}
          <main className="flex-grow p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <div className="h-32 w-full skeleton"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-44 w-full skeleton"></div>
              <div className="h-44 w-full skeleton"></div>
              <div className="h-44 w-full skeleton"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex font-sans selection:bg-[#5FC0F9]/30">
      {/* 1. Sidebar Navigation (Width: 280px) */}
      <aside className="w-[280px] bg-[#0F172A] border-r border-[#1E293B] p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#5FC0F9] flex items-center justify-center shadow-md">
              <span className="font-extrabold text-[#020617] text-md">🛡️</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#F8FAFC]">Admin Center</h2>
              <p className="text-[9px] text-[#5FC0F9] font-mono tracking-wider uppercase">OCS Operations</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <LinkHelper href="#" label="Console Desk" active={true} icon="📊" />
            <LinkHelper href="#" label="All Ticket Queue" active={false} icon="📥" badge="Locked" />
            <LinkHelper href="#" label="SLA Control Panel" active={false} icon="⚡" badge="Locked" />
            <LinkHelper href="#" label="Global Settings" active={false} icon="⚙️" />
          </nav>
        </div>

        {/* Sidebar Bottom Profile Section */}
        <div className="p-3 rounded-xl bg-[#111827] border border-[#1E293B] flex flex-col space-y-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center text-sm font-bold text-red-400">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user.name}</p>
              <p className="text-[9px] text-red-400 font-mono uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full h-8 flex items-center justify-center text-[11px] font-bold text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-150 active:scale-98"
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* 2. Main Work Shell */}
      <div className="flex-grow flex flex-col overflow-hidden">
        {/* Top Bar Navigation (Height: 72px) */}
        <header className="h-[72px] bg-[#0F172A] border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg text-[#F8FAFC]">Console Desk</h1>
            <p className="text-[10px] text-[#94A3B8]">Administrative queues & operations</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-red-950/40 border border-red-500/20 text-red-300 text-[11px] font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-red-455 animate-pulse"></span>
              <span>ADMINISTRATIVE ROOT</span>
            </div>
            {/* Small Mobile Logout */}
            <button
              onClick={() => logout()}
              className="md:hidden text-xs font-bold px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1E293B] text-red-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </header>

        {/* 3. Dashboard Scroll Area (Max-Width: 1440px) */}
        <main className="flex-grow overflow-y-auto p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Welcome Announcement Board */}
          <section className="ocs-card p-8 bg-gradient-to-tr from-[#0F172A] to-[#111827] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm border-red-500/25">
            <div className="space-y-2">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#F8FAFC]">
                Welcome to OCS Admin Console, <span className="text-[#5FC0F9]">{user.name}</span>
              </h2>
              <p className="text-[#94A3B8] text-sm max-w-xl">
                This space allows support supervisor access to dispatch tasks, audit active support pipelines, adjust agent assignments, and define SLAs.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-350 text-xs font-mono font-semibold">
              ROLE: {user.role}
            </div>
          </section>

          {/* Cards metrics system */}
          <section className="grid md:grid-cols-3 gap-6">
            {/* Session details */}
            <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Admin Details</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">E-mail Account:</span>
                    <span className="text-[#F8FAFC] font-medium">{user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94A3B8]">Registration date:</span>
                    <span className="text-[#F8FAFC] font-medium">{formatJoinedDate(user.createdAt)}</span>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-[#94A3B8] font-mono pt-4 border-t border-white/[0.03]">
                ID: {user.id}
              </div>
            </div>

            {/* Metric Box 1 */}
            <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Assigned Support Tickets</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.03]">Sprint 2</span>
                </div>
                <p className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">0</p>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Supervision metrics and incoming ticket queues will active during **Sprint 2** builds.
              </p>
            </div>

            {/* Metric Box 2 */}
            <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Active Agents Online</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#ECFDF3] text-[#12B76A] border border-[#D1FADF]/10">1 Online</span>
                </div>
                <p className="text-3xl font-extrabold text-[#5FC0F9] tracking-tight">1</p>
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Represents active administrative and client session tokens currently listening.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/**
 * Sidebar Navigation Link Component
 */
function LinkHelper({
  href,
  label,
  active,
  icon,
  badge,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: string;
  badge?: string;
}) {
  return (
    <a
      href={href}
      className={`h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide transition-colors ${
        active
          ? "bg-[#1E293B] text-[#5FC0F9]"
          : "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
      }`}
    >
      <div className="flex items-center space-x-2.5">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {badge && (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.03]">
          {badge}
        </span>
      )}
    </a>
  );
}
