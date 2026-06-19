"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { 
  Ticket,
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
  ShieldCheck,
  Sparkles,
  ArrowRight
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 selection:bg-[#005d89]/10 selection:text-[#005d89]">
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
            Create your support portal.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/80 leading-relaxed font-body">
            Experience seamless issue resolution and high-performance agent workflows. Set up your workspace in seconds.
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

      {/* Right Panel - Form */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8">
          
          {!verificationEmailSent ? (
            <>
              {/* Form Header */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
                  Create an account
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 font-body">
                  Please enter your details to set up your profile.
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

                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="name"
                      type="text"
                      required
                      disabled={isSubmitting}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                    />
                    <User className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                  </div>
                </div>

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
                      placeholder="jane.doe@example.com"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                    />
                    <Mail className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
                    Password
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

                  {/* Password Strength Guidelines Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <p className="font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1 font-display text-[10px]">
                      <Sparkles className="w-3.5 h-3.5 text-[#005d89]" />
                      <span>Security Guidelines</span>
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 font-medium text-slate-600 font-body">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${valLength ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                        <span className={valLength ? 'text-slate-900 font-semibold' : 'text-slate-400'}>8+ Characters</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${valUpper ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                        <span className={valUpper ? 'text-slate-900 font-semibold' : 'text-slate-400'}>Uppercase (A-Z)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${valLower ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                        <span className={valLower ? 'text-slate-900 font-semibold' : 'text-slate-400'}>Lowercase (a-z)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${valNumber ? 'bg-emerald-500 shadow-sm' : 'bg-slate-300'}`} />
                        <span className={valNumber ? 'text-slate-900 font-semibold' : 'text-slate-400'}>One Number (0-9)</span>
                      </div>
                    </div>
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
                      disabled={isSubmitting}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 hover:bg-slate-100/60 focus:bg-white text-slate-900 text-sm font-medium border border-slate-200 focus:border-[#38b1f7] focus:ring-1 focus:ring-[#38b1f7] rounded-xl outline-none transition-all duration-200 disabled:opacity-50"
                    />
                    <Lock className="absolute left-4 text-slate-400 w-4.5 h-4.5 pointer-events-none" />
                  </div>
                  {password && confirmPassword && (
                    <div className="flex items-center justify-end pt-1">
                      {valMatch ? (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1 font-body">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Codes match</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-600 font-bold flex items-center space-x-1 font-body">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>Codes do not match</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-cyber w-full h-12 text-base font-bold shadow-lg shadow-[#005d89]/25 hover:shadow-xl hover:shadow-[#005d89]/35 mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Creating profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Redirect Footer */}
              <div className="pt-6 border-t border-slate-100 text-center text-xs text-slate-500 font-body">
                Already have an account?{" "}
                <Link 
                  href="/login" 
                  className="font-bold text-[#38b1f7] hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </>
          ) : (
            /* Premium Verification Pending Card UI */
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600 shadow-sm relative">
                <ShieldCheck className="w-8 h-8" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-extrabold text-xl text-slate-900 font-display">Verification Sent</h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto font-body">
                    We have dispatched a secure  verification link to:
                    <span className="text-[#38b1f7] font-bold block mt-2 text-sm break-all bg-slate-50 py-2 px-3.5 rounded-xl border border-slate-100">{email}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[280px] mx-auto leading-normal pt-2 font-body">
                    Please click the link inside the validation email to activate your profile.
                  </p>
                </div>

                <div className="space-y-2.5 pt-2 text-left">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display text-center">
                    Quick Access to Webmail
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href="https://mail.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 cursor-pointer text-xs"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" fill="#f1f3f4" />
                        <path d="M2 6V18C2 19.1 2.9 20 4 20H7V9.5L2 6Z" fill="#4285F4" />
                        <path d="M22 6V18C22 19.1 21.1 20 20 20H17V9.5L22 6Z" fill="#34A853" />
                        <path d="M7 9.5V20H17V9.5L12 13L7 9.5Z" fill="#EA4335" />
                        <path d="M2 6L12 13L22 6" stroke="#FBBC05" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <span>Gmail</span>
                    </a>

                    <a
                      href="https://outlook.live.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 cursor-pointer text-xs"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 4.5V19.5L12 22V2Z" fill="#0078D4" />
                        <path d="M22 4.5H12V19.5H22V4.5Z" fill="#50E6FF" opacity="0.1" />
                        <path d="M22 4.5H12V19.5H22V4.5Z" stroke="#0078D4" strokeWidth="1.5" />
                        <path d="M12 7.5H20V16.5H12V7.5Z" fill="#0078D4" opacity="0.2" />
                        <circle cx="7" cy="12" r="2.5" fill="white" />
                      </svg>
                      <span>Outlook</span>
                    </a>

                    <a
                      href="https://mail.yahoo.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 cursor-pointer text-xs"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" fill="#6001d2" opacity="0.1" />
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 2ZM9.78 7.5H11.58L13.38 12.38L15.18 7.5H16.98L14.28 14.22V17.5H12.48V14.22L9.78 7.5Z" fill="#6001d2" />
                      </svg>
                      <span>Yahoo Mail</span>
                    </a>

                    <a
                      href="https://www.icloud.com/mail"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2.5 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 font-semibold border border-slate-200 hover:border-slate-300 rounded-xl transition-all duration-200 cursor-pointer text-xs"
                    >
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5a3.5 3.5 0 0 0-3-3.47A7 7 0 1 0 6.5 13a4.5 4.5 0 0 0-2 8.5" />
                      </svg>
                      <span>iCloud</span>
                    </a>
                  </div>
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setVerificationEmailSent(false)}
                className="text-xs font-bold text-slate-500 hover:text-[#005d89] transition-all pt-4 flex items-center justify-center mx-auto space-x-1.5 group font-body"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Return to Registration Form</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
