"use client";

import React, { useState } from "react";
import { LogOut, Power, RefreshCw, X } from "lucide-react";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userName?: string;
  isDark?: boolean;
}

export default function LogoutModal({
  isOpen,
  onClose,
  onConfirm,
  userName = "User",
  isDark = true,
}: LogoutModalProps) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [stepText, setStepText] = useState("Disconnecting active session...");

  if (!isOpen) return null;

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    setStepText("Invalidating encrypted session tokens...");
    
    await new Promise(r => setTimeout(r, 450));
    setStepText("Clearing local credentials & state...");
    
    await new Promise(r => setTimeout(r, 450));
    setStepText("Disconnecting safely...");
    
    await onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Heavy Cyber Blur Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl transition-opacity animate-in fade-in duration-300"
        onClick={loggingOut ? undefined : onClose}
      />

      {/* Futuristic Cyber Modal Card */}
      <div className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-[0_0_50px_rgba(244,63,94,0.3)] transition-all transform scale-100 z-10 overflow-hidden ${
        isDark 
          ? "bg-slate-950/95 border-rose-500/30 text-white" 
          : "bg-white border-rose-200 text-slate-900 shadow-2xl"
      }`}>
        {/* Glow ambient background spheres */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        {!loggingOut && (
          <button
            onClick={onClose}
            className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
              isDark ? "hover:bg-white/10 text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col items-center text-center space-y-5">
          {/* Animated Dual-Ring Power Icon */}
          <div className="relative flex items-center justify-center w-20 h-20">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-500/40 animate-[spin_8s_linear_infinite]" />
            <div className="absolute inset-2 rounded-full border border-rose-500/30 animate-[spin_5s_linear_infinite_reverse]" />
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ${
              loggingOut ? "scale-110 bg-rose-600 text-white shadow-rose-600/50" : "bg-gradient-to-br from-rose-500/20 to-red-600/30 border border-rose-500/40 text-rose-400"
            }`}>
              {loggingOut ? (
                <RefreshCw className="w-7 h-7 animate-spin" />
              ) : (
                <Power className="w-7 h-7 animate-pulse text-rose-400" />
              )}
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-xl font-extrabold tracking-tight">
              {loggingOut ? "Signing Out..." : "Confirm Log Out"}
            </h3>
            <p className={`text-xs leading-relaxed max-w-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {loggingOut ? stepText : `Goodbye, ${userName}. Are you sure you want to end your active support session?`}
            </p>
          </div>

          {/* Status Progress Indicator when logging out */}
          {loggingOut && (
            <div className="w-full space-y-2 pt-2">
              <div className="w-full h-1.5 bg-rose-950/60 rounded-full overflow-hidden border border-rose-500/30 p-0.5">
                <div className="h-full bg-gradient-to-r from-rose-500 via-red-500 to-rose-400 rounded-full animate-pulse w-full transition-all duration-500" />
              </div>
              <span className="text-[10px] font-mono text-rose-400 animate-pulse tracking-wider uppercase">
                SECURITY TERMINATION IN PROGRESS
              </span>
            </div>
          )}

          {/* Buttons */}
          {!loggingOut && (
            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={onClose}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border ${
                  isDark
                    ? "bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                    : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={handleLogoutConfirm}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all flex items-center justify-center gap-2 group cursor-pointer active:scale-95"
              >
                <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
