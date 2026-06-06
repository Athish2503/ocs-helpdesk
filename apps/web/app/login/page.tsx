"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

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
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#5FC0F9]/30">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="flex flex-col items-center space-y-2 mb-8 text-center">
          <Link href="/" className="w-10 h-10 rounded-lg bg-[#5FC0F9] flex items-center justify-center shadow-md hover:scale-105 transition-transform duration-150">
            <span className="font-extrabold text-[#020617] text-md tracking-wider">Ω</span>
          </Link>
          <h1 className="font-bold text-xl tracking-tight">Sign in to your account</h1>
          <p className="text-xs text-[#94A3B8]">Welcome back to OCS Helpdesk</p>
        </div>

        {/* Form Panel */}
        <div className="ocs-card p-8 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-lg bg-[#FEF3F2] border border-[#FEE4E2] text-[#B42318] text-xs font-semibold flex items-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Email Address</label>
              <input
                id="email"
                type="email"
                required
                disabled={isSubmitting}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@example.com"
                className="ocs-input"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Password</label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isSubmitting}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ocs-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          {/* Prompt to Register */}
          <div className="mt-6 text-center text-xs text-[#94A3B8]">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-[#5FC0F9] hover:text-[#38B1F7] transition-colors">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
