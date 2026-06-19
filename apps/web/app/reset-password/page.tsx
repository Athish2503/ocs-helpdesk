"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Ticket,
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  ShieldCheck,
  Check,
  X
} from "lucide-react";
import Loader from "../../components/Loader";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Validation States
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const isFormValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is missing. Please check your email link.");
      return;
    }

    if (!isFormValid) {
      if (!passwordsMatch) {
        setError("Passwords do not match.");
      } else {
        setError("Please ensure your password meets all complexity requirements.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Failed to reset password. The link may have expired.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: { message: string }) => d.message).join(". ");
        }
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Reset password request error:", err);
      setError("Unable to connect to the password reset server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-900">Invalid Reset Link</h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              No reset token was found in the URL. Please check the link in your email, or request a new one.
            </p>
          </div>
        </div>

        <Link 
          href="/forgot-password" 
          className="btn-cyber w-full h-12 text-base font-bold shadow-md"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6 animate-fade-in text-center">
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-100 text-slate-700 text-sm flex flex-col items-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-8 h-8 text-white stroke-[1.5]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">Password updated</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm">
              Your password has been successfully reset. All active sessions have been signed out for security.
            </p>
          </div>
        </div>

        <Link 
          href="/login" 
          className="btn-cyber w-full h-12 text-base font-bold shadow-lg shadow-[#005d89]/20"
        >
          <span>Sign in with new password</span>
          <ArrowRight className="w-4.5 h-4.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Confirm Password */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
          Confirm New Password
        </label>
        <div className="relative flex items-center">
          <input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            disabled={isSubmitting}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-12 pl-11 pr-12 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
          />
          <Lock className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none p-1 rounded-md"
          >
            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Requirement List */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-display">
          Password Requirements
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-600">
            {hasMinLength ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <X className="w-4 h-4 text-slate-300 stroke-[3]" />
            )}
            <span className={hasMinLength ? "text-emerald-700 font-medium" : ""}>Min 8 characters</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            {hasUppercase ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <X className="w-4 h-4 text-slate-300 stroke-[3]" />
            )}
            <span className={hasUppercase ? "text-emerald-700 font-medium" : ""}>One uppercase letter</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            {hasLowercase ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <X className="w-4 h-4 text-slate-300 stroke-[3]" />
            )}
            <span className={hasLowercase ? "text-emerald-700 font-medium" : ""}>One lowercase letter</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600">
            {hasNumber ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <X className="w-4 h-4 text-slate-300 stroke-[3]" />
            )}
            <span className={hasNumber ? "text-emerald-700 font-medium" : ""}>One number</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-600 sm:col-span-2">
            {passwordsMatch ? (
              <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
            ) : (
              <X className="w-4 h-4 text-slate-300 stroke-[3]" />
            )}
            <span className={passwordsMatch ? "text-emerald-700 font-medium" : ""}>Passwords match</span>
          </div>
        </div>
      </div>

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={isSubmitting || !isFormValid}
        className="btn-cyber w-full h-12 text-base font-bold shadow-lg shadow-[#005d89]/25 hover:shadow-xl hover:shadow-[#005d89]/35 disabled:bg-slate-200 disabled:text-slate-400 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4.5 h-4.5 animate-spin" />
            <span>Resetting password...</span>
          </>
        ) : (
          <>
            <span>Reset Password</span>
            <ArrowRight className="w-4.5 h-4.5" />
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            Secure your credentials.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/90 leading-relaxed font-body">
            Choose a strong, unique password to ensure your tickets and sensitive account records remain fully protected.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Form Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Set new password
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
              {"Please choose a new, secure password that you haven't used before."}
            </p>
          </div>

          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-12">
              <Loader size="lg" theme="light" label="Loading secure session..." />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>

          {/* Form Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-body">
            Already know your password?{" "}
            <Link 
              href="/login" 
              className="font-bold text-[#38b1f7] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
