"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { getCookie } from "../../../lib/cookie";
import {
  ShieldAlert,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Server
} from "lucide-react";

function AdminLoginForm() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get safe redirect path, preventing open redirect vulnerabilities
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

  const decodeJwt = (token: string) => {
    try {
      const payloadBase64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(payloadBase64));
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid administrative email address");
      return;
    }
    if (!password) {
      setError("Security credentials must be provided");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);

    if (result.success) {
      const token = getCookie("accessToken");
      const decoded = token ? decodeJwt(token) : null;
      const role = decoded?.role || "CUSTOMER";

      if (role === "ADMIN") {
        router.push(redirectPath);
      } else {
        // Log out user, ensuring they remain on /admin/login instead of getting routed to /login
        await logout("/admin/login");
        setError("Access denied: Non-administrative accounts cannot access this portal.");
        setIsSubmitting(false);
      }
    } else {
      setError(result.error || "Invalid email or password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex flex-col items-center justify-center relative overflow-hidden grid-bg font-sans select-none selection:bg-[#5FC0F9]/30">
      {/* Dynamic Glowing Ambient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] glow-orb-cyan animate-float-1" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] glow-orb-indigo animate-float-2" />

      {/* Admin Panel Card Wrapper */}
      <div className="w-full max-w-[440px] p-8 md:p-10 z-10 mx-4 glass-card shadow-2xl">
        {/* Terminal Header Decoration */}
        <div className="flex items-center space-x-1.5 mb-8 border-b border-white/[0.05] pb-4 -mt-2">
          <div className="w-3.5 h-3.5 rounded-full mockup-dot-red" />
          <div className="w-3.5 h-3.5 rounded-full mockup-dot-yellow" />
          <div className="w-3.5 h-3.5 rounded-full mockup-dot-green" />
          <span className="text-[10px] text-slate-500 font-mono pl-3 tracking-wider">OCS_SECURE_AUTH v1.4</span>
        </div>

        {/* Card Title & Icon */}
        <div className="flex flex-col items-center text-center space-y-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#38B1F7]/20 to-[#5FC0F9]/30 border border-[#5FC0F9]/40 flex items-center justify-center shadow-lg shadow-[#38B1F7]/10">
            <Server className="w-6 h-6 text-[#5FC0F9]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#F8FAFC]">
              ADMIN CENTER
            </h1>
            <p className="text-[9px] text-[#5FC0F9] mt-1.5 font-mono uppercase tracking-widest">
              Secure Operations Access Only
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-semibold flex items-start space-x-2.5 animate-error-shake shadow-lg">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Admin Identity (Email)
            </label>
            <div className="glass-input-container">
              <input
                id="email"
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="identity@ops.company.com"
                className="glass-input"
              />
              <Mail className="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5 pointer-events-none transition-colors" />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                Security Key (Password)
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] font-bold text-[#5FC0F9] hover:text-[#38B1F7] hover:underline font-mono uppercase tracking-wider transition-colors"
              >
                Forgot key?
              </Link>
            </div>
            <div className="glass-input-container">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isSubmitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="glass-input"
              />
              <Lock className="absolute left-4 top-3.5 text-slate-500 w-4.5 h-4.5 pointer-events-none transition-colors" />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none p-1 rounded-md"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          {/* Submit Action CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-cyber disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin text-[#020617] mr-2" />
                <span>VERIFYING SESSION...</span>
              </>
            ) : (
              <>
                <span>INITIALIZE CONSOLE</span>
                <ArrowRight className="w-4.5 h-4.5 text-[#020617] ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Card Footer Link */}
        <div className="pt-6 mt-6 border-t border-white/[0.04] text-center">
          <Link
            href="/login"
            className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 hover:text-[#5FC0F9] transition-colors"
          >
            ← Exit to Customer Portal
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#5FC0F9]" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
