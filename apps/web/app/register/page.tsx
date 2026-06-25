"use client";

import React from "react";
import Link from "next/link";
import { Ticket, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
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
        </div>

        {/* Footer info */}
        <div className="text-xs text-white/90 z-10 font-body">
          &copy; {new Date().getFullYear()} OCS Helpdesk. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Registration Disabled */}
      <div className="w-full md:w-[55%] flex flex-col justify-center items-center p-6 sm:p-10 md:p-16 lg:p-24 bg-white min-h-screen">
        <div className="w-full max-w-[420px] space-y-8 text-center">
          <div className="w-16 h-16 bg-blue-50 text-[#38b1f7] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-display">
              Registration is invitation-only
            </h2>
            <p className="text-sm text-slate-500 font-body leading-relaxed">
              Public self-registration has been disabled for the OCS Helpdesk. Customer profiles originate and synchronize from our central CRM.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 font-body leading-relaxed text-left">
            <p className="font-semibold text-slate-700 mb-1">To gain access:</p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Contact your account administrator or manager.</li>
              <li>Once synced from CRM, you will receive an invitation email containing a secure password setup link.</li>
            </ul>
          </div>
          <div className="pt-6 border-t border-slate-100">
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center h-12 px-6 bg-[#38b1f7] hover:bg-[#2fa3e7] text-white text-sm font-bold rounded-xl shadow-md shadow-[#38b1f7]/25 hover:shadow-lg transition-all duration-200"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
