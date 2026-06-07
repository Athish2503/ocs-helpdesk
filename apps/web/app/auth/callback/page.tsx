"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth, User } from "../../../context/AuthContext";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
          setErrorMessage("Verification token is missing. Please request a new magic link.");
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
          setErrorMessage(result.error || "The magic link is invalid or has expired.");
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
      <div className="flex flex-col items-center space-y-6 text-center">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#5FC0F9]/20 animate-pulse"></div>
          <Loader2 className="w-8 h-8 text-[#5FC0F9] animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-[#F8FAFC]">Verifying Magic Link</h2>
          <p className="text-xs text-[#94A3B8]">Authenticating your session, please hold tight...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center space-y-6 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-emerald-400">Successfully Verified</h2>
          <p className="text-xs text-[#94A3B8]">Taking you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6 text-center animate-fade-in max-w-sm">
      <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
        <AlertCircle className="w-8 h-8" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-rose-400">Verification Failed</h2>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {errorMessage || "This link could not be verified. It may have expired or already been used."}
        </p>
      </div>
      <div className="pt-2 flex flex-col space-y-3 w-full">
        <Link href="/login" className="btn-primary w-full text-center">
          Back to Login
        </Link>
        <Link href="/register" className="text-xs text-[#94A3B8] hover:text-[#F8FAFC] transition-colors">
          Need an account? Register here
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-4 border-[#5FC0F9]/20 animate-pulse"></div>
        <Loader2 className="w-8 h-8 text-[#5FC0F9] animate-spin" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-[#F8FAFC]">Loading</h2>
        <p className="text-xs text-[#94A3B8]">Preparing callback verification...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex flex-col justify-center items-center p-6 selection:bg-[#5FC0F9]/30">
      <div className="w-full max-w-md ocs-card p-8 shadow-md flex justify-center items-center min-h-[300px]">
        <Suspense fallback={<LoadingState />}>
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
