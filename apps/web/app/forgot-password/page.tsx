"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Ticket,
  Mail, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  CheckCircle2,
  ArrowLeft
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const resData = await response.json();

      if (!response.ok) {
        let errorMessage = resData.error?.message || "Failed to submit request. Please try again.";
        if (resData.error?.details && Array.isArray(resData.error.details)) {
          errorMessage = resData.error.details.map((d: any) => d.message).join(". ");
        }
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      setMessage(resData.data?.message || "A password reset link has been sent to your email.");
    } catch (err) {
      console.error("Forgot password request error:", err);
      setError("Unable to connect to the password reset server.");
    } finally {
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
            Recover your account in seconds.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/90 leading-relaxed font-body">
            Verify your identity, establish a new secure password, and get straight back to your workspace.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8">
          
          {/* Form Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              Forgot password?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
              No worries! Enter your registered email below, and we will send you instructions to reset your password.
            </p>
          </div>

          {/* Form / Success Card */}
          {isSuccess ? (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-sky-50 border border-sky-100 text-slate-700 text-sm flex flex-col items-center text-center space-y-3.5 shadow-sm">
                <CheckCircle2 className="w-12 h-12 text-[#38b1f7] stroke-[1.5]" />
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900">Check your inbox</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              <Link 
                href="/login" 
                className="w-full h-12 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-slate-500" />
                <span>Return to sign in</span>
              </Link>
            </div>
          ) : (
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

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-[#38b1f7] hover:bg-[#004b70] text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#005d89]/25 hover:shadow-xl hover:shadow-[#005d89]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-white" />
                    <span>Sending Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight className="w-4.5 h-4.5 text-white" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <Link 
                  href="/login" 
                  className="inline-flex items-center space-x-2 text-xs font-bold text-[#005d89] hover:underline"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}

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
