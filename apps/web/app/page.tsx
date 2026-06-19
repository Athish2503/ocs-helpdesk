"use client";

import { useEffect, useState } from "react";
import Loader from "../components/Loader";
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
  X,
  Sun,
  Moon,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Mail,
  Send,
  ChevronRight,
  Sparkles,
  Database,
  ThumbsUp,
  Star,
  CheckCircle2
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeMockupTab, setActiveMockupTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for the interactive ticketing mockup player
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState<1 | 1.5 | 2>(1.5);
  const [stepProgress, setStepProgress] = useState(0);

  // OCS.in Service Scenarios for Walkthrough
  const ocsScenarios = [
    {
      id: "workspace",
      serviceName: "Google Workspace",
      subject: "Migrate 45 mailboxes to Google Workspace",
      category: "Google Workspace & Mail",
      priority: "Medium",
      priorityColor: "text-amber-500",
      description: "Require complete MX record setup, migration batches, and SPF/DKIM TXT verification.",
      agentReply: "Alex Rivera: Initialized mail transfer batches in Google Admin. Checked SPF/DKIM TXT entries, DNS propagation successfully complete.",
      slaLimit: "24h 00m",
      slaActual: "4h 12m",
      solution: "Google Workspace migration batch verified. 45 accounts active with verified SPF/DKIM/DMARC routing policies."
    },
    {
      id: "ssl",
      serviceName: "Domains & SSL",
      subject: "SSL handshake failed on primary domain",
      category: "SSL Certificates & DNS",
      priority: "High",
      priorityColor: "text-red-500",
      description: "Primary site is showing SEC_ERROR_REVOKED_CERTIFICATE warning. Need immediate cert re-issue and proxy reload.",
      agentReply: "Alex Rivera: Verified certificate revocation status. Re-issued Wildcard Let's Encrypt SSL via Certbot. Reloaded Nginx reverse proxy nodes.",
      slaLimit: "2h 00m",
      slaActual: "18m 45s",
      solution: "Let's Encrypt SSL Cert successfully renewed and auto-renew cron jobs registered. Connection handshake status: SECURE."
    },
    {
      id: "hosting",
      serviceName: "Cloud Hosting",
      subject: "Replica database connection timeout on server",
      category: "App Hosting & DB",
      priority: "High",
      priorityColor: "text-red-500",
      description: "Local nodes are experiencing network route blocking when querying port 5432. Replica database is unreachable.",
      agentReply: "Alex Rivera: Subnet firewall rule anomaly detected. Re-applied security group rules on AWS RDS to permit local replica queries.",
      slaLimit: "15m 00s",
      slaActual: "8m 12s",
      solution: "AWS Security Group rules updated. Postgres replica query routing verified. SLA response target met successfully."
    }
  ];

  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const scenario = ocsScenarios[activeScenarioIdx];

  const handleScenarioChange = (idx: number) => {
    setActiveScenarioIdx(idx);
    setCurrentStep(1);
    setStepProgress(0);
    setIsPlaying(false);
  };

  // Handle manual step selection
  const handleStepSelect = (step: 1 | 2 | 3 | 4) => {
    setCurrentStep(step);
    setStepProgress(0);
    setIsPlaying(false);
  };

  // Playback timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const tick = 100;
      // Step duration is 6500ms
      interval = setInterval(() => {
        setStepProgress((prev) => {
          const increment = (100 / (6500 / tick)) * playSpeed;
          if (prev + increment >= 100) {
            setCurrentStep((step) => {
              const next = (step === 4 ? 1 : step + 1) as 1 | 2 | 3 | 4;
              return next;
            });
            return 0;
          }
          return prev + increment;
        });
      }, tick);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playSpeed]);

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("light"); // Default is light mode as requested
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isDark = theme === 'dark';

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
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}>
        <Loader size="lg" theme={isDark ? "dark" : "light"} label="Checking session data..." />
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col justify-between selection:bg-[#38B1F7]/30 transition-colors duration-300 relative overflow-hidden ${
      isDark ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Subtle Background Glow Elements (Visible in both themes, but adjusted opacity) */}
      <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-[#38B1F7]/5' : 'bg-[#38B1F7]/3'
      }`} />
      <div className={`absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-[#129FF0]/5' : 'bg-[#129FF0]/3'
      }`} />

      {/* Navigation Header */}
      <header className={`w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b z-20 relative transition-colors ${
        isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#38B1F7] to-[#129FF0] flex items-center justify-center shadow-[0_4px_14px_rgba(95,192,249,0.2)]">
            <span className="font-extrabold text-[#020617] text-base">Ω</span>
          </div>
          <div>
            <h1 className={`font-bold text-sm tracking-tight transition-colors ${
              isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
            }`}>
              OCS Desk
            </h1>
            <p className="text-[9px] text-[#38B1F7] font-mono tracking-wider uppercase font-semibold">Helpdesk Portal</p>
          </div>
        </div>

        {/* Desktop Links */}
        <nav className={`hidden md:flex items-center space-x-8 text-xs font-semibold transition-colors ${
          isDark ? 'text-[#94A3B8]' : 'text-[#475569]'
        }`}>
          <a href="#features" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Features</a>
          <a href="#process" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>How It Works</a>
          <a href="#faq" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>FAQ</a>
          <a href="#portals" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Portals</a>
        </nav>

        {/* Header Actions & Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all duration-200 active:scale-95 ${
              isDark 
                ? 'border-[#1E293B] hover:border-[#38B1F7]/30 text-yellow-400 hover:bg-white/5' 
                : 'border-[#E2E8F0] hover:border-[#129FF0]/30 text-slate-700 hover:bg-slate-100'
            }`}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link
            href="/login"
            className={`text-xs font-semibold px-3 py-2 transition-colors ${
              isDark ? 'text-[#94A3B8] hover:text-[#F8FAFC]' : 'text-[#475569] hover:text-[#0F172A]'
            }`}
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

        {/* Mobile Menu & Theme Actions */}
        <div className="flex items-center space-x-2 md:hidden">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg border transition-colors ${
              isDark 
                ? 'border-[#1E293B] text-yellow-400' 
                : 'border-[#E2E8F0] text-slate-700'
            }`}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1.5 transition-colors ${isDark ? 'text-[#94A3B8] hover:text-[#F8FAFC]' : 'text-[#475569] hover:text-[#0F172A]'}`}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className={`absolute top-[70px] left-0 right-0 border-b p-6 flex flex-col space-y-4 md:hidden z-30 shadow-xl transition-colors ${
            isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
          }`}>
            <a 
              href="#features" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-[#CBD5E1] hover:text-white' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Features
            </a>
            <a 
              href="#process" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-[#CBD5E1] hover:text-white' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              How It Works
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-[#CBD5E1] hover:text-white' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              FAQ
            </a>
            <a 
              href="#portals" 
              onClick={() => setMobileMenuOpen(false)}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-[#CBD5E1] hover:text-white' : 'text-[#475569] hover:text-[#0F172A]'}`}
            >
              Portals
            </a>
            <div className={`h-px my-2 ${isDark ? 'bg-[#1E293B]' : 'bg-[#E2E8F0]'}`} />
            <div className="flex items-center justify-between gap-4">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className={`w-1/2 text-center text-sm font-semibold py-2 ${
                  isDark ? 'text-[#94A3B8] hover:text-[#F8FAFC]' : 'text-[#475569] hover:text-[#0F172A]'
                }`}
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
            {/* <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/40 border border-[#38B1F7]/25 text-[#fff] text-[11px] font-semibold tracking-wide font-mono">
              <LifeBuoy className="w-3.5 h-3.5" />
              <span>Sprint 1 Operations Initialized</span>
            </div> */}
            
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight bg-clip-text text-transparent transition-all ${
              isDark 
                ? 'bg-gradient-to-b from-[#F8FAFC] via-[#E2E8F0] to-[#94A3B8]' 
                : 'bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#475569]'
            }`}>
              Customer support,<br/>simplified & streamlined.
            </h2>
            
            <p className={`text-sm md:text-base leading-relaxed max-w-xl transition-colors ${
              isDark ? 'text-[#94A3B8]' : 'text-[#475569]'
            }`}>
              A transparent customer support platform built to handle ticket submission, active tracking, and client-agent coordination under reliable SLA guidelines.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center h-11 px-6 bg-[#129FF0] hover:bg-[#38B1F7] text-[#fff] font-bold text-sm rounded-xl transition-all duration-150 active:scale-98 shadow-[0_4px_14px_rgba(95,192,249,0.2)] group"
              >
                <span>Request Support</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#features"
                className={`inline-flex items-center justify-center h-11 px-6 border rounded-xl transition-all duration-150 font-semibold text-sm ${
                  isDark 
                    ? 'border-[#1E293B] hover:border-[#38B1F7]/30 hover:bg-white/5 text-[#F8FAFC]' 
                    : 'border-[#E2E8F0] hover:border-[#129FF0]/30 hover:bg-slate-50 text-[#0F172A]'
                }`}
              >
                Explore Features
              </a>
            </div>
          </div>
          {/* Right Column: Premium CSS Dashboard Mockup (Now Interactive Explainer Player) */}
          <div className="lg:col-span-6">
            <div className={`w-full rounded-2xl overflow-hidden transition-all duration-300 relative border ${
              isDark 
                ? 'bg-[#0A0F1E]/75 border-[#1E293B] shadow-[0_20px_50px_rgba(0,0,0,0.5)]' 
                : 'bg-white border-[#E2E8F0] shadow-[0_20px_50px_rgba(148,163,184,0.15)]'
            }`}>
              
              {/* Mockup Address/Browser Header */}
              <div className={`h-10 px-4 flex items-center justify-between border-b transition-colors ${
                isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex space-x-1.5 shrink-0">
                  <span className="w-3 h-3 rounded-full mockup-dot-red"></span>
                  <span className="w-3 h-3 rounded-full mockup-dot-yellow"></span>
                  <span className="w-3 h-3 rounded-full mockup-dot-green"></span>
                </div>
                
                <div className={`px-4 py-0.5 rounded-md text-[10px] font-mono max-w-xs truncate transition-all duration-300 ${
                  isDark ? 'bg-[#030712]/60 text-[#38B1F7]' : 'bg-slate-100 text-[#129FF0]'
                }`}>
                  {currentStep === 1 && "helpdesk.ocs365.in/customer/new-ticket"}
                  {currentStep === 2 && "helpdesk.ocs365.in/system/routing-engine"}
                  {currentStep === 3 && "helpdesk.ocs365.in/agent/console/T-104"}
                  {currentStep === 4 && "helpdesk.ocs365.in/customer/ticket/T-104"}
                </div>
                
                <div className="flex items-center space-x-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                  <span className="text-[8px] font-mono text-slate-500 font-semibold uppercase tracking-wider">
                    {isPlaying ? "LIVE TOUR" : "PAUSED"}
                  </span>
                </div>
              </div>

              {/* Mockup Dynamic Content Area - Fixed Height to Prevent Layout Shifting */}
              <div className={`p-5 transition-colors font-sans h-[350px] relative overflow-hidden select-none flex flex-col justify-between ${
                isDark ? 'bg-[#030712]/40' : 'bg-[#FAFBFD]'
              }`}>

                {/* OCS Services Scenario Selector Tab Bar */}
                <div className={`flex items-center justify-between border-b pb-2 transition-colors ${
                  isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'
                }`}>
                  <span className="text-[8px] font-bold text-slate-400 font-mono tracking-wider">SELECT OCS SERVICE:</span>
                  <div className="flex space-x-1">
                    {ocsScenarios.map((sc, idx) => (
                      <button
                        key={sc.id}
                        onClick={() => handleScenarioChange(idx)}
                        className={`text-[8.5px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                          activeScenarioIdx === idx 
                            ? 'bg-[#129FF0] text-[#020617] font-bold shadow-sm' 
                            : isDark ? 'text-slate-400 hover:text-white bg-[#0F172A]' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                        }`}
                      >
                        {sc.serviceName}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* ── STEP 1: CLIENT SUBMISSION ── */}
                {currentStep === 1 && (
                  <div className="space-y-3 animate-slide-in h-full flex flex-col justify-between mt-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Step 1: Submit Support Ticket
                          </h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-blue-950/60 text-[#38B1F7]' : 'bg-blue-50 text-[#129FF0]'
                        }`}>
                          Customer View
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-grow justify-center flex flex-col">
                      {/* Ticket Title Input Mock */}
                      <div className="space-y-1">
                        <label className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Issue Subject
                        </label>
                        <div className={`h-8 rounded-lg border text-[10.5px] px-2.5 flex items-center transition-all ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B] text-white' : 'bg-white border-[#E2E8F0] text-slate-800'
                        } ${stepProgress < 30 ? 'ring-1 ring-[#38B1F7]/30 border-[#38B1F7]/40' : ''}`}>
                          <span>
                            {scenario.subject.substring(0, Math.floor(Math.min(stepProgress / 30, 1) * scenario.subject.length))}
                          </span>
                          {stepProgress < 30 && (
                            <span className="w-1.5 h-3.5 ml-0.5 bg-[#38B1F7] animate-pulse shrink-0 inline-block" />
                          )}
                        </div>
                      </div>

                      {/* Ticket Priority Select Mock */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Priority
                          </label>
                          <div className={`h-8 rounded-lg border text-[10px] px-2.5 flex items-center justify-between font-semibold ${
                            isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                          }`}>
                            {stepProgress < 30 ? (
                              <span className="text-slate-500">Select...</span>
                            ) : (
                              <span className={`${scenario.priorityColor} font-bold flex items-center`}>
                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse ${
                                  scenario.priority === 'High' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {scenario.priority} Priority
                              </span>
                            )}
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            Category
                          </label>
                          <div className={`h-8 rounded-lg border text-[9.5px] px-2.5 flex items-center ${
                            isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-300' : 'bg-white border-[#E2E8F0] text-slate-700'
                          }`}>
                            {stepProgress < 30 ? "Select..." : scenario.category}
                          </div>
                        </div>
                      </div>

                      {/* Ticket Description Input Mock */}
                      <div className="space-y-1">
                        <label className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Elaborate Details
                        </label>
                        <div className={`h-12 rounded-lg border text-[9.5px] p-2 overflow-hidden leading-normal ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-300' : 'bg-white border-[#E2E8F0] text-slate-600'
                        } ${stepProgress >= 30 && stepProgress < 75 ? 'ring-1 ring-[#38B1F7]/30 border-[#38B1F7]/40' : ''}`}>
                          {stepProgress >= 30 ? (
                            <span>
                              {scenario.description.substring(
                                0, Math.floor(Math.min((stepProgress - 30) / 45, 1) * scenario.description.length)
                              )}
                              {stepProgress < 75 && (
                                <span className="w-1.5 h-3 ml-0.5 bg-[#38B1F7] animate-pulse inline-block" />
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500">Provide logs or issue context...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit Button & Virtual Click Animation */}
                    <div className="pt-0.5 relative">
                      <button className={`w-full h-8 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
                        stepProgress >= 90 
                          ? 'bg-[#38B1F7] text-white scale-98 shadow-sm' 
                          : stepProgress >= 80 
                            ? 'bg-[#129FF0] text-white scale-[1.01] shadow-md shadow-[#129FF0]/20'
                            : 'bg-[#129FF0] text-white'
                      }`}>
                        {stepProgress >= 93 ? (
                          <>
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Creating Support Ticket...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3 h-3" />
                            <span>Submit Support Request</span>
                          </>
                        )}
                      </button>

                      {/* Virtual Cursor Icon moving to submit */}
                      {stepProgress >= 75 && stepProgress < 92 && (
                        <div 
                          className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
                          style={{
                            top: `${35 - (stepProgress - 75) * 1.3}px`,
                            left: `${45 + (stepProgress - 75) * 3}%`
                          }}
                        >
                          <svg className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-black stroke-white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Step 1 Success Toast Overlay */}
                    {stepProgress >= 95 && (
                      <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-slide-in">
                        <div className={`p-4 rounded-xl border max-w-xs text-center space-y-2 shadow-xl ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto animate-bounce">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Ticket T-104 Generated
                          </h5>
                          <p className="text-[9px] text-[#64748B]">
                            System registering ticket details & notifying queue...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 2: PIPELINE ROUTING & SMTP ALERT ── */}
                {currentStep === 2 && (
                  <div className="space-y-3 animate-slide-in h-full flex flex-col justify-between mt-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Database className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Step 2: Automated Dispatch & Notifications
                          </h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-400`}>
                          Routing Engine
                        </span>
                      </div>
                    </div>

                    {/* Routing pipeline graphics */}
                    <div className="flex-grow flex items-center justify-between px-2 py-1 relative">
                      
                      {/* Ticket Block */}
                      <div className={`w-24 p-2 rounded-lg border text-center z-10 transition-all ${
                        isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0] shadow-xs'
                      } ${stepProgress < 30 ? 'ring-1 ring-[#38B1F7]/30 border-[#38B1F7]' : ''}`}>
                        <span className="text-[8px] font-mono text-[#38B1F7] font-bold">T-104</span>
                        <div className={`text-[8.5px] font-bold truncate mt-0.5 ${scenario.priorityColor}`}>{scenario.priority} Priority</div>
                        <div className="text-[7.5px] text-slate-500 truncate mt-0.5">{scenario.category}</div>
                      </div>

                      {/* Center Dispatch Node */}
                      <div className="flex-grow relative h-12 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full" overflow="visible">
                          {/* Connection paths */}
                          <path 
                            d="M 5 24 L 140 24" 
                            fill="none" 
                            stroke={isDark ? "#1E293B" : "#E2E8F0"} 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                          />
                          <path 
                            d="M 70 24 L 70 -5" 
                            fill="none" 
                            stroke={isDark ? "#1E293B" : "#E2E8F0"} 
                            strokeWidth="1.5" 
                            strokeDasharray="4 4" 
                          />
                          
                          {/* Animated pulsing routing signal */}
                          {stepProgress > 10 && stepProgress < 85 && (
                            <circle r="4" fill="#38B1F7" className="animate-pulse">
                              <animateMotion 
                                path="M 10 24 L 135 24" 
                                dur={`${2.5 / playSpeed}s`} 
                                repeatCount="indefinite" 
                              />
                            </circle>
                          )}
                        </svg>

                        {/* Middle Dispatch Center */}
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center border z-10 ${
                          isDark ? 'bg-[#1e293b]/90 border-[#38B1F7]/35' : 'bg-slate-100 border-[#129FF0]/35'
                        }`}>
                          <Activity className="w-4 h-4 text-[#38B1F7] animate-spin" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>

                      {/* Targets (Client and Agent alerts) */}
                      <div className="space-y-3 z-10">
                        {/* SMTP Server Alert */}
                        <div className={`w-24 p-1.5 rounded-lg border text-center transition-all ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                        } ${stepProgress >= 30 && stepProgress < 70 ? 'border-amber-500/40 bg-amber-950/5' : ''}`}>
                          <div className="flex items-center justify-center space-x-1">
                            <Mail className="w-2.5 h-2.5 text-amber-500" />
                            <span className="text-[7.5px] font-bold text-slate-400">SMTP Engine</span>
                          </div>
                          <span className={`text-[7px] font-mono block mt-0.5 ${stepProgress >= 50 ? 'text-green-500' : 'text-slate-500'}`}>
                            {stepProgress >= 50 ? "📧 Alert Dispatched" : "Queueing dispatch"}
                          </span>
                        </div>

                        {/* Support Agent Queue */}
                        <div className={`w-24 p-1.5 rounded-lg border text-center transition-all ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                        } ${stepProgress >= 70 ? 'border-green-500/40 bg-green-950/5' : ''}`}>
                          <div className="flex items-center justify-center space-x-1">
                            <Shield className="w-2.5 h-2.5 text-purple-400" />
                            <span className="text-[7.5px] font-bold text-slate-400">SLA Router</span>
                          </div>
                          <span className={`text-[7px] font-mono block mt-0.5 ${stepProgress >= 80 ? 'text-green-500 font-semibold' : 'text-slate-500'}`}>
                            {stepProgress >= 80 ? "SLA SLA Assigned" : "Routing Agent..."}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 Execution Logs */}
                    <div className={`p-2.5 rounded-lg border text-[8.5px] font-mono space-y-1 ${
                      isDark ? 'bg-[#030712] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[#38B1F7] font-semibold">[00:04] SLA Profile Checked:</span>
                        <span className={`${scenario.priorityColor} font-bold`}>{scenario.slaLimit} SLA Limit</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">[00:09] Active roster match:</span>
                        <span>
                          {stepProgress >= 70 ? (
                            <span className="text-[#12B76A] font-bold">Alex Rivera matched</span>
                          ) : (
                            <span className="text-amber-500 animate-pulse">Scanning available SREs...</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 3: AGENT WORKSPACE & DIALOGUE ── */}
                {currentStep === 3 && (
                  <div className="space-y-3 animate-slide-in h-full flex flex-col justify-between mt-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Shield className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Step 3: SRE Intake & Resolution Update
                          </h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-400`}>
                          Agent Desk
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-grow justify-center flex flex-col">
                      {/* Ticket header block */}
                      <div className={`p-2 rounded-lg border flex items-center justify-between ${
                        isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                      }`}>
                        <div className="space-y-0.5 text-left">
                          <div className="text-[8px] font-mono text-slate-500 flex items-center space-x-1">
                            <span className="text-[#38B1F7] font-bold">T-104</span>
                            <span>•</span>
                            <span className={`${scenario.priorityColor} font-semibold`}>{scenario.priority} Priority</span>
                          </div>
                          <div className={`text-[9.5px] font-semibold truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {scenario.subject}
                          </div>
                        </div>

                        {/* Dynamic Status Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider uppercase font-mono animate-pulse ${
                          stepProgress >= 25 
                            ? 'bg-amber-950/50 text-amber-500 border border-amber-500/30' 
                            : 'bg-blue-950/50 text-[#38B1F7] border border-[#38B1F7]/30'
                        }`}>
                          {stepProgress >= 25 ? "In Progress" : "Open"}
                        </span>
                      </div>

                      {/* Agent Response Thread */}
                      <div className={`p-2 rounded-lg border space-y-1.5 ${
                        isDark ? 'bg-[#030712] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'
                      }`}>
                        <div className="flex items-center space-x-1.5 border-b pb-1 border-slate-800/40">
                          <div className="w-4 h-4 rounded-full bg-[#129FF0] text-[8px] font-extrabold text-[#020617] flex items-center justify-center animate-pulse">
                            AR
                          </div>
                          <div>
                            <span className={`text-[8.5px] font-bold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Alex Rivera</span>
                            <span className="text-[7px] text-slate-500 block -mt-0.5">Senior Consultant SRE</span>
                          </div>
                        </div>

                        <div className={`text-[9px] min-h-[38px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {stepProgress >= 25 ? (
                            <span>
                              {scenario.agentReply.substring(
                                0, Math.floor(Math.min((stepProgress - 25) / 50, 1) * scenario.agentReply.length)
                              )}
                              {stepProgress < 75 && (
                                <span className="w-1.5 h-3 ml-0.5 bg-[#38B1F7] animate-pulse inline-block" />
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Assigning SRE review agent...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Submit Note Button Animation */}
                    <button className={`w-full h-8 rounded-lg font-bold text-[10px] flex items-center justify-center space-x-1 transition-all ${
                      stepProgress >= 78 
                        ? 'bg-green-600 text-white shadow-sm' 
                        : 'bg-[#129FF0]/15 text-[#38B1F7] border border-[#38B1F7]/30'
                    }`}>
                      {stepProgress >= 80 ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-white" />
                          <span>Consultant Fix Dispatched</span>
                        </>
                      ) : (
                        <span>Simulating SRE Resolution Action...</span>
                      )}
                    </button>

                    {/* Step 3 SRE Dispatch alert */}
                    {stepProgress >= 82 && (
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-[#0F172A] border border-[#38B1F7]/30 shadow-lg px-3 py-1 rounded-full text-[8.5px] text-[#38B1F7] font-mono font-bold animate-bounce flex items-center space-x-1 z-30">
                        <Mail className="w-3 h-3 text-[#38B1F7]" />
                        <span>📧 Workspace Sync Status Dispatched</span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 4: SLA & FEEDBACK RESOLUTION ── */}
                {currentStep === 4 && (
                  <div className="space-y-3 animate-slide-in h-full flex flex-col justify-between mt-1">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Step 4: SLA Check & Client Close
                          </h4>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-green-950/40 text-[#12B76A]">
                          Resolved
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 flex-grow justify-center flex flex-col">
                      {/* SLA stats box */}
                      <div className={`p-2.5 rounded-lg border grid grid-cols-3 gap-2 text-center relative ${
                        isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0] shadow-xs'
                      }`}>
                        <div className="space-y-0.5">
                          <span className="text-[7px] uppercase tracking-wider text-slate-500 font-semibold">SLA Limit</span>
                          <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{scenario.slaLimit}</div>
                        </div>
                        <div className="space-y-0.5 border-x border-slate-800/40">
                          <span className="text-[7px] uppercase tracking-wider text-[#38B1F7] font-semibold">Resolution Time</span>
                          <div className="text-xs font-bold text-green-500">{scenario.slaActual}</div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[7px] uppercase tracking-wider text-slate-500 font-semibold">Status</span>
                          <div className="text-[10px] font-bold text-green-400 bg-green-500/10 px-1.5 py-0.2 rounded-md inline-block">
                            SLA MET
                          </div>
                        </div>
                      </div>

                      {/* Solution Summary */}
                      <div className={`p-2 rounded-lg border text-[9px] ${
                        isDark ? 'bg-[#030712] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'
                      }`}>
                        <div className={`font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>SRE Action Log:</div>
                        <div className={`leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {scenario.solution}
                        </div>
                      </div>

                      {/* Satisfaction Rating Visualizer */}
                      <div className="text-center space-y-1">
                        <span className={`text-[8.5px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          Consultancy Feedback Score
                        </span>
                        <div className="flex justify-center space-x-1.5">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const threshold = 45 + (starVal * 7); // 52, 59, 66, 73, 80
                            const isFilled = stepProgress >= threshold;
                            return (
                              <Star 
                                key={starVal} 
                                className={`w-4 h-4 transition-all duration-150 ${
                                  isFilled 
                                    ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' 
                                    : 'text-slate-600'
                                }`} 
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Close loop overlay at final ticks */}
                    {stepProgress >= 82 && (
                      <div className="absolute inset-0 bg-[#030712]/75 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-slide-in">
                        <div className={`p-4 rounded-xl border max-w-xs text-center space-y-2.5 shadow-xl ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          <div className="w-9 h-9 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto">
                            <ThumbsUp className="w-5 h-5 animate-pulse" />
                          </div>
                          <div>
                            <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                              Consultancy Ticket Closed
                            </h5>
                            <p className="text-[8.5px] text-[#64748B] mt-0.5">
                              {scenario.serviceName} session complete. System KPI registered.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mockup Timeline Segment Progress Tracker Bar */}
              <div className={`px-4 py-2 border-t flex items-center space-x-3 transition-colors ${
                isDark ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'
              }`}>
                {/* Visual Step Tabs */}
                <div className="grid grid-cols-4 gap-1.5 flex-grow">
                  {[1, 2, 3, 4].map((step) => {
                    const isActive = currentStep === step;
                    const isPassed = currentStep > step;
                    return (
                      <button 
                        key={step} 
                        onClick={() => handleStepSelect(step as 1 | 2 | 3 | 4)}
                        className="space-y-1 group relative focus:outline-none"
                      >
                        <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                          isActive 
                            ? 'bg-[#129FF0]' 
                            : isPassed 
                              ? 'bg-green-500' 
                              : isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}>
                          {/* Inside active segment: inner scrolling progress */}
                          {isActive && (
                            <div 
                              className="h-full bg-[#38B1F7] rounded-full transition-all duration-100" 
                              style={{ width: `${stepProgress}%` }}
                            />
                          )}
                        </div>
                        <span className={`block text-[7.5px] font-semibold text-center transition-all ${
                          isActive 
                            ? isDark ? 'text-white font-bold scale-[1.02]' : 'text-slate-900 font-bold scale-[1.02]'
                            : 'text-slate-500 group-hover:text-slate-400'
                        }`}>
                          {step === 1 && "1. Submission"}
                          {step === 2 && "2. Routing"}
                          {step === 3 && "3. Intake"}
                          {step === 4 && "4. Resolution"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Control Bar (Video Player styled bottom bar) */}
              <div className={`px-4 py-2.5 border-t flex items-center justify-between transition-colors ${
                isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                
                {/* Play/Pause/Reset Controls */}
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                      isDark 
                        ? 'border-[#1E293B] hover:border-[#38B1F7]/30 text-[#38B1F7] bg-[#030712]/30' 
                        : 'border-[#E2E8F0] hover:border-[#129FF0]/30 text-[#129FF0] bg-white'
                    }`}
                    title={isPlaying ? "Pause walkthrough animation" : "Resume walkthrough animation"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-[#38B1F7]" /> : <Play className="w-3.5 h-3.5 fill-[#129FF0]" />}
                  </button>

                  <button 
                    onClick={() => {
                      setCurrentStep(1);
                      setStepProgress(0);
                    }}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                      isDark 
                        ? 'border-[#1E293B] text-slate-400 hover:text-white bg-[#030712]/30' 
                        : 'border-[#E2E8F0] text-slate-500 hover:text-slate-800 bg-white'
                    }`}
                    title="Restart from beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Progress Indicators */}
                <div className="hidden sm:flex items-center space-x-1">
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Active Step:
                  </span>
                  <span className="text-[9px] font-mono font-bold text-[#38B1F7]">
                    0{currentStep}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500">/</span>
                  <span className="text-[9px] font-mono text-slate-500">04</span>
                </div>

                {/* Speed Controls Selector */}
                <div className="flex items-center space-x-1">
                  <span className="text-[8.5px] font-mono text-slate-500 mr-1">Speed:</span>
                  <div className={`flex rounded-lg p-0.5 space-x-0.5 text-[8.5px] font-bold transition-colors ${
                    isDark ? 'bg-[#030712] border border-[#1E293B]' : 'bg-slate-100 border border-[#E2E8F0]'
                  }`}>
                    {([1, 1.5, 2] as const).map((speed) => (
                      <button 
                        key={speed}
                        onClick={() => setPlaySpeed(speed)}
                        className={`px-1.5 py-0.5 rounded transition-all duration-100 ${
                          playSpeed === speed 
                            ? 'bg-[#129FF0] text-[#020617] font-extrabold' 
                            : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        {/* Trust Stats Bar */}
        <section className={`transition-colors duration-300 border-y backdrop-blur-sm ${
          isDark ? 'bg-[#090D1E]/40 border-[#1E293B]/60' : 'bg-[#F1F5F9] border-[#E2E8F0]'
        }`}>
          <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center space-y-1">
              <span className="block text-2xl md:text-3xl font-extrabold text-[#38B1F7]">99.9%</span>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#475569]'}`}>Service SLA Guaranteed</span>
            </div>
            <div className={`text-center space-y-1 border-l transition-colors ${isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'}`}>
              <span className={`block text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>&lt; 15m</span>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#475569]'}`}>Average Response</span>
            </div>
            <div className={`text-center space-y-1 border-l transition-colors ${isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'}`}>
              <span className="block text-2xl md:text-3xl font-extrabold text-[#38B1F7]">24 / 7</span>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#475569]'}`}>Active Queue Routing</span>
            </div>
            <div className={`text-center space-y-1 border-l transition-colors ${isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'}`}>
              <span className={`block text-2xl md:text-3xl font-extrabold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>100%</span>
              <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#64748B]' : 'text-[#475569]'}`}>Client Satisfaction</span>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto px-6 py-20 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Platform Capabilities</h3>
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Everything you need for clean support workflows
            </h2>
            <p className={`text-sm transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
              No confusing AI jargon—just a structured, efficient database portal to keep clients and support staff aligned.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className={`transition-all duration-300 rounded-2xl p-6 border ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#129FF0]/30 hover:bg-[#F8FAFC] hover:shadow-md'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                isDark ? 'bg-[#0F172A] border border-[#1E293B] text-[#38B1F7]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#129FF0]'
              }`}>
                <CheckCircle className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Centralized Tickets</h4>
              <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                Log support tickets with detailed descriptions, priority markers, and category fields. Avoid lost emails.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`transition-all duration-300 rounded-2xl p-6 border ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#129FF0]/30 hover:bg-[#F8FAFC] hover:shadow-md'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                isDark ? 'bg-[#0F172A] border border-[#1E293B] text-[#38B1F7]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#129FF0]'
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Real-Time Status</h4>
              <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                Watch tickets move dynamically from Open to In Progress to Resolved. Transparent lifecycle audit logs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`transition-all duration-300 rounded-2xl p-6 border ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#129FF0]/30 hover:bg-[#F8FAFC] hover:shadow-md'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                isDark ? 'bg-[#0F172A] border border-[#1E293B] text-[#38B1F7]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#129FF0]'
              }`}>
                <Bell className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Email Dispatch</h4>
              <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                Google SMTP configured node triggers instant email notifications on responses, assignments, and ticket closure.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`transition-all duration-300 rounded-2xl p-6 border ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-sm hover:border-[#129FF0]/30 hover:bg-[#F8FAFC] hover:shadow-md'
            }`}>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                isDark ? 'bg-[#0F172A] border border-[#1E293B] text-[#38B1F7]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#129FF0]'
              }`}>
                <Lock className="w-5 h-5" />
              </div>
              <h4 className={`text-base font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Secure Auth layer</h4>
              <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                JWT session layers protect client ticketing history, ensuring access control restrictions operate securely.
              </p>
            </div>
          </div>
        </section>

        {/* Process / How It Works */}
        <section id="process" className={`transition-colors duration-300 border-y py-20 ${
          isDark ? 'bg-[#090D1E]/20 border-[#1E293B]/60' : 'bg-[#F1F5F9]/60 border-[#E2E8F0]'
        }`}>
          <div className="max-w-7xl mx-auto px-6 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h3 className="text-xs font-bold text-[#38B1F7] uppercase tracking-widest font-mono">Step-By-Step Workflow</h3>
              <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                How tickets are submitted & resolved
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <div className={`space-y-4 relative z-10 p-6 rounded-xl border transition-colors ${
                isDark ? 'bg-[#020617]/40 border-[#1E293B]/60' : 'bg-white border-[#E2E8F0] shadow-sm'
              }`}>
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 01
                </span>
                <h4 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Submit Request</h4>
                <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                  Log in to the Client Portal, initialize a new ticket with title, issue details, and set priority.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`space-y-4 relative z-10 p-6 rounded-xl border transition-colors ${
                isDark ? 'bg-[#020617]/40 border-[#1E293B]/60' : 'bg-white border-[#E2E8F0] shadow-sm'
              }`}>
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 02
                </span>
                <h4 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Queue Routing</h4>
                <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                  Our system matches ticket requirements and alerts active support agents via dashboard queue logs.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`space-y-4 relative z-10 p-6 rounded-xl border transition-colors ${
                isDark ? 'bg-[#020617]/40 border-[#1E293B]/60' : 'bg-white border-[#E2E8F0] shadow-sm'
              }`}>
                <span className="text-xs font-bold font-mono text-[#38B1F7] bg-[#38B1F7]/10 px-2.5 py-1 rounded-md">
                  STEP 03
                </span>
                <h4 className={`text-lg font-bold transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>SLA Resolution</h4>
                <p className={`text-xs leading-relaxed transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
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
            <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Choose your desk view
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customer Desk */}
            <div className={`transition-all duration-300 rounded-2xl p-8 border flex flex-col justify-between text-left group ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-md hover:border-[#129FF0]/30 hover:shadow-lg hover:bg-[#F8FAFC]'
            }`}>
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                  isDark ? 'bg-[#0F172A] border border-[#1E293B] text-[#38B1F7]' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-[#129FF0]'
                }`}>
                  <User className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Customer Desk</h3>
                <p className={`text-xs leading-relaxed mb-8 transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
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
            <div className={`transition-all duration-300 rounded-2xl p-8 border flex flex-col justify-between text-left group ${
              isDark 
                ? 'bg-[#0F172A]/50 border-[#1E293B]/60 hover:border-[#38B1F7]/25 hover:bg-[#0F172A]/70' 
                : 'bg-white border-[#E2E8F0] shadow-md hover:border-[#129FF0]/30 hover:shadow-lg hover:bg-[#F8FAFC]'
            }`}>
              <div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-colors ${
                  isDark ? 'bg-[#0F172A] border border-[#1E293B] text-purple-400' : 'bg-[#F1F5F9] border border-[#E2E8F0] text-purple-500'
                }`}>
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-bold mb-2 transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Agent Console</h3>
                <p className={`text-xs leading-relaxed mb-8 transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
                  Access administrative queues to supervise incoming tickets, moderate support categories, review resolution speed, and process tickets.
                </p>
              </div>
              <Link
                href="/login"
                className={`inline-flex items-center justify-center h-10 px-4 border font-bold text-xs rounded-xl transition-all active:scale-98 ${
                  isDark 
                    ? 'border-[#1E293B] text-white hover:bg-white/5 hover:border-purple-500/30' 
                    : 'border-[#E2E8F0] text-[#0F172A] hover:bg-slate-50 hover:border-purple-500/30'
                }`}
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
            <h2 className={`text-3xl font-extrabold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
              Frequently Asked Questions
            </h2>
          </div>

          <div className={`border-t transition-colors pt-4 ${isDark ? 'border-[#1E293B]/60' : 'border-[#E2E8F0]'}`}>
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
              <div key={index} className={`faq-accordion-item py-4 transition-colors ${
                isDark ? 'border-[#1E293B]/40' : 'border-[#E2E8F0]'
              }`}>
                <button
                  onClick={() => toggleFaq(index)}
                  className={`w-full flex justify-between items-center text-left py-2 font-bold text-sm transition-colors focus:outline-none ${
                    isDark ? 'text-white hover:text-[#38B1F7]' : 'text-[#0F172A] hover:text-[#129FF0]'
                  }`}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-[#94A3B8] transition-transform duration-200 ${openFaq === index ? 'rotate-180 text-[#38B1F7]' : ''}`} />
                </button>
                <div className={`faq-answer-container ${openFaq === index ? 'open' : ''}`}>
                  <div className="faq-answer-content">
                    <p className={`text-xs leading-relaxed pt-2 pb-4 transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-[#475569]'}`}>
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
      <footer className={`w-full max-w-7xl mx-auto px-6 py-10 border-t text-xs space-y-8 z-10 relative transition-colors ${
        isDark ? 'border-[#1E293B]/60 text-[#64748B]' : 'border-[#E2E8F0] text-[#64748B]'
      }`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-[#129FF0] flex items-center justify-center font-extrabold text-[#020617] text-xs">Ω</div>
              <span className={`font-bold transition-colors ${isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'}`}>OCS Helpdesk</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#64748B]">
              A secure, structural support pipeline for enterprise client queue routing and issue resolution.
            </p>
          </div>
          
          <div className="space-y-3">
            <h5 className={`font-bold uppercase text-[10px] tracking-wider transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Product</h5>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#features" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Portal Features</a></li>
              <li><a href="#process" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Resolution SLA</a></li>
              <li><Link href="/register" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Client Desk</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className={`font-bold uppercase text-[10px] tracking-wider transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Resources</h5>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#faq" className={`transition-colors ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Help Center FAQ</a></li>
              <li><span className={`text-[9px] uppercase border font-mono px-1.5 py-0.5 rounded ${
                isDark ? 'text-[#64748B]/60 border-[#1E293B]' : 'text-slate-500 border-[#E2E8F0]'
              }`}>Sprint 2 Docs</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className={`font-bold uppercase text-[10px] tracking-wider transition-colors ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>System Info</h5>
            <div className="text-[10px] space-y-1 text-[#64748B]">
              <div>Next.js App Router</div>
              <div>Tailwind CSS Engine</div>
              <div>Prisma Database Engine</div>
            </div>
          </div>
        </div>

        <div className={`pt-8 border-t flex flex-col md:flex-row items-center justify-between text-[11px] gap-4 ${
          isDark ? 'border-[#1E293B]/30' : 'border-[#E2E8F0]/50'
        }`}>
          <p>© 2026 OCS Helpdesk. Secure Enterprise Customer Desk.</p>
          <div className="flex space-x-6">
            <span className={`transition-colors cursor-default ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Privacy Policy</span>
            <span className={`transition-colors cursor-default ${isDark ? 'hover:text-[#F8FAFC]' : 'hover:text-[#0F172A]'}`}>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
