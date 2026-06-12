"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { getCookie } from "../../../lib/cookie";
import {
  Ticket,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 selection:bg-[#38b1f7]/10 selection:text-[#005d89]">
      {/* Left Panel - Hero Branding */}
      <div className="hidden md:flex md:w-[45%] bg-[#38b1f7] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden select-none">
        {/* Subtle Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
        
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center space-x-3 z-10 cursor-pointer">
            <div className="w-9 h-9 bg-white flex items-center justify-center rounded-lg shadow-md">
              <Ticket className="w-5.5 h-5.5 text-[#38b1f7]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white font-display">OCS Helpdesk</span>
          </div>
        </Link>

        {/* Marketing Copy */}
        <div className="my-auto space-y-6 z-10 max-w-md">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white font-display">
            Admin Center Portal.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/90 leading-relaxed font-body">
            Manage support systems, oversee agent activity, and configure enterprise workflows with advanced administration tools.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Form Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Welcome back, Admin
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
              Please enter your credentials to access the administrative dashboard.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start space-x-2.5 animate-error-shake shadow-sm">
                <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                Admin Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@company.com"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                />
                <Mail className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                  Security Key (Password)
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs font-semibold text-[#005d89] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 pl-11 pr-12 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                />
                <Lock className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 rounded-md"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Device */}
            <div className="flex items-center">
              <input
                id="remember-device"
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-[#005d89] focus:ring-[#005d89] cursor-pointer"
              />
              <label htmlFor="remember-device" className="ml-2 block text-xs text-slate-600 font-semibold select-none cursor-pointer">
                Remember this device for 30 days
              </label>
            </div>

            {/* Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-[#38b1f7] hover:bg-[#004b70] text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#005d89]/25 hover:shadow-xl hover:shadow-[#005d89]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                  <span>Verifying Session...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Admin Console</span>
                  <ArrowRight className="w-4.5 h-4.5 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Form Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-body">
            {"Looking for the Customer portal?"}{" "}
            <Link 
              href="/login" 
              className="font-bold text-[#38b1f7] hover:underline"
            >
              Customer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#38b1f7]" />
      </div>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}
