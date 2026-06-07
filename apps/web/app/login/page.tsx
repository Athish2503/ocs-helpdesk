"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  Terminal,
  ArrowRight
} from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      const getCookie = (name: string): string | null => {
        if (typeof document === "undefined") return null;
        const nameEQ = name + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === " ") c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
      };
      
      const decodeJwt = (token: string) => {
        try {
          const payloadBase64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
          return JSON.parse(atob(payloadBase64));
        } catch {
          return null;
        }
      };

      const token = getCookie("accessToken");
      const decoded = token ? decodeJwt(token) : null;
      const role = decoded?.role || "CUSTOMER";

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } else {
      setError(result.error || "Invalid email or password.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#5FC0F9]/30 relative overflow-hidden grid-bg">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] glow-orb-cyan rounded-full animate-float-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] glow-orb-indigo rounded-full animate-float-2" />

      {/* Main Container */}
      <div className="w-full max-w-[420px] z-10">
        
        {/* Portal Home Navigation */}
        <div className="mb-6 flex justify-start">
          <Link href="/" className="inline-flex items-center space-x-2 text-xs font-semibold text-[#94A3B8] hover:text-[#5FC0F9] transition-colors group">
            <span className="p-1.5 rounded-md bg-[#0F172A] border border-[#1E293B] group-hover:border-[#5FC0F9]/40 group-hover:bg-[#5FC0F9]/5 transition-all">
              <Terminal className="w-3.5 h-3.5" />
            </span>
            <span>Return to Main Terminal</span>
          </Link>
        </div>

        {/* Logo and Greeting Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0ea5e9] to-[#6366f1] flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:scale-105 transition-transform duration-200 mb-4">
            <span className="font-black text-white text-lg tracking-wider">Ω</span>
          </Link>
          <h1 className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#F8FAFC] to-[#CBD5E1]">
            Sign in to Desk
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 font-medium">
            Enter security credentials to access OCS Helpdesk
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-card p-8 md:p-10 shadow-2xl relative">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Animated Error Alert */}
            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-[#FEF3F2] text-xs font-medium flex items-start space-x-2.5 animate-error-shake shadow-[0_4px_12px_rgba(239,68,68,0.1)]">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Console Identity / Email
              </label>
              <div className="glass-input-container">
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="glass-input"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 transition-colors pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  System Access Code
                </label>
              </div>
              <div className="glass-input-container">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pr-12"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 transition-colors pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#F8FAFC] transition-colors focus:outline-none p-1 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-cyber w-full flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-900" />
                  <span className="text-slate-900">Establishing Link...</span>
                </>
              ) : (
                <>
                  <span>Initialize Connection</span>
                  <ArrowRight className="w-4 h-4 text-slate-900 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Registration Redirect Link */}
          <div className="mt-8 pt-6 border-t border-[#1E293B]/60 text-center text-xs text-[#94A3B8]">
            Need credentials?{" "}
            <Link href="/register" className="font-bold text-[#5FC0F9] hover:text-[#38B1F7] hover:underline underline-offset-4 transition-colors">
              Request access key
            </Link>
          </div>
        </div>

        {/* Small security footer */}
        <p className="text-center text-[10px] text-[#64748B] mt-8 font-mono">
          SECURE PROTOCOL // SSL-465 // IP TRACED
        </p>

      </div>
    </div>
  );
}
