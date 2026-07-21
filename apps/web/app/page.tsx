"use client";

import { useEffect, useState } from "react";
import Loader from "../components/Loader";
import OcsLogo from "../components/OcsLogo";
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
  CheckCircle2,
  BookOpen,
  Receipt,
  Cpu,
  ShieldAlert,
  Paperclip,
  Globe,
  FileText,
  AlertTriangle,
  RefreshCw, 
  MessageSquare,
  CreditCard,
  Server,
  Search,
  HelpCircle
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeMockupTab, setActiveMockupTab] = useState<'all' | 'open' | 'resolved'>('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for the interactive ticketing mockup player
  // New 5-step process: Domain → Subscription → Self-Help KB → Intake Form → Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playSpeed, setPlaySpeed] = useState<1 | 1.5 | 2>(1.5);
  const [stepProgress, setStepProgress] = useState(0);

  // OCS.in Service Scenarios for the Wizard Walkthrough Demo
  const ocsScenarios = [
    {
      id: "workspace",
      serviceName: "Google Workspace",
      domain: "techcorp.in",
      registeredWith: "OCS",
      subscriptionPlan: "Google Workspace Business Starter",
      serviceName2: "Google Workspace Mail",
      kbHit: "How to Set Up Google Workspace MX Records",
      subject: "Migrate 45 mailboxes to Google Workspace",
      category: "Google Workspace & Mail",
      issueType: "technical",
      priority: "MEDIUM",
      priorityColor: "text-amber-500",
      description: "Require complete MX record setup, migration batches, and SPF/DKIM TXT verification.",
      slaLimit: "24h 00m",
      slaActual: "4h 12m",
      routingDept: "Technical Support",
      routingWho: "Support Team",
      routingColor: "text-[#38B1F7]",
      routingBg: { dark: "bg-sky-950/20 border-sky-500/25", light: "bg-sky-50 border-sky-200" },
      solution: "Google Workspace migration batch verified. 45 accounts active with verified SPF/DKIM/DMARC routing policies."
    },
    {
      id: "ssl",
      serviceName: "Domains & SSL",
      domain: "mybrand.com",
      registeredWith: "OCS",
      subscriptionPlan: "Domain + SSL Bundle",
      serviceName2: "SSL Certificate",
      kbHit: "How to Renew SSL Certificate Manually",
      subject: "SSL handshake failed on primary domain",
      category: "SSL Certificates & DNS",
      issueType: "critical",
      priority: "URGENT",
      priorityColor: "text-red-500",
      description: "Primary site is showing SEC_ERROR_REVOKED_CERTIFICATE warning. Need immediate cert re-issue and proxy reload.",
      slaLimit: "2h 00m",
      slaActual: "18m 45s",
      routingDept: "Critical Escalation",
      routingWho: "Support L1 + Manager L2",
      routingColor: "text-red-400",
      routingBg: { dark: "bg-red-950/20 border-red-500/25", light: "bg-red-50 border-red-200" },
      escalated: true,
      solution: "Let's Encrypt SSL Cert renewed and auto-renew cron registered. Nginx proxies reloaded. Connection: SECURE."
    },
    {
      id: "billing",
      serviceName: "Billing Query",
      domain: "startup.io",
      registeredWith: "OTHER",
      subscriptionPlan: null,
      serviceName2: null,
      kbHit: null,
      subject: "Renewal invoice for hosting plan not received",
      category: "Billing / Renewals",
      issueType: "billing",
      priority: "LOW",
      priorityColor: "text-slate-400",
      description: "Our annual hosting renewal invoice is overdue and has not been sent to our accounts email.",
      slaLimit: "48h 00m",
      slaActual: "1h 22m",
      routingDept: "Billing & Renewals",
      routingWho: "Manjula",
      routingColor: "text-violet-400",
      routingBg: { dark: "bg-violet-950/20 border-violet-500/25", light: "bg-violet-50 border-violet-200" },
      solution: "Invoice resent to accounts@startup.io. Payment link and receipt emailed. Subscription renewed."
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
  const handleStepSelect = (step: 1 | 2 | 3 | 4 | 5) => {
    setCurrentStep(step);
    setStepProgress(0);
    setIsPlaying(false);
  };

  // Playback timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      const tick = 100;
      // Step duration is 6000ms
      interval = setInterval(() => {
        setStepProgress((prev) => {
          const increment = (100 / (6000 / tick)) * playSpeed;
          if (prev + increment >= 100) {
            setCurrentStep((step) => {
              // For the billing scenario which skips steps 2 and 3, still use full 5-step cycle
              const maxStep = 5;
              const next = (step === maxStep ? 1 : step + 1) as 1 | 2 | 3 | 4 | 5;
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
          <OcsLogo className="h-8 w-auto shrink-0" color="#38b1f7" />
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

            {/* Storytelling Narrative Card — narrates the actual wizard steps */}
            <div className={`mt-8 p-5 rounded-2xl border transition-all duration-300 ${
              isDark 
                ? 'bg-[#0F172A]/40 border-[#1E293B] shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
                : 'bg-white border-[#E2E8F0] shadow-md shadow-slate-100'
            }`}>
              <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-inherit">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#38B1F7] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38B1F7]"></span>
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-[#38B1F7] uppercase">Live Wizard Walkthrough</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  Scenario: {scenario.serviceName}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDark ? 'bg-[#38B1F7]/20 text-[#38B1F7]' : 'bg-sky-100 text-[#129FF0]'
                  }`}>
                    {currentStep < 10 ? `0${currentStep}` : currentStep}
                  </div>
                  <div className="space-y-1 text-left">
                    <h4 className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {currentStep === 1 && "Step 1 — Choose a Support Option"}
                      {currentStep === 2 && (scenario.id === "billing" ? "Step 2 — Ticket Intake Form" : "Step 2 — Select Affected Domain")}
                      {currentStep === 3 && (scenario.id === "billing" ? "Step 3 — Review & Submit" : "Step 3 — Select Subscription & Service")}
                      {currentStep === 4 && (scenario.id === "billing" ? "Ticket Resolved!" : "Step 4 — Search Self-Help Articles")}
                      {currentStep === 5 && "Step 5 — Fill Intake Form & Submit"}
                    </h4>
                    <p className={`text-xs leading-relaxed transition-all duration-300 ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {currentStep === 1 && (
                        <>
                          {scenario.id === "workspace" && `The wizard launches. Sarah has two options: search the Knowledge Base for a quick self-help fix, or raise a formal support ticket. She clicks "Raise Ticket" to begin the guided wizard.`}
                          {scenario.id === "ssl" && `John's domain is down due to SSL failure. He opens OCS Helpdesk and taps "Raise Ticket" — the system triggers the full 5-step wizard for OCS-registered domains.`}
                          {scenario.id === "billing" && `The support portal opens. For billing queries, a simplified 4-step shortcut path is offered. John selects "Raise Ticket" to proceed directly to the intake form.`}
                        </>
                      )}
                      {currentStep === 2 && (
                        <>
                          {scenario.id === "workspace" && `Sarah selects her OCS-registered domain "techcorp.in" from the list. Since it's an OCS domain, the system unlocks subscription-level routing for smarter auto-assignment.`}
                          {scenario.id === "ssl" && `John sees "mybrand.com" listed under OCS-registered domains. He selects it — triggering the full 5-step workflow with subscription-matched routing and SLA enforcement.`}
                          {scenario.id === "billing" && `John fills the intake form: he types the issue title, selects "Billing" as the issue type, sets Low priority, and describes the missing invoice in the description field.`}
                        </>
                      )}
                      {currentStep === 3 && (
                        <>
                          {scenario.id === "workspace" && `Sarah picks the "Google Workspace Business Starter" plan and selects the "Google Workspace Mail" service. This context auto-fills the routing category for the support team.`}
                          {scenario.id === "ssl" && `John chooses his "Domain + SSL Bundle" subscription and selects "SSL Certificate" as the affected service — the wizard pre-fills category data for fast assignment.`}
                          {scenario.id === "billing" && `The routing engine sees "Billing / Renewals" and assigns the ticket directly to Manjula with a 48h SLA. The ticket ID is generated and an email confirmation is dispatched instantly.`}
                        </>
                      )}
                      {currentStep === 4 && (
                        <>
                          {scenario.id === "workspace" && `Before raising a ticket, Sarah sees a self-help article for "Google Workspace MX records". She reads it but still needs hands-on support, so she clicks "Still need help →".`}
                          {scenario.id === "ssl" && `The KB search auto-shows "SSL Certificate" guides. John reviews the renewal article but confirms the cert is already revoked — it isn't enough. He proceeds to raise the ticket.`}
                          {scenario.id === "billing" && `The ticket is resolved. Manjula reissues the invoice and confirms payment. John closes the ticket with a 5-star rating. Total SLA time: 1h 22m vs. 48h limit.`}
                        </>
                      )}
                      {currentStep === 5 && (
                        <>
                          {scenario.id === "workspace" && `Sarah fills the intake form then reviews the routing preview: Technical Support team, MEDIUM priority, 24h SLA. She confirms and submits. The team is notified by email instantly.`}
                          {scenario.id === "ssl" && `John fills the intake form with URGENT priority and "Critical / Outage" type. The routing preview shows escalation to L1 + L2. He submits and both levels are immediately notified.`}
                          {scenario.id === "billing" && `Ticket feedback is registered and archived. Total resolution: 1h 22m vs. 48h SLA target. Well within limits. Billing team KPI logged.`}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Right Column: New 5-Step Ticket Wizard Interactive Demo Player */}
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
                  {currentStep === 1 && "helpdesk.ocs365.in/customer/new-ticket?step=select-domain"}
                  {currentStep === 2 && (scenario.id === "billing" ? "helpdesk.ocs365.in/customer/new-ticket?step=intake" : "helpdesk.ocs365.in/customer/new-ticket?step=select-subscription")}
                  {currentStep === 3 && (scenario.id === "billing" ? "helpdesk.ocs365.in/customer/new-ticket?step=review" : "helpdesk.ocs365.in/customer/new-ticket?step=self-help")}
                  {currentStep === 4 && (scenario.id === "billing" ? "helpdesk.ocs365.in/customer/ticket/T-318" : "helpdesk.ocs365.in/customer/new-ticket?step=intake")}
                  {currentStep === 5 && "helpdesk.ocs365.in/customer/new-ticket?step=review"}
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
                                {/* ── STEP 1: CHOICE STEP ── */}
                {currentStep === 1 && (
                  <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Step 1: Select a Support Option
                          </h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-blue-950/60 text-[#38B1F7]' : 'bg-blue-50 text-[#129FF0]'
                        }`}>
                          Wizard Choice
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-grow items-stretch my-2 relative">
                      {/* Option 1: Self-Help */}
                      <div className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all opacity-80 ${
                        isDark ? 'bg-[#0F172A]/50 border-white/[0.04]' : 'bg-white border-slate-200'
                      }`}>
                        <div>
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <div className="p-1 rounded bg-[#38B1F7]/10 text-[#38B1F7]">
                              <BookOpen className="w-3 h-3" />
                            </div>
                            <span className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Option 1: Self-Help</span>
                          </div>
                          <p className="text-[8.5px] leading-relaxed text-slate-500">
                            Search guides (like password reset or config) to bypass the queue instantly.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">🔑 Passwords</span>
                          <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">📧 Outlook</span>
                        </div>
                      </div>

                      {/* Option 2: Raise Ticket */}
                      <div className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all duration-200 ${
                        stepProgress >= 70
                          ? isDark 
                            ? 'border-[#38B1F7] bg-[#38B1F7]/8 ring-1 ring-[#38B1F7]/30 shadow-md shadow-[#38B1F7]/5' 
                            : 'border-[#129FF0] bg-sky-50 ring-1 ring-[#129FF0]/30 shadow-sm shadow-[#129FF0]/5'
                          : isDark ? 'bg-[#0F172A]/50 border-white/[0.04]' : 'bg-white border-slate-200'
                      }`}>
                        <div>
                          <div className="flex items-center space-x-1.5 mb-1.5">
                            <div className="p-1 rounded bg-[#38B1F7]/10 text-[#38B1F7]">
                              <MessageSquare className="w-3 h-3" />
                            </div>
                            <span className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Option 2: Raise Ticket</span>
                          </div>
                          <p className="text-[8.5px] leading-relaxed text-slate-500">
                            Submit a support ticket. Routes to Manjula, Support, or Escalated L1+L2 queue.
                          </p>
                        </div>
                        <div className="space-y-1 text-[7.5px] font-mono mt-1.5 border-t border-slate-800/40 pt-1.5 text-slate-450">
                          <div className="flex justify-between">
                            <span>Billing:</span>
                            <span className="text-violet-400">→ Manjula</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tech Support:</span>
                            <span className="text-[#38B1F7]">→ Tech Team</span>
                          </div>
                        </div>
                      </div>

                      {/* Virtual Cursor Icon moving to select Option 2 */}
                      {stepProgress >= 15 && stepProgress < 75 && (
                        <div 
                          className="absolute pointer-events-none transition-all duration-300 ease-out z-30"
                          style={{
                            left: `${25 + (stepProgress - 15) * 0.8}%`,
                            top: `${180 - (stepProgress - 15) * 0.6}px`
                          }}
                        >
                          <svg className="w-4 h-4 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-black stroke-white" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Step 1 Success/Transition Toast Overlay */}
                    {stepProgress >= 75 && (
                      <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-slide-in">
                        <div className={`p-4 rounded-xl border max-w-xs text-center space-y-2 shadow-xl ${
                          isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'
                        }`}>
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-[#38B1F7] flex items-center justify-center mx-auto animate-spin">
                            <Clock className="w-5 h-5" />
                          </div>
                          <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>
                            Loading Ticket Wizard...
                          </h5>
                          <p className="text-[9px] text-[#64748B]">
                            Initializing Intake Form details for Option 2 Support Request...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── STEP 2: SELECT DOMAIN (or Intake for billing shortcut) ── */}
                {currentStep === 2 && (() => {
                  if (scenario.id === "billing") {
                    // Billing: No subscription step, go directly to Intake Form
                    return (
                      <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Database className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 2: Ticket Intake Form</h4>
                          </div>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-violet-950/60 text-violet-400' : 'bg-violet-50 text-violet-700'}`}>Intake Form</span>
                        </div>
                        <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                          <div className="grid grid-cols-3 gap-1">
                            {["Technical", "Billing", "General"].map(t => (
                              <div key={t} className={`text-[8px] py-1 rounded text-center border font-bold ${
                                t === "Billing"
                                  ? isDark ? "bg-violet-950/40 border-violet-500 text-violet-300" : "bg-violet-50 border-violet-400 text-violet-700"
                                  : "bg-slate-900/10 border-slate-700 text-slate-500"
                              }`}>
                                {t === "Billing" ? "💳 " : t === "Technical" ? "🛠️ " : "📋 "}{t}
                              </div>
                            ))}
                          </div>
                          <div className={`h-7 rounded-lg border text-[9px] px-2 flex items-center ${isDark ? 'bg-[#0F172A] border-[#38B1F7]/30 text-white' : 'bg-white border-[#38B1F7]/50 text-slate-800'}`}>
                            <span>{scenario.subject.substring(0, Math.floor(Math.min(stepProgress / 40, 1) * scenario.subject.length))}</span>
                            {stepProgress < 40 && <span className="w-1.5 h-3 ml-0.5 bg-violet-400 animate-pulse shrink-0 inline-block" />}
                          </div>
                          <div className={`h-7 rounded-lg border text-[8.5px] px-2 flex items-center justify-between ${isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-400' : 'bg-white border-[#E2E8F0] text-slate-600'}`}>
                            <span>Priority</span>
                            <span className={`font-bold text-[9px] ${scenario.priorityColor}`}>{scenario.priority}</span>
                          </div>
                          <div className={`h-11 rounded-lg border text-[9px] p-1.5 overflow-hidden leading-normal ${isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-300' : 'bg-white border-[#E2E8F0] text-slate-600'}`}>
                            {stepProgress >= 40 ? (
                              <span>{scenario.description.substring(0, Math.floor(Math.min((stepProgress - 40) / 45, 1) * scenario.description.length))}{stepProgress < 85 && <span className="w-1.5 h-3 ml-0.5 bg-violet-400 animate-pulse inline-block" />}</span>
                            ) : <span className="text-slate-500">Describe your issue...</span>}
                          </div>
                        </div>
                        <div className="pt-0.5 relative">
                          <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all ${stepProgress >= 88 ? 'bg-[#38B1F7] text-white scale-98' : 'bg-[#129FF0] text-white'}`}>
                            {stepProgress >= 88 ? <><RefreshCw className="w-3 h-3 animate-spin" /><span>Loading routing preview...</span></> : <><span>Continue to Review</span><ArrowRight className="w-3 h-3" /></>}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  // OCS path: Domain selection
                  return (
                    <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Globe className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 2: Select Affected Domain</h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-950/60 text-[#38B1F7]' : 'bg-blue-50 text-[#129FF0]'}`}>Domain Picker</span>
                      </div>
                      <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                        <span className={`text-[8px] font-extrabold uppercase tracking-wider ${isDark ? 'text-[#38b1f7]' : 'text-sky-700'}`}>Registered with OCS</span>
                        {[scenario.domain, "myothersite.com"].map((d, i) => {
                          const isSelected = i === 0 && stepProgress >= 40;
                          return (
                            <div key={d} className={`p-2 rounded-lg border flex items-center justify-between transition-all ${
                              isSelected
                                ? isDark ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]" : "bg-sky-50 border-[#38b1f7]"
                                : isDark ? "bg-slate-900/40 border-white/[0.04]" : "bg-white border-slate-200"
                            }`}>
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-[#38b1f7]/20 text-[#38b1f7]' : 'bg-slate-800/40 text-slate-500'}`}>
                                  <Globe className="w-3 h-3" />
                                </div>
                                <span className={`text-[9px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{d}</span>
                              </div>
                              {isSelected && <ChevronRight className="w-3 h-3 text-[#38b1f7] translate-x-0.5" />}
                            </div>
                          );
                        })}
                        <div className={`p-2 rounded-lg border border-dashed flex items-center gap-1.5 text-[8px] ${isDark ? 'border-amber-500/20 text-amber-400/80 bg-amber-950/10' : 'border-amber-300 text-amber-700 bg-amber-50/40'}`}>
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Non-OCS domains billed at support rates</span>
                        </div>
                      </div>
                      <div className="pt-0.5 relative">
                        <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all ${stepProgress >= 85 ? 'bg-[#38B1F7] text-white scale-98' : 'bg-[#129FF0] text-white'}`}>
                          {stepProgress >= 85 ? <><RefreshCw className="w-3 h-3 animate-spin" /><span>Loading subscriptions...</span></> : <><span>Next: Select Service</span><ArrowRight className="w-3 h-3" /></>}
                        </button>
                        {stepProgress >= 40 && stepProgress < 85 && (
                          <div className="absolute pointer-events-none transition-all duration-300 ease-out z-30" style={{ left: `${50 + (stepProgress - 40) * 1.1}%`, top: `${190 + (stepProgress - 40) * 2}px` }}>
                            <svg className="w-4 h-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] fill-black stroke-white" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── STEP 3: SUBSCRIPTION & SERVICE (OCS) / REVIEW (Billing) ── */}
                {currentStep === 3 && (() => {
                  if (scenario.id === "billing") {
                    // Billing: Review & Submit step
                    return (
                      <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Shield className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 3: Review & Submit</h4>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-violet-950/40 text-violet-400">Routing Preview</span>
                        </div>
                        <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                          <div className={`p-2 rounded-lg border space-y-0.5 ${isDark ? 'bg-[#0F172A]/70 border-white/[0.04]' : 'bg-white border-slate-200'}`}>
                            <div className="text-[7.5px] font-mono text-slate-500"><span className="text-violet-400 font-bold">RECAP</span> • <span className={`${scenario.priorityColor} font-semibold`}>{scenario.priority} Priority</span></div>
                            <div className={`text-[9px] font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{scenario.subject}</div>
                          </div>
                          <div className={`p-2 rounded-lg border flex flex-col gap-1 ${isDark ? scenario.routingBg.dark : scenario.routingBg.light}`}>
                            <div className="flex items-center gap-1.5">
                              <Receipt className={`w-3 h-3 ${scenario.routingColor}`} />
                              <span className={`text-[9px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scenario.routingDept}</span>
                            </div>
                            <p className={`text-[8px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Assigned to: {scenario.routingWho}</p>
                            <div className={`flex justify-between text-[7.5px] font-mono border-t border-slate-700/30 pt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                              <span>SLA:</span><span className={`${scenario.priorityColor} font-bold`}>{scenario.slaLimit}</span>
                            </div>
                          </div>
                        </div>
                        <div className="relative">
                          <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all ${stepProgress >= 90 ? 'bg-[#38B1F7] text-white scale-98' : 'bg-[#129FF0] text-white'}`}>
                            {stepProgress >= 90 ? <><Clock className="w-3 h-3 animate-spin" /><span>Creating Ticket...</span></> : <><Send className="w-3 h-3" /><span>Submit Support Request</span></>}
                          </button>
                          {stepProgress >= 94 && (
                            <div className="absolute inset-0 bg-[#030712]/60 backdrop-blur-xs flex items-center justify-center z-40 animate-slide-in rounded-xl">
                              <div className={`p-3 rounded-xl border text-center space-y-1.5 shadow-xl ${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'}`}>
                                <div className="w-7 h-7 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto animate-bounce"><CheckCircle2 className="w-4 h-4" /></div>
                                <h5 className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Ticket Dispatched!</h5>
                                <p className="text-[8px] text-[#64748B]">Notifying {scenario.routingWho} with SLA timer set.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  // OCS path: Subscription & Service selection
                  return (
                    <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 3: Select Service</h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-950/60 text-[#38B1F7]' : 'bg-blue-50 text-[#129FF0]'}`}>Service Picker</span>
                      </div>
                      <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                        <div className={`p-2.5 rounded-xl border space-y-2 ${isDark ? 'bg-slate-900/40 border-[#38b1f7]/20' : 'bg-sky-50/30 border-[#38b1f7]/40'}`}>
                          <div className="flex items-center gap-2 border-b border-dashed border-slate-700/30 pb-1.5">
                            <CreditCard className="w-3 h-3 text-[#38b1f7]" />
                            <span className={`text-[9px] font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{scenario.subscriptionPlan}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[scenario.serviceName2, "DNS Management"].map((svc, i) => {
                              const isSelected = i === 0 && stepProgress >= 45;
                              return (
                                <div key={svc || i} className={`p-1.5 rounded-lg border flex items-center gap-1.5 transition-all ${
                                  isSelected
                                    ? isDark ? "bg-[#38b1f7]/15 border-[#38b1f7]" : "bg-sky-100/70 border-[#38b1f7]"
                                    : isDark ? "bg-slate-950/20 border-white/[0.04]" : "bg-white border-slate-200"
                                }`}>
                                  <Server className={`w-2.5 h-2.5 ${isSelected ? 'text-[#38b1f7]' : 'text-slate-400'}`} />
                                  <span className={`text-[8px] truncate ${isSelected ? isDark ? 'text-white' : 'text-[#0c7fc0]' : isDark ? 'text-slate-400' : 'text-slate-600'}`}>{svc}</span>
                                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#38b1f7] ml-auto shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div className={`p-2 rounded-lg border flex items-center gap-2 ${isDark ? 'bg-slate-900/40 border-white/[0.04]' : 'bg-white border-slate-200'}`}>
                          <HelpCircle className="w-3 h-3 text-slate-400" />
                          <span className={`text-[8.5px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>General Support / Other Issues</span>
                        </div>
                      </div>
                      <div className="relative">
                        <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all ${stepProgress >= 85 ? 'bg-[#38B1F7] text-white scale-98' : 'bg-[#129FF0] text-white'}`}>
                          {stepProgress >= 85 ? <><RefreshCw className="w-3 h-3 animate-spin" /><span>Loading KB articles...</span></> : <><span>Next: Suggested Solutions</span><ArrowRight className="w-3 h-3" /></>}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* ── STEP 4: KB SELF-HELP SEARCH (OCS) / RESOLUTION (Billing) ── */}
                {currentStep === 4 && (() => {
                  if (scenario.id === "billing") {
                    // Billing: Show resolution/feedback
                    return (
                      <div className="space-y-3 animate-slide-in h-full flex flex-col justify-between mt-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 animate-pulse" />
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Ticket Resolved</h4>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-green-950/40 text-green-400">Closed</span>
                        </div>
                        <div className="space-y-2 flex-grow justify-center flex flex-col text-left">
                          <div className={`p-2.5 rounded-lg border grid grid-cols-3 gap-2 text-center ${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'}`}>
                            <div className="space-y-0.5"><span className="text-[7px] uppercase tracking-wider text-slate-500 font-semibold">SLA Limit</span><div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{scenario.slaLimit}</div></div>
                            <div className="space-y-0.5 border-x border-slate-700/40"><span className="text-[7px] uppercase tracking-wider text-[#38B1F7] font-semibold">Resolved In</span><div className="text-xs font-bold text-green-500">{scenario.slaActual}</div></div>
                            <div className="space-y-0.5"><span className="text-[7px] uppercase tracking-wider text-slate-500 font-semibold">Status</span><div className="text-[9px] font-bold text-green-400 bg-green-500/10 px-1.5 rounded-md inline-block">SLA MET</div></div>
                          </div>
                          <div className={`p-2 rounded-lg border text-[9px] ${isDark ? 'bg-[#030712] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'}`}>
                            <div className={`font-semibold mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Resolution:</div>
                            <div className={`leading-normal ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{scenario.solution}</div>
                          </div>
                          <div className="flex justify-center gap-1">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 transition-all ${stepProgress >= 45 + s * 8 ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-slate-600'}`} />)}
                          </div>
                        </div>
                        {stepProgress >= 82 && (
                          <div className="absolute inset-0 bg-[#030712]/75 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-slide-in">
                            <div className={`p-4 rounded-xl border max-w-xs text-center space-y-2.5 shadow-xl ${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'}`}>
                              <div className="w-9 h-9 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto"><ThumbsUp className="w-5 h-5 animate-pulse" /></div>
                              <h5 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Ticket Closed</h5>
                              <p className="text-[8.5px] text-[#64748B] mt-0.5">{scenario.serviceName} session complete. SLA met.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  // OCS path: KB Self-Help search
                  return (
                    <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Search className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 4: Self-Help Articles</h4>
                        </div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-emerald-950/60 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>KB Search</span>
                      </div>
                      <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                        <div className={`h-8 rounded-lg border flex items-center px-2.5 gap-2 ${isDark ? 'bg-[#0F172A] border-[#38b1f7]/40' : 'bg-white border-[#38b1f7]/60'}`}>
                          <Search className="w-3 h-3 text-[#38b1f7] shrink-0" />
                          <span className={`text-[9px] flex-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            {scenario.kbHit ? scenario.kbHit.substring(0, Math.floor(Math.min(stepProgress / 30, 1) * (scenario.kbHit.length))) : ""}
                          </span>
                          {stepProgress < 30 && <span className="w-1.5 h-3 bg-[#38B1F7] animate-pulse shrink-0 inline-block" />}
                        </div>
                        {stepProgress >= 30 && scenario.kbHit && (
                          <div className={`p-2.5 rounded-xl border flex flex-col gap-1 transition-all ${
                            stepProgress >= 55
                              ? isDark ? 'border-[#38b1f7]/40 bg-sky-950/20' : 'border-[#38b1f7] bg-sky-50'
                              : isDark ? 'bg-slate-900/50 border-white/[0.05]' : 'bg-white border-slate-200'
                          }`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className={`text-[9px] font-bold mb-0.5 truncate ${isDark ? 'text-[#38b1f7]' : 'text-[#0d7fc0]'}`}>{scenario.kbHit}</p>
                                <p className="text-[7.5px] text-slate-500 line-clamp-2">Step-by-step guide to configure records and verify DNS propagation...</p>
                              </div>
                              <BookOpen className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-1 flex-wrap">
                          <span className={`px-2 py-0.5 text-[8px] rounded-full border ${isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>🔑 Password Reset</span>
                          <span className={`px-2 py-0.5 text-[8px] rounded-full border ${isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>📧 Outlook Config</span>
                        </div>
                        {stepProgress >= 55 && (
                          <div className="grid grid-cols-2 gap-1.5 mt-1">
                            <div className="px-2 py-1.5 text-center text-[8px] font-semibold rounded-lg border border-emerald-500/20 text-emerald-400 bg-emerald-950/20">✅ Article solved it</div>
                            <div className={`px-2 py-1.5 text-center text-[8px] font-bold rounded-lg bg-[#129FF0] text-white transition-all ${stepProgress >= 75 ? 'scale-105 shadow-md' : ''}`}>❌ Still need help →</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* ── STEP 5: INTAKE FORM THEN REVIEW & SUBMIT (OCS) ── */}
                {currentStep === 5 && (() => {
                  const isCritical = scenario.issueType === 'critical';
                  const isFirstHalf = stepProgress < 50;
                  if (isFirstHalf) {
                    // Show intake form filling animation
                    return (
                      <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <Database className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                            <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 5a: Ticket Intake Form</h4>
                          </div>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-950/60 text-[#38B1F7]' : 'bg-blue-50 text-[#129FF0]'}`}>Intake Form</span>
                        </div>
                        <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                          <div className="grid grid-cols-3 gap-1">
                            {["Technical", "Billing", "Critical"].map(t => {
                              const isSelectedType = (t === "Critical" && isCritical) || (t === "Technical" && !isCritical);
                              return (
                                <div key={t} className={`text-[8px] py-1 rounded text-center border font-bold ${
                                  isSelectedType
                                    ? isCritical
                                      ? isDark ? "bg-red-950/40 border-red-500 text-red-300" : "bg-red-50 border-red-400 text-red-700"
                                      : isDark ? "bg-sky-950/40 border-[#38B1F7] text-[#38B1F7]" : "bg-sky-50 border-[#129FF0] text-[#129FF0]"
                                    : "bg-slate-900/10 border-slate-700 text-slate-500"
                                }`}>
                                  {t === "Billing" ? "💳 " : t === "Critical" ? "🚨 " : "🛠️ "}{t}
                                </div>
                              );
                            })}
                          </div>
                          <div className={`h-7 rounded-lg border text-[9px] px-2 flex items-center ${isCritical ? isDark ? 'bg-red-950/20 border-red-500/40 text-white' : 'bg-red-50 border-red-300 text-slate-800' : isDark ? 'bg-[#0F172A] border-[#38B1F7]/30 text-white' : 'bg-white border-[#38B1F7]/50 text-slate-800'}`}>
                            <span>{scenario.subject.substring(0, Math.floor(Math.min(stepProgress / 25, 1) * scenario.subject.length))}</span>
                            {stepProgress < 25 && <span className={`w-1.5 h-3 ml-0.5 animate-pulse shrink-0 inline-block ${isCritical ? 'bg-red-400' : 'bg-[#38B1F7]'}`} />}
                          </div>
                          <div className={`h-7 rounded-lg border text-[8.5px] px-2 flex items-center justify-between ${isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-400' : 'bg-white border-[#E2E8F0] text-slate-600'}`}>
                            <span>Priority</span>
                            <span className={`font-bold text-[9px] ${scenario.priorityColor}`}>{scenario.priority}</span>
                          </div>
                          <div className={`h-11 rounded-lg border text-[9px] p-1.5 overflow-hidden ${isDark ? 'bg-[#0F172A] border-[#1E293B] text-slate-300' : 'bg-white border-[#E2E8F0] text-slate-600'}`}>
                            {stepProgress >= 25 ? (
                              <span>{scenario.description.substring(0, Math.floor(Math.min((stepProgress - 25) / 25, 1) * scenario.description.length))}{stepProgress < 50 && <span className={`w-1.5 h-3 ml-0.5 animate-pulse inline-block ${isCritical ? 'bg-red-400' : 'bg-[#38B1F7]'}`} />}</span>
                            ) : <span className="text-slate-500">Describe your issue in detail...</span>}
                          </div>
                        </div>
                        <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 ${isCritical ? 'bg-red-500 text-white' : 'bg-[#129FF0] text-white'}`}>
                          <span>Continue to Review</span><ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  }
                  // Second half: Review & Submit
                  return (
                    <div className="space-y-2 animate-slide-in h-full flex flex-col justify-between mt-1 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <Shield className="w-3.5 h-3.5 text-[#38B1F7] animate-pulse" />
                          <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Step 5b: Review & Submit</h4>
                        </div>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950/40 text-purple-400">Routing Preview</span>
                      </div>
                      <div className="space-y-1.5 flex-grow justify-center flex flex-col">
                        <div className={`p-2 rounded-lg border flex items-center justify-between ${isDark ? 'bg-slate-900/40 border-white/[0.04]' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-1.5"><Globe className="w-3 h-3 text-[#38b1f7]" /><span className={`text-[9px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scenario.domain}</span></div>
                          <div className="flex items-center gap-1.5"><Server className="w-3 h-3 text-emerald-400" /><span className={`text-[8.5px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{scenario.serviceName2}</span></div>
                        </div>
                        <div className={`p-2 rounded-lg border space-y-0.5 ${isDark ? 'bg-[#0F172A]/70 border-white/[0.04]' : 'bg-white border-slate-200'}`}>
                          <div className="text-[7.5px] font-mono text-slate-500"><span className="text-[#38B1F7] font-bold">RECAP</span> • <span className={`${scenario.priorityColor} font-semibold`}>{scenario.priority} Priority</span></div>
                          <div className={`text-[9px] font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{scenario.subject}</div>
                        </div>
                        <div className={`p-2 rounded-lg border flex flex-col gap-1 ${isDark ? scenario.routingBg.dark : scenario.routingBg.light}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {isCritical ? <ShieldAlert className={`w-3 h-3 ${scenario.routingColor}`} /> : <Cpu className={`w-3 h-3 ${scenario.routingColor}`} />}
                              <span className={`text-[9px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{scenario.routingDept}</span>
                            </div>
                            {(scenario as any).escalated && <span className="text-[7.5px] font-bold px-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/25">ESCALATED</span>}
                          </div>
                          <p className={`text-[8px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{(scenario as any).escalated ? 'Escalating to L1 and Manager L2 simultaneously.' : `Assigned to: ${scenario.routingWho}`}</p>
                          <div className={`flex justify-between text-[7.5px] font-mono border-t border-slate-700/30 pt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}><span>SLA:</span><span className={`${scenario.priorityColor} font-bold`}>{scenario.slaLimit}</span></div>
                        </div>
                      </div>
                      <div className="relative">
                        <button className={`w-full h-7 rounded-lg font-bold text-[9px] flex items-center justify-center gap-1.5 transition-all ${stepProgress >= 90 ? (isCritical ? 'bg-red-500 text-white scale-98' : 'bg-[#38B1F7] text-white scale-98') : (isCritical ? 'bg-red-500 text-white' : 'bg-[#129FF0] text-white')}`}>
                          {stepProgress >= 90 ? <><Clock className="w-3 h-3 animate-spin" /><span>Creating Ticket...</span></> : <><Send className="w-3 h-3" /><span>Submit Support Request</span></>}
                        </button>
                        {stepProgress >= 94 && (
                          <div className="absolute inset-0 -top-24 bg-[#030712]/60 backdrop-blur-xs flex items-center justify-center z-40 p-4 animate-slide-in">
                            <div className={`p-3 rounded-xl border text-center space-y-1.5 shadow-xl ${isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-[#E2E8F0]'}`}>
                              <div className="w-7 h-7 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mx-auto animate-bounce"><CheckCircle2 className="w-4 h-4" /></div>
                              <h5 className={`text-[10px] font-bold ${isDark ? 'text-white' : 'text-[#0F172A]'}`}>Ticket Generated & Dispatched</h5>
                              <p className="text-[8px] text-[#64748B]">Notifying {(scenario as any).escalated ? "L1 & Manager L2" : scenario.routingWho}. SLA timer active.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Mockup Timeline — 5 steps (3 for billing shortcut) */}
              <div className={`px-4 py-2 border-t flex items-center space-x-3 transition-colors ${
                isDark ? 'bg-[#0A0F1E] border-[#1E293B]' : 'bg-slate-50 border-[#E2E8F0]'
              }`}>
                <div className={`grid gap-1 flex-grow ${scenario.id === 'billing' ? 'grid-cols-4' : 'grid-cols-5'}`}>
                  {(scenario.id === 'billing' ? [1, 2, 3, 4] : [1, 2, 3, 4, 5]).map((step) => {
                    const isActive = currentStep === step;
                    const isPassed = currentStep > step;
                    const billingLabels: Record<number, string> = { 1: "Option", 2: "Intake", 3: "Submit", 4: "Done" };
                    const ocsLabels: Record<number, string> = { 1: "Option", 2: "Domain", 3: "Service", 4: "KB", 5: "Review" };
                    const label = scenario.id === 'billing' ? billingLabels[step] : ocsLabels[step];
                    return (
                      <button 
                        key={step} 
                        onClick={() => handleStepSelect(step as 1 | 2 | 3 | 4 | 5)}
                        className="space-y-1 group relative focus:outline-none"
                      >
                        <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                          isActive ? 'bg-[#129FF0]' : isPassed ? 'bg-green-500' : isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}>
                          {isActive && <div className="h-full bg-[#38B1F7] rounded-full transition-all duration-100" style={{ width: `${stepProgress}%` }} />}
                        </div>
                        <span className={`block text-[7px] font-semibold text-center transition-all ${
                          isActive ? isDark ? 'text-white font-bold' : 'text-slate-900 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                        }`}>
                          {step}. {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Player Control Bar */}
              <div className={`px-4 py-2.5 border-t flex items-center justify-between transition-colors ${
                isDark ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-[#F8FAFC] border-[#E2E8F0]'
              }`}>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                      isDark ? 'border-[#1E293B] hover:border-[#38B1F7]/30 text-[#38B1F7] bg-[#030712]/30' : 'border-[#E2E8F0] hover:border-[#129FF0]/30 text-[#129FF0] bg-white'
                    }`}
                    title={isPlaying ? "Pause walkthrough animation" : "Resume walkthrough animation"}
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-[#38B1F7]" /> : <Play className="w-3.5 h-3.5 fill-[#129FF0]" />}
                  </button>
                  <button 
                    onClick={() => { setCurrentStep(1); setStepProgress(0); }}
                    className={`p-1.5 rounded-lg border transition-all active:scale-95 flex items-center justify-center ${
                      isDark ? 'border-[#1E293B] text-slate-400 hover:text-white bg-[#030712]/30' : 'border-[#E2E8F0] text-slate-500 hover:text-slate-800 bg-white'
                    }`}
                    title="Restart from beginning"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="hidden sm:flex items-center space-x-1">
                  <span className={`text-[9px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Step:</span>
                  <span className="text-[9px] font-mono font-bold text-[#38B1F7]">{currentStep < 10 ? `0${currentStep}` : currentStep}</span>
                  <span className="text-[9px] font-mono text-slate-500">/</span>
                  <span className="text-[9px] font-mono text-slate-500">{scenario.id === 'billing' ? '04' : '05'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[8.5px] font-mono text-slate-500 mr-1">Speed:</span>
                  <div className={`flex rounded-lg p-0.5 space-x-0.5 text-[8.5px] font-bold transition-colors ${isDark ? 'bg-[#030712] border border-[#1E293B]' : 'bg-slate-100 border border-[#E2E8F0]'}`}>
                    {([1, 1.5, 2] as const).map((speed) => (
                      <button key={speed} onClick={() => setPlaySpeed(speed)}
                        className={`px-1.5 py-0.5 rounded transition-all duration-100 ${playSpeed === speed ? 'bg-[#129FF0] text-[#020617] font-extrabold' : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
                className="inline-flex items-center justify-center h-10 px-4 bg-[#129FF0] hover:bg-[#38B1F7] text-white font-bold text-xs rounded-xl transition-all active:scale-98"
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
              <OcsLogo className="h-5 w-auto shrink-0" color="#38b1f7" />
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
