"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { 
  User, 
  Shield, 
  Activity, 
  CheckCircle, 
  ArrowRight, 
  ChevronDown, 
  LifeBuoy, 
  Bell, 
  Lock,
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeMockupTab, setActiveMockupTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    }
  }, [user, loading, router]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Live ticket mockup data
  const mockTickets = [
    { id: "T-104", subject: "Unable to access production database", priority: "High", status: "Open", time: "5m ago", type: "open" },
    { id: "T-103", subject: "Setup Google App Password for SMTP", priority: "Medium", status: "Resolved", time: "2h ago", type: "resolved" },
    { id: "T-102", subject: "Requesting customer desk role upgrade", priority: "Low", status: "Resolved", time: "1d ago", type: "resolved" },
  ];

  const filteredTickets = mockTickets.filter(
    ticket => activeMockupTab === 'all' || ticket.type === activeMockupTab
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617] text-[#F8FAFC]">
        <div className="w-80 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#38B1F7] to-[#129FF0] flex items-center justify-center mx-auto shadow-[0_4px_20px_rgba(95,192,249,0.15)] animate-pulse">
            <span className="font-extrabold text-[#020617] text-lg">Ω</span>
          </div>
          <p className="text-xs font-medium text-[#94A3B8] animate-pulse">
            Checking session data...
          </p>
          <div className="space-y-2 pt-2">
            <div className="h-2 w-3/4 bg-[#0F172A] border border-[#1E293B] rounded-full mx-auto skeleton"></div>
            <div className="h-2 w-1/2 bg-[#0F172A] border border-[#1E293B] rounded-full mx-auto skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex flex-col justify-between selection:bg-[#38B1F7]/30 selection:text-white relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#38B1F7]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#129FF0]/5 blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[#1E293B]/60 z-20 relative">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#38B1F7] to-[#129FF0] flex items-center justify-center shadow-[0_4px_14px_rgba(95,192,249,0.2)]">
            <span className="font-extrabold text-[#020617] text-base">Ω</span>
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-[#F8FAFC]">
              OCS Desk
            </h1>
            <p className="text-[9px] text-[#38B1F7] font-mono tracking-wider uppercase font-semibold">Helpdesk Portal</p>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-semibold text-[#94A3B8]">
          <a href="#features" className="hover:text-[#F8FAFC] transition-colors">Features</a>
          <a href="#process" className="hover:text-[#F8FAFC] transition-colors">How It Works</a>
          <a href="#faq" className="hover:text-[#F8FAFC] transition-colors">FAQ</a>
          <a href="#portals" className="hover:text-[#F8FAFC] transition-colors">Portals</a>
        </nav>

        {/* Header Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/login"
            className="text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-9 px-4 text-xs font-bold text-white bg-[#129FF0] hover:bg-[#38B1F7] active:scale-98 transition-all duration-150 rounded-xl"
          >
            Register Client
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-1.5 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="absolute top-[70px] left-0 right-0 bg-[#0F172A] border-b border-[#1E293B] p-6 flex flex-col space-y-4 md:hidden z-30 shadow-xl">
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#CBD5E1] hover:text-white"
            >
              Features
            </a>
            <a 
              href="#process" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#CBD5E1] hover:text-white"
            >
              How It Works
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#CBD5E1] hover:text-white"
            >
              FAQ
            </a>
            <a 
              href="#portals" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-[#CBD5E1] hover:text-white"
            >
              Portals
            </a>
            <div className="h-px bg-[#1E293B] my-2" />
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-1/2 text-center text-sm font-semibold text-[#94A3B8] hover:text-[#F8FAFC] py-2"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-1/2 text-center h-10 flex items-center justify-center text-xs font-bold text-white bg-[#129FF0] rounded-lg"
              >
                Register
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="flex-grow z-10">
        <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 md:py-24 grid lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Hero Text */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/40 border border-[#38B1F7]/20 text-[#38B1F7] text-[11px] font-semibold tracking-wide font-mono">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Sprint 1 Operations Initialized</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#94A3B8]">
              Customer support,<br/>simplified & streamlined.
            </h2>
            
            <p className="text-sm md:text-base text-[#94A3B8] leading-relaxed max-w-xl">
              A transparent customer support platform built to handle ticket submission, active tracking, and client-agent coordination under reliable SLA guidelines.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-11 px-6 bg-[#129FF0] hover:bg-[#38B1F7] text-[#020617] font-bold text-sm rounded-xl transition-all duration-150 active:scale-98 shadow-[0_4px_14px_rgba(95,192,249,0.2)] group"
              >
                <span>Initialize Support Portal</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center h-11 px-6 border border-[#1E293B] hover:border-[#38B1F7]/30 hover:bg-white/5 text-[#F8FAFC] font-semibold text-sm rounded-xl transition-colors duration-150"
              >
                Explore Features
              </a>
            </div>
          </div>

          {/* Right Column: Premium CSS Dashboard Mockup */}
          <div className="lg:col-span-6">
            <div className="mockup-window w-full">
              {/* Mockup Header */}
              <div className="h-10 bg-[#0F172A] border-b border-[#1E293B] px-4 flex items-center justify-between">
                <div className="flex space-x-1.5">
                  <span className="w-3 h-3 rounded-full mockup-dot-red"></span>
                  <span className="w-3 h-3 rounded-full mockup-dot-yellow"></span>
                  <span className="w-3 h-3 rounded-full mockup-dot-green"></span>
                </div>
                <div className="text-[10px] font-mono text-[#64748B] select-none">
                  ocs-desk-portal.io/dashboard
                </div>
                <div className="w-12 h-2"></div> {/* Spacer to align title */}
              </div>

              {/* Mockup Content */}
              <div className="p-6 bg-[#030712]/50 font-sans space-y-6">
                {/* Mockup Top Info */}
                <div className="flex items-center justify-between border-b border-[#1E293B]/60 pb-4">
                  <div>
                    <h4 className="text-xs font-bold text-white">Support Tickets</h4>
                    <p className="text-[9px] text-[#94A3B8]">Review status and request history</p>
                  </div>
                  <div className="flex bg-[#0F172A] border border-[#1E293B] rounded-lg p-1 space-x-1 text-[9px] font-semibold font-mono">
                    <button 
                      onClick={() => setActiveMockupTab('all')}
                      className={`px-2 py-0.5 rounded transition-all ${activeMockupTab === 'all' ? 'bg-[#129FF0] text-[#020617]' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setActiveMockupTab('open')}
                      className={`px-2 py-0.5 rounded transition-all ${activeMockupTab === 'open' ? 'bg-[#129FF0] text-[#020617]' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      Open
                    </button>
                    <button 
                      onClick={() => setActiveMockupTab('resolved')}
                      className={`px-2 py-0.5 rounded transition-all ${activeMockupTab === 'resolved' ? 'bg-[#129FF0] text-[#020617]' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                {/* Mockup Tickets List */}
                <div className="space-y-3">
                  {filteredTickets.map((ticket, i) => (
                    <div key={i} className="p-3 bg-[#0F172A]/80 border border-[#1E293B] rounded-lg flex items-center justify-between transition-colors hover:border-[#1E293B]*2">
                      <div className="space-y-1 overflow-hidden pr-3">
                        <div className="flex items-center space-x-2 text-[9px] font-mono font-bold">
                          <span className="text-[#38B1F7]">{ticket.id}</span>
                          <span className="text-[#64748B]">•</span>
                          <span className={`${
                            ticket.priority === 'High' ? 'text-red-400' :
                            ticket.priority === 'Medium' ? 'text-yellow-400' : 'text-slate-400'
                          }`}>{ticket.priority} Priority</span>
                        </div>
                        <h5 className="text-[11px] font-semibold text-[#F8FAFC] truncate" title={ticket.subject}>
                          {ticket.subject}
                        </h5>
                      </div>
                      <div className="flex items-center space-x-3 shrink-0">
                        <span className="text-[9px] font-mono text-[#64748B]">{ticket.time}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase font-mono ${
                          ticket.status === 'Open' 
                            ? 'bg-blue-950/50 text-[#38B1F7] border border-[#38B1F7]/25' 
                            : 'bg-green-950/50 text-[#12B76A] border border-[#12B76A]/25'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                    </div>
                  ))}

                  {filteredTickets.length === 0 && (
                    <div className="py-8 text-center text-xs text-[#94A3B8] font-mono">
                      No tickets matching this filter
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Stats Bar */}
        <section className="bg-[#090D1E]/40 border-y border-[#1E293B]/60 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <span className="block text-2xl md:text-3xl font-extrabold text-[#38B1F7]">99.9%</span>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Service SLA Guaranteed</span>
            </div>
            <div className="text-center space-y-1 border-l border-[#1E293B]/60">
              <span className="block text-2xl md:text-3xl font-extrabold text-white">&lt; 15m</span>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Average Response</span>
            </div>
            <div className="text-center space-y-1 border-l border-[#1E293B]/60">
              <span className="block text-2xl md:text-3xl font-extrabold text-[#38B1F7]">24 / 7</span>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Active Queue Routing</span>
            </div>
            <div className="text-center space-y-1 border-l border-[#1E293B]/60">
              <span className="block text-2xl md:text-3xl font-extrabold text-white">100%</span>
              <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-semibold">Client Satisfaction</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Platform Capabilities</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Everything you need for clean support workflows
            </h2>
            <p className="text-sm text-[#94A3B8]">
              No confusing AI jargon—just a structured, efficient database portal to keep clients and support staff aligned.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="gradient-border-card p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#38B1F7]">
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Centralized Tickets</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Log support tickets with detailed descriptions, priority markers, and category fields. Avoid lost emails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="gradient-border-card p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#38B1F7]">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Real-Time Status</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Watch tickets move dynamically from Open to In Progress to Resolved. Transparent lifecycle audit logs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="gradient-border-card p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#38B1F7]">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Email Dispatch</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Google SMTP configured node triggers instant email notifications on responses, assignments, and ticket closure.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="gradient-border-card p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#38B1F7]">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-white">Secure Auth layer</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                JWT session layers protect client ticketing history, ensuring access control restrictions operate securely.
              </p>
            </div>
          </div>
        </section>

        {/* Process / How It Works */}
        <section id="process" className="bg-[#090D1E]/20 border-y border-[#1E293B]/60 py-20">
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Step-By-Step Workflow</h3>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                How tickets are submitted & resolved
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className="space-y-4 relative z-10 bg-[#020617]/40 p-6 rounded-xl border border-[#1E293B]/60">
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 01
                </span>
                <h4 className="text-lg font-bold text-white">Submit Request</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Log in to the Client Portal, initialize a new ticket with title, issue details, and set priority.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4 relative z-10 bg-[#020617]/40 p-6 rounded-xl border border-[#1E293B]/60">
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 02
                </span>
                <h4 className="text-lg font-bold text-white">Queue Routing</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Our system matches ticket requirements and alerts active support agents via dashboard queue logs.
                </p>
              </div>

              {/* Step 3 */}
              <div className="space-y-4 relative z-10 bg-[#020617]/40 p-6 rounded-xl border border-[#1E293B]/60">
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 03
                </span>
                <h4 className="text-lg font-bold text-white">SLA Resolution</h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Agents work and provide solutions. You track progress and close the query when fully satisfied.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Portal Access Selection */}
        <section id="portals" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Console Access</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Choose your desk view
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customer Desk */}
            <div className="gradient-border-card p-8 flex flex-col justify-between text-left group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-[#38B1F7] mb-6 group-hover:border-[#38B1F7]/30 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Customer Desk</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-8">
                  Register a secure client account, initialize support requests, review assignment logs, and maintain dialogue with support staff.
                </p>
              </div>
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-10 px-4 bg-[#129FF0] hover:bg-[#38B1F7] text-[#020617] font-bold text-xs rounded-xl transition-all active:scale-98"
              >
                Access Customer Hub
              </Link>
            </div>

            {/* Admin / Agent Desk */}
            <div className="gradient-border-card p-8 flex flex-col justify-between text-left group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#0F172A] border border-[#1E293B] flex items-center justify-center text-purple-400 mb-6 group-hover:border-purple-500/30 transition-colors">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Agent Console</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-8">
                  Access administrative queues to supervise incoming tickets, moderate support categories, review resolution speed, and process tickets.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-10 px-4 border border-[#1E293B] text-white hover:bg-white/5 hover:border-purple-500/30 font-bold text-xs rounded-xl transition-all active:scale-98"
              >
                Access Operations Desk
              </Link>
            </div>
          </div>
        </section>

        {/* Collapsible FAQ Section */}
        <section id="faq" className="max-w-4xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Support FAQ</h3>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="border-t border-[#1E293B]/60 pt-4">
            {[
              {
                q: "How do I submit a new support ticket?",
                a: "You can register a customer account and log into your desk portal. From there, click on 'New Ticket' to fill out the issue description, choose a category, and set a priority level."
              },
              {
                q: "What is the typical ticket response time?",
                a: "Our queues are monitored 24/7. Critical service issues are reviewed within minutes. General inquiries and normal priority tickets are typically resolved within 2 hours."
              },
              {
                q: "Do clients receive email notifications on updates?",
                a: "Yes. Our configured Google SMTP service automatically dispatches email alerts whenever a support agent modifies your ticket status, logs a response, or marks it as resolved."
              },
              {
                q: "How do support agents handle queues?",
                a: "Authorized agents log into the Agent Console to inspect all open requests. They route assignments, update progress states, and log details to ensure high SLA compliance."
              }
            ].map((faq, index) => (
              <div key={index} className="faq-accordion-item py-4">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex justify-between items-center text-left py-2 font-bold text-sm text-white hover:text-[#38B1F7] transition-colors focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${openFaq === index ? 'rotate-180 text-[#38B1F7]' : ''}`} />
                </button>
                <div className={`faq-answer-container ${openFaq === index ? 'open' : ''}`}>
                  <div className="faq-answer-content">
                    <p className="text-xs text-[#94A3B8] leading-relaxed pt-2 pb-4">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Enterprise Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-10 border-t border-[#1E293B]/60 text-xs text-[#64748B] space-y-8 z-10 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-[#129FF0] flex items-center justify-center font-extrabold text-[#020617] text-xs">Ω</div>
              <span className="font-bold text-[#F8FAFC]">OCS Helpdesk</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#64748B]">
              A secure, structural support pipeline for enterprise client queue routing and issue resolution.
            </p>
          </div>
          
          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">Product</h5>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#features" className="hover:text-[#F8FAFC] transition-colors">Portal Features</a></li>
              <li><a href="#process" className="hover:text-[#F8FAFC] transition-colors">Resolution SLA</a></li>
              <li><Link href="/register" className="hover:text-[#F8FAFC] transition-colors">Client Desk</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">Resources</h5>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#faq" className="hover:text-[#F8FAFC] transition-colors">Help Center FAQ</a></li>
              <li><span className="text-[#64748B]/60 font-mono text-[9px] uppercase border border-[#1E293B] px-1.5 py-0.5 rounded">Sprint 2 Docs</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-white uppercase text-[10px] tracking-wider">System Info</h5>
            <div className="text-[10px] space-y-1 text-[#64748B]">
              <div>Next.js App Router</div>
              <div>Tailwind CSS Engine</div>
              <div>Prisma Database Engine</div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#1E293B]/30 flex flex-col md:flex-row items-center justify-between text-[11px] gap-4">
          <p>© 2026 OCS Helpdesk. Secure Enterprise Customer Desk.</p>
          <div className="flex space-x-6">
            <span className="hover:text-[#F8FAFC] transition-colors cursor-default">Privacy Policy</span>
            <span className="hover:text-[#F8FAFC] transition-colors cursor-default">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

