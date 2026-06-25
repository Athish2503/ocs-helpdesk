"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Ticket, Lock, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

function SetupPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  // Real-time validation checks
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNumber = /\d/.test(password);
  const valMatch = password.length > 0 && password === confirmPassword;

  useEffect(() => {
    if (!token) {
      setError("Setup token is missing. Please use the complete link from your invitation email.");
      setIsValidating(false);
      setIsTokenValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
        const response = await fetch(`${API_URL}/auth/invitation/verify-token?token=${token}`);
        const resData = await response.json();

        if (response.ok && resData.success) {
          setIsTokenValid(true);
        } else {
          setError(resData.error?.message || "This invitation link is invalid, expired, or has already been used.");
          setIsTokenValid(false);
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected network error occurred while verifying the invitation link.");
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Setup token is missing.");
      return;
    }
    if (!valLength || !valUpper || !valLower || !valNumber) {
      setError("Password does not meet all security guidelines.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/invitation/setup-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const resData = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(resData.error?.message || "Failed to set password. Link may be expired or already used.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="w-full max-w-[420px] space-y-4 text-center py-12 animate-pulse">
        <Loader2 className="w-8 h-8 animate-spin text-[#38b1f7] mx-auto" />
        <p className="text-sm text-slate-500 font-body">Verifying invitation link...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-[420px] space-y-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            Password Set Successfully
          </h2>
          <p className="text-sm text-slate-500 font-body leading-relaxed">
            Your credentials have been configured and your account is now active. You can log in using your email/phone number.
          </p>
        </div>
        <div className="pt-6 border-t border-slate-100">
          <Link 
            href="/login" 
            className="w-full inline-flex items-center justify-center h-12 px-6 bg-[#38b1f7] hover:bg-[#2fa3e7] text-white text-sm font-bold rounded-xl shadow-md shadow-[#38b1f7]/25 hover:shadow-lg transition-all duration-200"
          >
            <span>Sign In to Dashboard</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="w-full max-w-[420px] space-y-8 text-center animate-fade-in">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <XCircle className="w-8 h-8" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
            Link Inaccessible
          </h2>
          <p className="text-sm text-slate-500 font-body leading-relaxed">
            {error || "This invitation link is invalid, expired, or has already been used."}
          </p>
        </div>
        <div className="pt-6 border-t border-slate-100">
          <Link 
            href="/login" 
            className="w-full inline-flex items-center justify-center h-12 px-6 bg-[#38b1f7] hover:bg-[#2fa3e7] text-white text-sm font-bold rounded-xl shadow-md shadow-[#38b1f7]/25 hover:shadow-lg transition-all duration-200"
          >
            <span>Back to Login</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] space-y-8">
      {/* Form Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
          Set up credentials
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
          Configure a secure password to activate your Helpdesk account.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start space-x-2.5 animate-error-shake shadow-sm">
            <AlertCircle className="w-4.5 h-4.5 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
            New Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting || !token}
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
              className="absolute right-4 text-slate-400 hover:text-slate-650 transition-colors focus:outline-none p-1 rounded-md"
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
            Confirm Password
          </label>
          <div className="relative flex items-center">
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              required
              disabled={isSubmitting || !token}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-12 pl-11 pr-12 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
            />
            <Lock className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
          </div>
        </div>

        {/* Password guidelines grid indicators */}
        <div className="pt-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Password Guidelines</p>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-550">
            <div className="flex items-center space-x-1.5">
              {valLength ? <CheckCircle2 className="w-3.5 h-3.5 text-green-550" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={valLength ? "text-green-700" : ""}>Min 8 characters</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {valUpper ? <CheckCircle2 className="w-3.5 h-3.5 text-green-550" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={valUpper ? "text-green-700" : ""}>One uppercase letter</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {valLower ? <CheckCircle2 className="w-3.5 h-3.5 text-green-550" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={valLower ? "text-green-700" : ""}>One lowercase letter</span>
            </div>
            <div className="flex items-center space-x-1.5">
              {valNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-green-550" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={valNumber ? "text-green-700" : ""}>At least one number</span>
            </div>
            <div className="flex items-center space-x-1.5 col-span-2">
              {valMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-green-550" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
              <span className={valMatch ? "text-green-700" : ""}>Passwords match exactly</span>
            </div>
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={isSubmitting || !token}
          className="btn-cyber w-full h-12 text-base font-bold shadow-lg shadow-[#005d89]/25 hover:shadow-xl hover:shadow-[#005d89]/35 pt-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
              <span>Activating Account...</span>
            </>
          ) : (
            <>
              <span>Activate Account</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 selection:bg-[#005d89]/10 selection:text-[#005d89]">
      {/* Left Panel - Hero Branding */}
      <div className="hidden md:flex md:w-[45%] bg-[#38b1f7] text-white flex-col justify-between p-12 lg:p-16 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_60%)] pointer-events-none" />
        
        <Link href="/">
          <div className="flex items-center space-x-3 z-10 cursor-pointer">
            <div className="w-9 h-9 bg-white flex items-center justify-center rounded-lg shadow-md">
              <Ticket className="w-5.5 h-5.5 text-[#38b1f7]" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white font-display">OCS Helpdesk</span>
          </div>
        </Link>

        <div className="my-auto space-y-6 z-10 max-w-md">
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15] text-white font-display">
            Activate your account.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/80 leading-relaxed font-body">
            Please configure a password to finalize onboarding and sign in to the helpdesk system.
          </p>
        </div>

        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <Suspense fallback={
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#38b1f7]" />
          </div>
        }>
          <SetupPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
