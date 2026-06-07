"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { 
  User, 
  ShieldAlert, 
  Activity, 
  Cpu, 
  Lock,
  Layers
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030712] relative overflow-hidden grid-bg">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] glow-orb-cyan rounded-full animate-float-1" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] glow-orb-indigo rounded-full animate-float-2" />
        
        <div className="w-80 glass-card p-8 z-10 scanline-overlay text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#6366f1]/20 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(14,165,233,0.15)] animate-pulse">
            <span className="font-black text-white text-md">Ω</span>
          </div>
          <p className="text-[11px] font-mono text-[#64748B] uppercase tracking-widest animate-pulse">
            Reading Session Data...
          </p>
          <div className="space-y-2 pt-2">
            <div className="h-2 w-3/4 bg-[#1E293B] rounded-full mx-auto skeleton"></div>
            <div className="h-2 w-1/2 bg-[#1E293B] rounded-full mx-auto skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#5FC0F9]/30 selection:text-white relative overflow-hidden grid-bg">
      {/* Glow Orbs */}
      <div className="absolute top-1/10 left-1/10 w-[500px] h-[500px] glow-orb-cyan rounded-full animate-float-1" />
      <div className="absolute bottom-1/10 right-1/10 w-[500px] h-[500px] glow-orb-indigo rounded-full animate-float-2" />

      {/* Top Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#1E293B]/60 z-10 relative">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-[0_0_15px_rgba(14,165,233,0.25)]">
            <span className="font-black text-white text-md tracking-wider">Ω</span>
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-[#F8FAFC]">
              OCS Desk
            </h1>
            <p className="text-[9px] text-[#5FC0F9] font-mono tracking-wider uppercase font-semibold">Helpdesk Portal</p>
          </div>
        </div>

        {/* Real-time system health banner */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F172A]/80 border border-[#1E293B] text-[10px] font-mono text-emerald-400">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>ALL DISPATCH QUEUES OPERATIONAL</span>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn-cyber h-9 px-4 text-xs shadow-none border border-transparent"
          >
            Register Portal
          </Link>
        </nav>
      </header>

      {/* Hero & Metrics Body */}
      <main className="max-w-5xl mx-auto w-full px-6 py-16 md:py-24 z-10 flex-grow flex flex-col justify-center items-center text-center">
        
        {/* Minimal Dispatch Indicator */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#0F172A]/70 border border-[#1E293B] text-[#5FC0F9] text-[11px] font-semibold mb-8 backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
          <Activity className="w-3.5 h-3.5" />
          <span className="tracking-wide uppercase font-mono text-[10px]">SLA monitoring system initialized</span>
        </div>

        {/* Minimal Hero Headline */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-tight max-w-3xl bg-clip-text text-transparent bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#94A3B8]">
          Single point of dispatch.<br className="hidden md:block"/> Resolved in real-time.
        </h2>

        {/* Minimalist Subtext */}
        <p className="text-sm md:text-base text-[#94A3B8] max-w-xl mb-12 font-medium leading-relaxed">
          High-integrity routing engine for customer request ticket lifecycles. Designed to enforce strict operational SLA guidelines.
        </p>

        {/* Minimalist Key Stats */}
        <div className="grid grid-cols-3 gap-4 md:gap-10 w-full max-w-2xl px-6 py-6 mb-16 rounded-2xl bg-[#030712]/40 border border-[#1E293B]/60 backdrop-blur-sm font-mono">
          <div className="text-center">
            <span className="block text-xl md:text-2xl font-black text-[#5FC0F9]">99.98%</span>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">SLA Compliance</span>
          </div>
          <div className="text-center border-x border-[#1E293B]/60">
            <span className="block text-xl md:text-2xl font-black text-white">&lt; 4m</span>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Avg Dispatch</span>
          </div>
          <div className="text-center">
            <span className="block text-xl md:text-2xl font-black text-[#5FC0F9]">Active</span>
            <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Queue Routing</span>
          </div>
        </div>

        {/* Portal Access Selection */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl">
          {/* Customer Portal */}
          <div className="glass-card p-8 flex flex-col justify-between text-left hover:border-[#5FC0F9]/30 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#5FC0F9] mb-6 group-hover:border-[#5FC0F9]/30 transition-colors">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold mb-2 text-[#F8FAFC]">Customer Desk</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                Register a client account, initialize query tickets, log response intervals, and keep track of live assignments.
              </p>
            </div>
            <Link
              href="/register"
              className="btn-cyber w-full group-hover:filter group-hover:brightness-105"
            >
              <span>Initialize Client Portal</span>
            </Link>
          </div>

          {/* Admin / Agent Desk */}
          <div className="glass-card p-8 flex flex-col justify-between text-left hover:border-[#6366f1]/30 transition-all duration-300 group">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#6366f1] mb-6 group-hover:border-[#6366f1]/30 transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold mb-2 text-[#F8FAFC]">Agent Console</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                Access administrative controls to manage queue assignments, update service thresholds, and moderate active query databases.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-[48px] px-6 bg-transparent border border-[#1E293B] text-[#F8FAFC] font-bold text-xs rounded-xl hover:bg-white/5 hover:border-[#6366f1]/30 transition-all duration-200"
            >
              <span>Access Operations Desk</span>
            </Link>
          </div>
        </div>

        {/* Clean Tech Spec Indicators */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-3xl border-t border-[#1E293B]/60 pt-10 text-[11px] font-mono text-[#64748B]">
          <div className="flex items-center justify-center space-x-2">
            <Layers className="w-3.5 h-3.5 text-[#5FC0F9]" />
            <span>Role-Based ACL</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Cpu className="w-3.5 h-3.5 text-[#5FC0F9]" />
            <span>Google SMTP Node</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-3.5 h-3.5 text-[#5FC0F9]" />
            <span>JWT Session Layer</span>
          </div>
        </div>

      </main>

      {/* Clean Enterprise Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between border-t border-[#1E293B]/60 text-[10px] text-[#64748B] font-mono z-10 relative gap-3">
        <p>© 2026 OCS Helpdesk. Secure Enterprise Operations Desk.</p>
        <div className="flex space-x-6 text-[9px] uppercase tracking-wider font-semibold">
          <span>Prisma Engine</span>
          <span>Next.js 15 Turbopack</span>
          <span>Node TLS SMTP</span>
        </div>
      </footer>
    </div>
  );
}
