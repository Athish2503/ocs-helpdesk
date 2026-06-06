"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

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
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center space-y-4">
          {/* Skeleton representation of loading card */}
          <div className="w-80 h-32 ocs-card p-6 flex flex-col justify-between">
            <div className="h-6 w-2/3 skeleton"></div>
            <div className="h-4 w-full skeleton"></div>
            <div className="h-4 w-1/2 skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex flex-col justify-between font-sans selection:bg-[#5FC0F9]/30 selection:text-white">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-[#1E293B]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#5FC0F9] flex items-center justify-center shadow-md">
            <span className="font-extrabold text-[#020617] text-md tracking-wider">Ω</span>
          </div>
          <div>
            <h1 className="font-bold text-md tracking-tight text-[#F8FAFC]">
              OCS Helpdesk
            </h1>
            <p className="text-[10px] text-[#5FC0F9] font-mono tracking-wider uppercase">Design System v1</p>
          </div>
        </div>

        <nav className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-medium text-[#CBD5E1] hover:text-white transition-colors duration-150"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold h-10 px-4 rounded-lg bg-[#5FC0F9] text-[#020617] flex items-center justify-center transition-all duration-150 hover:bg-[#38B1F7] hover:scale-102 active:scale-98"
          >
            Register
          </Link>
        </nav>
      </header>

      {/* Hero Body */}
      <main className="max-w-5xl mx-auto w-full px-6 py-20 flex-grow flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0F172A] border border-[#1E293B] text-[#5FC0F9] text-xs font-semibold mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5FC0F9]"></span>
          <span>Authentication System Integrated</span>
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-[#F8FAFC] max-w-3xl">
          Enterprise support desk operations,{" "}
          <span className="text-[#5FC0F9]">
            simplified.
          </span>
        </h2>

        <p className="text-base md:text-lg text-[#94A3B8] max-w-2xl mb-12 font-normal leading-relaxed">
          High-efficiency customer request logging and role-assigned ticket tracking. Fully aligned with enterprise SLA constraints.
        </p>

        {/* Portal Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-3xl mb-12">
          {/* Customer Portal Card */}
          <div className="ocs-card ocs-card-interactive p-8 flex flex-col justify-between text-left">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#5FC0F9] text-lg font-bold mb-6">
                👤
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#F8FAFC]">Customer Portal</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
                Register as a customer, submit query tickets, track assignment status, and communicate directly with support representatives.
              </p>
            </div>
            <Link
              href="/register"
              className="btn-primary w-full"
            >
              Sign Up as Customer
            </Link>
          </div>

          {/* Admin Portal Card */}
          <div className="ocs-card ocs-card-interactive p-8 flex flex-col justify-between text-left">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#5FC0F9] text-lg font-bold mb-6">
                🛡️
              </div>
              <h3 className="text-lg font-bold mb-2 text-[#F8FAFC]">Agent & Admin Desk</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
                Access administrative controls to assign tickets, update SLA definitions, manage agent lines, and verify registration databases.
              </p>
            </div>
            <Link
              href="/login"
              className="btn-secondary w-full"
            >
              Sign In to Agent Portal
            </Link>
          </div>
        </div>
      </main>

      {/* Clean Enterprise Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-t border-[#1E293B] text-xs text-[#94A3B8]">
        <p>© 2026 OCS Helpdesk. Enterprise Platform.</p>
        <div className="flex space-x-6">
          <span>Prisma v7</span>
          <span>Next.js 15</span>
          <span>Express.js</span>
        </div>
      </footer>
    </div>
  );
}
