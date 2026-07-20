"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

interface LogoutTransitionProps {
  isLoggingOut: boolean;
  onComplete: () => void;
  isDark?: boolean;
}

export default function LogoutTransition({
  isLoggingOut,
  onComplete,
  isDark = true,
}: LogoutTransitionProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoggingOut) {
      setProgress(0);
      return;
    }

    // Smooth linear progress filling over 750ms
    const start = Date.now();
    const duration = 750;

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 150);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isLoggingOut, onComplete]);

  if (!isLoggingOut) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#020617] text-white animate-in fade-in duration-300 select-none overflow-hidden">
      {/* Subtle background ambient gradient */}
      <div className="absolute inset-0 grid-bg opacity-15 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#38b1f7]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-sm px-6">
        {/* Brand Shield Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38b1f7] flex items-center justify-center shadow-xl shadow-[#38b1f7]/20 border border-white/20 transition-transform duration-500 scale-105">
            <ShieldCheck className="w-9 h-9 text-white" strokeWidth={2.2} />
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Signing out...
          </h2>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Securing your session and returning to the login portal.
          </p>
        </div>

        {/* Smooth Progress Indicator Bar */}
        <div className="w-64 space-y-2 pt-2">
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/10 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-[#0284c7] to-[#38b1f7] rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 tracking-wider">
            <span>OCS HELPDESK</span>
            <span>{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
