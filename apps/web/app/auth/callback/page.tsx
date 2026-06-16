"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "../../../context/AuthContext";
import { CheckCircle2, AlertCircle, Ticket } from "lucide-react";
import Loader from "../../../components/Loader";

// Cache verification promises globally to prevent double-verification in React Strict Mode (dev)
const verificationCache = new Map<string, Promise<{ success: boolean; error?: string; user?: User }>>();

function CallbackContent() {
  const { loginWithMagicLink } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function verifyToken() {
      if (!token) {
        if (active) {
          setStatus("error");
          setErrorMessage("Verification token is missing. Please request a new verification link.");
        }
        return;
      }

      try {
        let promise = verificationCache.get(token);
        if (!promise) {
          promise = loginWithMagicLink(token);
          verificationCache.set(token, promise);
        }

        const result = await promise;
        if (!active) return;

        if (result.success && result.user) {
          setStatus("success");
          // Redirect user based on role
          const role = result.user.role;
          setTimeout(() => {
            if (role === "ADMIN") {
              router.replace("/admin/dashboard");
            } else {
              router.replace("/customer/dashboard");
            }
          }, 1500); // 1.5 seconds delay for a premium feedback transition
        } else {
          setStatus("error");
          setErrorMessage(result.error || "The verification link is invalid or has expired.");
        }
      } catch {
        if (!active) return;
        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    }

    verifyToken();

    return () => {
      active = false;
    };
  }, [token, loginWithMagicLink, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center space-y-6 text-center animate-fade-in">
        <Loader size="lg" theme="light" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 font-display">Verifying Link</h2>
          <p className="text-xs text-slate-500 font-body">Authenticating your session, please hold tight...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center space-y-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-emerald-600 font-display">Successfully Verified</h2>
          <p className="text-xs text-slate-500 font-body">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 text-center animate-fade-in max-w-sm">
      <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-rose-600 font-display">Verification Failed</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-body">
          {errorMessage || "This link could not be verified. It may have expired or already been used."}
        </p>
      </div>
      <div className="pt-4 flex flex-col space-y-3 w-full">
        <Link 
          href="/login" 
          className="w-full h-12 bg-[#38b1f7] hover:bg-[#004b70] text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-[#38b1f7]/25 hover:shadow-xl hover:shadow-[#38b1f7]/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-50"
        >
          Back to Login
        </Link>
        <Link 
          href="/register" 
          className="text-xs text-slate-500 hover:text-[#38b1f7] font-semibold transition-colors font-body"
        >
          Need an account? <span className="text-[#38b1f7] font-bold hover:underline">Register here</span>
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <Loader size="lg" theme="light" />
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-slate-900 font-display">Loading</h2>
        <p className="text-xs text-slate-500 font-body">Preparing callback verification...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
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
            Elevate your enterprise support.
          </h1>
          <p className="text-sm lg:text-base text-slate-100/90 leading-relaxed font-body">
            Create, Track, and Resolve Tickets with Ease — Powered by AI and Supported by Our Expert Team.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Callback Content */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8">
          <Suspense fallback={<LoadingState />}>
            <CallbackContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
