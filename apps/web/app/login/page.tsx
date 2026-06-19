"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
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

      if (role === "ADMIN" || role === "SUPPORT_L1" || role === "SUPPORT_L2" || role === "BILLING" || role === "AGENT") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    } else {
      setError(result.error || "Invalid email or password.");
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
          <span className="font-extrabold text-xl tracking-tight text-white font-display" >OCS Helpdesk</span>
        </div>
        </Link>

        {/* Marketing Copy */}
        <div className="my-auto space-y-6 z-10 max-w-md">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white font-display">
            Elevate your enterprise support.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/90  leading-relaxed font-body">
           Create, Track, and Resolve Tickets with Ease — Powered by AI and Supported by Our Expert Team.
          </p>
          
          {/* Agent Avatar Group Stack */}
          {/* <div className="flex items-center space-x-4 pt-4">
            <div className="flex -space-x-3.5">
              <Image 
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#005d89] object-cover" 
                src="/agent-1.png" 
                alt="Customer support agent" 
                width={40}
                height={40}
              />
              <Image 
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#005d89] object-cover" 
                src="/agent-2.png" 
                alt="IT support specialist" 
                width={40}
                height={40}
              />
              <Image 
                className="inline-block h-10 w-10 rounded-full ring-2 ring-[#005d89] object-cover" 
                src="/agent-3.png" 
                alt="Helpdesk agent coordinator" 
                width={40}
                height={40}
              />
            </div>
            <span className="text-xs font-semibold text-white/90 font-body">
              Joined by 10k+ agents worldwide
            </span>
          </div> */}
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
              Welcome back
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
              Please enter your credentials to access your dashboard.
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
                Email Address
              </label>
              <div className="relative flex items-center">
                <input
                  id="email"
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                />
                <Mail className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                  Password
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
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight className="w-4.5 h-4.5 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Form Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-body">
            {"Don't have an account?"}{" "}
            <Link 
              href="/register" 
              className="font-bold text-[#38b1f7] hover:underline"
            >
              Sign up 
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
