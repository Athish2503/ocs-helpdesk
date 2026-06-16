"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { getCookie } from "../../../lib/cookie";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Ticket,
} from "lucide-react";
import Loader from "../../../components/Loader";

function AdminLoginForm() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawRedirect = searchParams.get("redirect");
  const redirectPath =
    rawRedirect && rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
      ? rawRedirect
      : "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") return s;
    }
    return "light";
  });
  const isDark = theme === "dark";

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [isDark]);

  const toggleTheme = () => {
    const n = isDark ? "light" : "dark";
    setTheme(n);
    localStorage.setItem("theme", n);
  };

  const decodeJwt = (token: string) => {
    try {
      const b = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(b));
    } catch { return null; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid administrative email address.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success) {
      const token = getCookie("accessToken");
      const decoded = token ? decodeJwt(token) : null;
      const role = decoded?.role || "CUSTOMER";
      if (role === "ADMIN" || role === "AGENT") {
        router.push(redirectPath);
      } else {
        await logout("/admin/login");
        setError("Access denied. This portal is restricted to administrative accounts.");
        setIsSubmitting(false);
      }
    } else {
      setError(result.error || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen flex font-body transition-colors duration-200 ${isDark ? "bg-[#020617] text-white" : "bg-slate-50 text-slate-800"}`}>

      {/* ── Left Branding Panel ─────────────────────────────────── */}
      <div className={`hidden md:flex md:w-[42%] flex-col justify-between p-12 lg:p-16 relative overflow-hidden ${isDark ? "bg-[#0c1525]" : "bg-[#38b1f7]"}`}>
        {/* Subtle radial gradient */}
        <div className={`absolute inset-0 pointer-events-none ${isDark ? "bg-[radial-gradient(circle_at_top_right,rgba(56,177,247,0.12),transparent_65%)]" : "bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_60%)]"}`} />
        {/* Grid overlay */}
        <div className={`absolute inset-0 grid-bg pointer-events-none ${isDark ? "opacity-25" : "opacity-10"}`} />

        {/* Logo */}
        <Link href="/" className="z-10">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${isDark ? "bg-[#38b1f7] shadow-[#38b1f7]/25" : "bg-white shadow-white/30"}`}>
              <Ticket className={`w-5 h-5 ${isDark ? "text-white" : "text-[#38b1f7]"}`} />
            </div>
            <span className={`font-extrabold text-xl tracking-tight font-display ${isDark ? "text-white" : "text-white"}`}>
              OCS Helpdesk
            </span>
          </div>
        </Link>

        {/* Marketing copy */}
        <div className="my-auto space-y-5 z-10 max-w-md">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${isDark ? "bg-[#38b1f7]/15 border border-[#38b1f7]/20" : "bg-white/15 border border-white/20"}`}>
            <ShieldCheck className={`w-6 h-6 ${isDark ? "text-[#5fc0f9]" : "text-white"}`} />
          </div>
          <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight font-display ${isDark ? "text-white" : "text-white"}`}>
            Admin Center Portal
          </h1>
          <p className={`text-sm lg:text-base leading-relaxed ${isDark ? "text-slate-400" : "text-white/80"}`}>
            Manage support systems, oversee agent activity, and configure enterprise workflows.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {["Ticket Management", "Team Control", "Knowledge Base", "Analytics"].map(f => (
              <span key={f} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${isDark ? "border-white/10 bg-white/[0.04] text-slate-300" : "border-white/25 bg-white/10 text-white"}`}>
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className={`text-xs z-10 ${isDark ? "text-slate-600" : "text-white/60"}`}>
          &copy; {new Date().getFullYear()} OCS Helpdesk — All rights reserved.
        </p>
      </div>

      {/* ── Right Form Panel ──────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-h-screen ${isDark ? "bg-[#020617]" : "bg-white"}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile logo */}
          <Link href="/" className="md:hidden flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#38b1f7] flex items-center justify-center shadow shadow-[#38b1f7]/25">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <span className={`font-bold text-base font-display ${isDark ? "text-white" : "text-slate-900"}`}>OCS Helpdesk</span>
          </Link>
          <div className="hidden md:block" />

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-all ${isDark ? "border-white/10 text-amber-400 hover:bg-white/[0.05]" : "border-slate-200 text-slate-500 hover:bg-slate-100"}`}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[400px] space-y-8">

            {/* Header */}
            <div>
              <h2 className={`text-2xl font-extrabold tracking-tight font-display ${isDark ? "text-white" : "text-slate-900"}`}>
                Welcome back
              </h2>
              <p className={`text-sm mt-1.5 ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                Sign in to the administrative console.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${isDark ? "bg-red-950/30 border-red-500/25 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className={`block text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@company.com"
                    autoComplete="email"
                    className={`admin-input ${isDark ? "admin-dark" : ""}`}
                    style={{ paddingLeft: 44 }}
                  />
                  <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className={`block text-sm font-semibold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Password
                  </label>
                  <Link href="/forgot-password" className={`text-xs font-medium hover:underline ${isDark ? "text-[#5fc0f9]" : "text-[#0d7fc0]"}`}>
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isSubmitting}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`admin-input ${isDark ? "admin-dark" : ""}`}
                    style={{ paddingLeft: 44, paddingRight: 44 }}
                  />
                  <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors ${isDark ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="admin-btn admin-btn-primary w-full h-12 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader size={18} variant="inline" contrast={true} />
                    Verifying…
                  </>
                ) : (
                  <>
                    Sign in to Admin Console
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className={`pt-5 border-t text-center text-sm ${isDark ? "border-white/[0.06] text-slate-600" : "border-slate-100 text-slate-400"}`}>
              Looking for the customer portal?{" "}
              <Link href="/login" className={`font-semibold hover:underline ${isDark ? "text-[#5fc0f9]" : "text-[#38b1f7]"}`}>
                Customer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#020617] flex items-center justify-center transition-colors duration-200">
        <Loader size="lg" theme="auto" label="Loading portal..." />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
