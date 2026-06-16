"use client";

import React, { useState, useEffect } from "react";
import Loader from "../../components/Loader";
import Link from "next/link";
import { Ticket, ArrowLeft, RefreshCcw, Layout, Maximize2, Sliders, Shield, Sun, Moon } from "lucide-react";

export default function LoaderDemoPage() {
  const [themeMode, setThemeMode] = useState<"light" | "dark">("dark");
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [fullscreenLabel, setFullscreenLabel] = useState("Loading system files...");
  
  // Data Fetching Simulator
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedData, setFetchedData] = useState<{ id: string; user: string; status: string; priority: string }[] | null>(null);

  // Button loader simulator
  const [buttonLoading, setButtonLoading] = useState(false);

  // Sync theme with HTML document class
  const isDark = themeMode === "dark";
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  // Simulate data fetching
  const triggerFetch = () => {
    setIsFetching(true);
    setFetchedData(null);
    setTimeout(() => {
      setFetchedData([
        { id: "TK-4029", user: "Sophia Miller", status: "Open", priority: "Urgent" },
        { id: "TK-1829", user: "Alexander Jones", status: "In Progress", priority: "Medium" },
        { id: "TK-9022", user: "Emma Watson", status: "Resolved", priority: "Low" },
      ]);
      setIsFetching(false);
    }, 2500);
  };

  // Trigger button submit simulation
  const triggerButtonSubmit = () => {
    setButtonLoading(true);
    setTimeout(() => {
      setButtonLoading(false);
    }, 2000);
  };

  // Trigger fullscreen overlay loader
  const triggerFullscreen = (label: string) => {
    setFullscreenLabel(label);
    setShowFullscreen(true);
    setTimeout(() => {
      setShowFullscreen(false);
    }, 3000);
  };

  // Initial fetch on load
  useEffect(() => {
    triggerFetch();
  }, []);

  return (
    <div
      className={`min-h-screen font-body transition-colors duration-300 ${
        isDark ? "bg-[#020617] text-slate-100" : "bg-slate-50 text-slate-800"
      }`}
    >
      {/* Absolute background grid */}
      <div className={`absolute inset-0 grid-bg pointer-events-none ${isDark ? "opacity-25" : "opacity-[0.12]"}`} />
      
      {/* Ambient background glow elements in dark mode */}
      {isDark && (
        <>
          <div className="absolute top-20 left-10 w-96 h-96 glow-orb-cyan -z-10" />
          <div className="absolute bottom-20 right-10 w-[450px] h-[450px] glow-orb-indigo -z-10" />
        </>
      )}

      {/* Full-screen Loader Overlay Simulator */}
      {showFullscreen && (
        <Loader
          size="xl"
          variant="overlay"
          fullPage={true}
          theme={themeMode}
          label={fullscreenLabel}
        />
      )}

      {/* Top Navigation / Header */}
      <header
        className={`border-b sticky top-0 backdrop-blur-md z-30 transition-colors ${
          isDark ? "border-slate-800 bg-[#020617]/70" : "border-slate-200 bg-white/70"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className={`p-1.5 rounded-lg border transition-all ${isDark ? "border-slate-800 hover:bg-slate-900" : "border-slate-200 hover:bg-slate-100"}`}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#38B1F7] flex items-center justify-center shadow-lg shadow-[#38B1F7]/25">
                <Ticket className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-display">
                OCS Helpdesk
              </span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${isDark ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"}`}>
              Design Tokens: Loading Animation
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setThemeMode(isDark ? "light" : "dark")}
              className={`p-2.5 rounded-xl border flex items-center gap-2 text-sm font-semibold transition-all ${
                isDark
                  ? "border-slate-800 bg-slate-900/40 text-amber-400 hover:bg-slate-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        
        {/* Intro Hero Card */}
        <section className={`p-8 rounded-2xl border ${isDark ? "glass-card" : "bg-white border-slate-200 shadow-sm"}`}>
          <div className="max-w-3xl space-y-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight font-display">
              Liquid Orb Loader Showcase
            </h1>
            <p className={`text-base leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              An organic, high-fidelity liquid metaball spinner that functions as the unified loading experience across our platform. Designed around the brand color <code className="text-[#38B1F7] font-semibold bg-[#38B1F7]/10 px-1.5 py-0.5 rounded font-mono">#38B1F7</code>, it morphs, stretches, and flows dynamically, giving users a calm, trustworthy feeling of an active backend computing engine.
            </p>
          </div>
        </section>

        {/* Core Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Standard Scales */}
          <section className={`p-6 rounded-2xl border space-y-6 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className="flex items-center gap-2 border-b pb-4 border-slate-800/10 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-[#38B1F7]" />
              <h2 className="text-xl font-bold font-display">Responsive Sizing Scales</h2>
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Designed to look crisp from microscopic scale (embedded inside UI elements) up to fullscreen loadouts.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-4">
              {/* SM */}
              <div className={`p-4 rounded-xl flex flex-col items-center justify-between h-40 border ${isDark ? "bg-slate-900/30 border-slate-800/50" : "bg-slate-50 border-slate-200"}`}>
                <Loader size="sm" theme={themeMode} />
                <div className="text-center">
                  <div className="font-bold text-xs font-display">sm (24px)</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Buttons, mini elements</div>
                </div>
              </div>

              {/* MD */}
              <div className={`p-4 rounded-xl flex flex-col items-center justify-between h-40 border ${isDark ? "bg-slate-900/30 border-slate-800/50" : "bg-slate-50 border-slate-200"}`}>
                <Loader size="md" theme={themeMode} />
                <div className="text-center">
                  <div className="font-bold text-xs font-display">md (48px)</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Tables, card content</div>
                </div>
              </div>

              {/* LG */}
              <div className={`p-4 rounded-xl flex flex-col items-center justify-between h-40 border ${isDark ? "bg-slate-900/30 border-slate-800/50" : "bg-slate-50 border-slate-200"}`}>
                <Loader size="lg" theme={themeMode} />
                <div className="text-center">
                  <div className="font-bold text-xs font-display">lg (80px)</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Modals, major modules</div>
                </div>
              </div>

              {/* XL */}
              <div className={`p-4 rounded-xl flex flex-col items-center justify-between h-40 border ${isDark ? "bg-slate-900/30 border-slate-800/50" : "bg-slate-50 border-slate-200"}`}>
                <Loader size="xl" theme={themeMode} />
                <div className="text-center">
                  <div className="font-bold text-xs font-display">xl (128px)</div>
                  <div className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>Initial app boot, page logs</div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Layout Variations */}
          <section className={`p-6 rounded-2xl border space-y-6 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className="flex items-center gap-2 border-b pb-4 border-slate-800/10 dark:border-slate-800">
              <Layout className="w-4 h-4 text-[#38B1F7]" />
              <h2 className="text-xl font-bold font-display">Layout & Custom Labeling</h2>
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Standard text labels are animated with a breathing pulse to complement the orb physics.
            </p>

            <div className="space-y-4">
              {/* Standalone with long text */}
              <div className={`p-4 rounded-xl border flex items-center justify-center ${isDark ? "bg-slate-900/20 border-slate-800/40" : "bg-slate-50 border-slate-200"}`}>
                <Loader size="md" variant="standalone" theme={themeMode} label="Indexing knowledge base..." />
              </div>

              {/* Inline layout */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${isDark ? "bg-slate-900/20 border-slate-800/40" : "bg-slate-50 border-slate-200"}`}>
                <div className="text-xs font-semibold">Inline Text Alignment:</div>
                <div className="flex items-center gap-2 bg-slate-800/20 px-3 py-1.5 rounded-lg border border-slate-800/30">
                  <span className="text-xs font-medium">Auto-saving drafts</span>
                  <Loader size="sm" variant="inline" theme={themeMode} />
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Interactive Button Integrations */}
          <section className={`p-6 rounded-2xl border space-y-6 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className="flex items-center gap-2 border-b pb-4 border-slate-800/10 dark:border-slate-800">
              <Shield className="w-4 h-4 text-[#38B1F7]" />
              <h2 className="text-xl font-bold font-display">Button States & Interactive Toggles</h2>
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Click to preview interactive button submit states. Utilizes contrast layout rendering (white droplets on solid backgrounds).
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              {/* Admin Button primary */}
              <button
                onClick={triggerButtonSubmit}
                disabled={buttonLoading}
                className="admin-btn admin-btn-primary h-12 flex-1 relative overflow-hidden"
              >
                {buttonLoading ? (
                  <div className="flex items-center justify-center gap-2.5">
                    <Loader size={18} variant="inline" contrast={true} />
                    <span>Processing Securely...</span>
                  </div>
                ) : (
                  <span>Click to Submit</span>
                )}
              </button>

              {/* Cyber Neon CTA Button */}
              <button
                onClick={triggerButtonSubmit}
                disabled={buttonLoading}
                className="btn-cyber h-12 flex-1 relative"
              >
                {buttonLoading ? (
                  <div className="flex items-center justify-center gap-2.5">
                    <Loader size={18} variant="inline" contrast={true} />
                    <span>Synchronizing Network...</span>
                  </div>
                ) : (
                  <span>Submit to Cyber Node</span>
                )}
              </button>
            </div>
          </section>

          {/* Section 4: Overlay & Screen Covers */}
          <section className={`p-6 rounded-2xl border space-y-6 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-sm"}`}>
            <div className="flex items-center gap-2 border-b pb-4 border-slate-800/10 dark:border-slate-800">
              <Maximize2 className="w-4 h-4 text-[#38B1F7]" />
              <h2 className="text-xl font-bold font-display">Backdrop Blur Overlays</h2>
            </div>
            <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Demonstrates page-blocking backdrop filters. Tapping triggers a 3-second temporary fullscreen screen block.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => triggerFullscreen("Syncing secure dashboard database...")}
                className={`flex-1 h-12 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Trigger Fullscreen Loader (Database Sync)
              </button>
              
              <button
                onClick={() => triggerFullscreen("Signing out & cleaning local session cache...")}
                className={`flex-1 h-12 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-200"
                    : "bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700"
                }`}
              >
                Trigger Fullscreen Loader (Logout Session)
              </button>
            </div>
          </section>

        </div>

        {/* Section 5: Simulation of Data Fetching & Micro-Placeholder Overlay */}
        <section className={`p-6 rounded-2xl border space-y-6 ${isDark ? "border-slate-800 bg-slate-950/40" : "border-slate-200 bg-white shadow-sm"}`}>
          <div className="flex items-center justify-between border-b pb-4 border-slate-800/10 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-[#38B1F7]" />
              <h2 className="text-xl font-bold font-display">Async Data-Fetching Placeholder</h2>
            </div>
            <button
              onClick={triggerFetch}
              disabled={isFetching}
              className={`p-2 rounded-lg border transition-all ${
                isDark ? "border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-[#38B1F7]" : "border-slate-200 bg-slate-100 hover:bg-slate-200 text-[#0d7fc0]"
              }`}
              title="Refetch data"
            >
              <RefreshCcw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="relative min-h-[220px] rounded-xl border border-dashed border-slate-800/20 dark:border-slate-800 flex items-center justify-center overflow-hidden">
            {isFetching && (
              <Loader
                size="lg"
                variant="overlay"
                fullPage={false}
                theme={themeMode}
                label="Retrieving cloud support tickets..."
              />
            )}

            {fetchedData ? (
              <div className="w-full p-4 overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className={`border-b ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                      <th className="py-3 px-4 font-bold">Ticket ID</th>
                      <th className="py-3 px-4 font-bold">User</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fetchedData.map(ticket => (
                      <tr key={ticket.id} className={`border-b ${isDark ? "border-slate-800/50 hover:bg-slate-900/10" : "border-slate-200/50 hover:bg-slate-50"}`}>
                        <td className="py-3.5 px-4 font-semibold font-mono text-[#38B1F7]">{ticket.id}</td>
                        <td className="py-3.5 px-4 font-medium">{ticket.user}</td>
                        <td className="py-3.5 px-4">
                          <span className={`admin-badge ${
                            ticket.status === "Open"
                              ? "admin-badge-open"
                              : ticket.status === "In Progress"
                              ? "admin-badge-in-progress"
                              : "admin-badge-resolved"
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`admin-badge ${ticket.priority === "Urgent" ? "admin-badge-urgent" : "admin-badge-closed"}`}>
                            {ticket.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              !isFetching && <div className="text-slate-400 text-xs">No active dataset. Press refresh to pull data.</div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
