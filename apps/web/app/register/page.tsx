"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  XCircle,
  ArrowLeft, 
  AlertCircle, 
  Loader2,
  Terminal,
  ShieldCheck,
  Sparkles
} from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);

  // Real-time validation checks
  const valLength = password.length >= 8;
  const valUpper = /[A-Z]/.test(password);
  const valLower = /[a-z]/.test(password);
  const valNumber = /\d/.test(password);
  const valMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || name.trim().length < 2) {
      setError("Name must be at least 2 characters long");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!valLength || !valUpper || !valLower || !valNumber) {
      setError("Password does not meet all security guidelines");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password);
    setIsSubmitting(false);

    if (result.success) {
      setVerificationEmailSent(true);
    } else {
      setError(result.error || "An error occurred during registration.");
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#5FC0F9]/30 relative overflow-hidden grid-bg">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] glow-orb-cyan rounded-full animate-float-1" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] glow-orb-indigo rounded-full animate-float-2" />

      {/* Main Container */}
      <div className="w-full max-w-[440px] z-10">

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
            Create Account
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1.5 font-medium">
            Register as a Customer on OCS Helpdesk
          </p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-card p-8 md:p-10 shadow-2xl relative transition-all duration-300">
          {!verificationEmailSent ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Animated Error Alert */}
              {error && (
                <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-[#FEF3F2] text-xs font-medium flex items-start space-x-2.5 animate-error-shake shadow-[0_4px_12px_rgba(239,68,68,0.1)]">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Full Name
                </label>
                <div className="glass-input-container">
                  <input
                    id="name"
                    type="text"
                    required
                    disabled={isSubmitting}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="glass-input"
                  />
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 transition-colors pointer-events-none" />
                </div>
              </div>

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
                    placeholder="jane.doe@example.com"
                    className="glass-input"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 transition-colors pointer-events-none" />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Choose Access Code
                </label>
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

                {/* Password Strength Checklist Indicator */}
                <div className="pt-2 pb-1 px-3 rounded-lg bg-[#030712]/50 border border-[#1E293B]/60 space-y-1.5">
                  <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider flex items-center space-x-1">
                    <Sparkles className="w-3 h-3 text-[#5FC0F9]" />
                    <span>Security Guidelines</span>
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${valLength ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-[#1E293B]'}`} />
                      <span className={valLength ? 'text-slate-300 font-medium' : 'text-[#64748B]'}>8+ Characters</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${valUpper ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-[#1E293B]'}`} />
                      <span className={valUpper ? 'text-slate-300 font-medium' : 'text-[#64748B]'}>Uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${valLower ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-[#1E293B]'}`} />
                      <span className={valLower ? 'text-slate-300 font-medium' : 'text-[#64748B]'}>Lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${valNumber ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-[#1E293B]'}`} />
                      <span className={valNumber ? 'text-slate-300 font-medium' : 'text-[#64748B]'}>One Number (0-9)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Confirm Access Code
                </label>
                <div className="glass-input-container">
                  <input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="glass-input"
                  />
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] w-4 h-4 transition-colors pointer-events-none" />
                </div>
                {password && confirmPassword && (
                  <div className="flex items-center justify-end pt-1">
                    {valMatch ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Codes match</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-rose-400 font-semibold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Codes do not match</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-cyber w-full flex items-center justify-center space-x-2 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-900" />
                    <span className="text-slate-900">Uploading Profile...</span>
                  </>
                ) : (
                  <span>Compile Registration</span>
                )}
              </button>
            </form>
          ) : (
            /* Premium Verification Pending Card UI */
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-[#5FC0F9]/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.15)] relative">
                <ShieldCheck className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-3">
                <h3 className="font-extrabold text-xl text-[#F8FAFC]">Verification Sent</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-sm mx-auto">
                  We have dispatched a secure magic verification link to:
                  <br />
                  <span className="text-[#5FC0F9] font-bold block mt-2 text-sm break-all bg-[#030712]/60 py-1.5 px-3 rounded-lg border border-[#1E293B]">{email}</span>
                </p>
                <p className="text-[11px] text-[#64748B] max-w-[280px] mx-auto leading-normal pt-2">
                  Please click the link inside the validation dispatch to activate your profile.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => setVerificationEmailSent(false)}
                className="text-xs font-bold text-[#94A3B8] hover:text-[#5FC0F9] transition-all pt-4 flex items-center justify-center mx-auto space-x-1.5 group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Registration Form</span>
              </button>
            </div>
          )}

          {/* Login Redirect Link */}
          <div className="mt-8 pt-6 border-t border-[#1E293B]/60 text-center text-xs text-[#94A3B8]">
            Already registered?{" "}
            <Link href="/login" className="font-bold text-[#5FC0F9] hover:text-[#38B1F7] hover:underline underline-offset-4 transition-colors">
              Access Terminal
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
