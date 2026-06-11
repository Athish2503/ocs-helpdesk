"use client";

import { useAuth } from "../../../context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { fetchWithAuth } from "../../../lib/api";
import {
  Plus,
  MessageSquare,
  CheckCircle,
  X,
  Send,
  Calendar,
  Settings,
  BookOpen,
  BarChart2,
  Lock,
  ChevronRight,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface TicketMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    role: "CUSTOMER" | "AGENT" | "ADMIN";
  };
}

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  categoryId: string;
  category: Category;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  messages?: TicketMessage[];
}

export default function CustomerDashboard() {
  const { user, logout, loading } = useAuth();
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }
    }
    return "light";
  });

  useEffect(() => {
    // Sync theme if it changes in other tabs
    const handleStorage = () => {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark" || savedTheme === "light") {
        setTheme(savedTheme);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const isDark = theme === 'dark';
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "tickets">("dashboard");

  // Dynamic ticket states
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  // Ticket detail state (split screen or slide out drawer)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [detailedTicket, setDetailedTicket] = useState<Ticket | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [submittingMessage, setSubmittingMessage] = useState(false);

  // Modal / Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch helper for categories
  const loadCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await fetchWithAuth("/categories");
      if (res.ok) {
        const body = await res.json();
        setCategories(body.data.categories || []);
        if (body.data.categories?.length > 0) {
          setCreateForm(prev => ({ ...prev, categoryId: body.data.categories[0].id }));
        }
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Fetch helper for tickets
  const loadTickets = useCallback(async (showSkeleton = true) => {
    try {
      if (showSkeleton) setLoadingTickets(true);
      const res = await fetchWithAuth("/tickets");
      if (res.ok) {
        const body = await res.json();
        setTickets(body.data.tickets || []);
      }
    } catch (err) {
      console.error("Failed to load tickets:", err);
    } finally {
      if (showSkeleton) setLoadingTickets(false);
    }
  }, []);

  // Fetch detailed ticket messages
  const loadTicketDetails = useCallback(async (ticketId: string) => {
    try {
      setLoadingDetails(true);
      const res = await fetchWithAuth(`/tickets/${ticketId}`);
      if (res.ok) {
        const body = await res.json();
        const ticketData = body.data.ticket as Ticket;
        setDetailedTicket(ticketData);
        setMessages(ticketData.messages || []);
      }
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  // Sync initial load
  useEffect(() => {
    if (user) {
      loadTickets();
      loadCategories();
    }
  }, [user, loadTickets, loadCategories]);

  // Sync details when selection changes
  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    } else {
      setDetailedTicket(null);
      setMessages([]);
    }
  }, [selectedTicketId, loadTicketDetails]);

  // Submit Ticket Creation
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title || !createForm.description || !createForm.categoryId) {
      setCreateError("Please fill out all fields.");
      return;
    }

    try {
      setSubmittingCreate(true);
      setCreateError(null);
      const res = await fetchWithAuth("/tickets", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      const resBody = await res.json();
      if (res.ok) {
        // Ticket created successfully! Reload list and close modal
        await loadTickets(false);
        setCreateForm({
          title: "",
          description: "",
          categoryId: categories[0]?.id || "",
          priority: "MEDIUM",
        });
        setShowCreateModal(false);
      } else {
        setCreateError(resBody.error?.message || "Failed to create support ticket.");
      }
    } catch (err) {
      console.error("Ticket creation error:", err);
      setCreateError("Unable to connect to the server.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Submit Reply Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicketId) return;

    try {
      setSubmittingMessage(true);
      const res = await fetchWithAuth(`/tickets/${selectedTicketId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        const resBody = await res.json();
        const createdMessage = resBody.data.message as TicketMessage;
        setMessages(prev => [...prev, createdMessage]);
        setNewMessage("");
        // Reload ticket lists in background to update sorting
        loadTickets(false);
      }
    } catch (err) {
      console.error("Message send error:", err);
    } finally {
      setSubmittingMessage(false);
    }
  };

  // Resolve / Close ticket quick action
  const handleResolveTicket = async () => {
    if (!selectedTicketId) return;

    try {
      const res = await fetchWithAuth(`/tickets/${selectedTicketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "RESOLVED" }),
      });

      if (res.ok) {
        const resBody = await res.json();
        setDetailedTicket(resBody.data.ticket as Ticket);
        // Sync list
        setTickets(prev =>
          prev.map(t => (t.id === selectedTicketId ? { ...t, status: "RESOLVED" } : t))
        );
      }
    } catch (err) {
      console.error("Resolve ticket error:", err);
    }
  };

  const formatJoinedDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatusStyle = (status: Ticket["status"]) => {
    if (isDark) {
      switch (status) {
        case "OPEN":
          return "bg-blue-950/50 text-blue-400 border-blue-500/20";
        case "IN_PROGRESS":
          return "bg-amber-950/50 text-amber-400 border-amber-500/20";
        case "RESOLVED":
          return "bg-green-950/50 text-green-400 border-green-500/20";
        case "CLOSED":
          return "bg-slate-900 text-slate-400 border-slate-700/30";
        default:
          return "bg-zinc-800 text-zinc-400 border-zinc-700";
      }
    } else {
      switch (status) {
        case "OPEN":
          return "bg-blue-50 text-blue-700 border-blue-200";
        case "IN_PROGRESS":
          return "bg-amber-50 text-amber-700 border-amber-200";
        case "RESOLVED":
          return "bg-green-50 text-green-700 border-green-200";
        case "CLOSED":
          return "bg-slate-100 text-slate-600 border-slate-200";
        default:
          return "bg-slate-50 text-slate-500 border-slate-200";
      }
    }
  };

  const getPriorityStyle = (priority: Ticket["priority"]) => {
    if (isDark) {
      switch (priority) {
        case "URGENT":
          return "text-red-400 border-red-500/20 bg-red-950/30";
        case "HIGH":
          return "text-orange-400 border-orange-500/20 bg-orange-950/30";
        case "MEDIUM":
          return "text-yellow-400 border-yellow-500/20 bg-yellow-950/30";
        case "LOW":
          return "text-slate-400 border-slate-700/20 bg-slate-800/20";
      }
    } else {
      switch (priority) {
        case "URGENT":
          return "text-red-700 border-red-200 bg-red-50";
        case "HIGH":
          return "text-orange-700 border-orange-200 bg-orange-50";
        case "MEDIUM":
          return "text-yellow-700 border-yellow-200 bg-yellow-50";
        case "LOW":
          return "text-slate-600 border-slate-200 bg-slate-100/50";
      }
    }
  };

  // ── SKELETON LOADING STATE (Mandated: No full-page blocking spinners) ─────
  if (loading || !user) {
    const isDarkTheme = typeof window !== "undefined" && localStorage.getItem("theme") === "dark";
    const sk = isDarkTheme ? "skeleton" : "skeleton-light";
    
    return (
      <div className={`min-h-screen flex font-body select-none transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}>
        {/* Sidebar Skeleton */}
        <aside className={`w-[280px] border-r p-6 flex flex-col justify-between hidden md:flex ${
          isDarkTheme ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-slate-200/80'
        }`}>
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-lg ${sk}`}></div>
              <div className={`h-5 w-24 ${sk}`}></div>
            </div>
            <div className="space-y-4">
              <div className={`h-10 w-full ${sk}`}></div>
              <div className={`h-10 w-full ${sk}`}></div>
              <div className={`h-10 w-full ${sk}`}></div>
            </div>
          </div>
          <div className={`h-12 w-full ${sk}`}></div>
        </aside>

        {/* Content Shell Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar Skeleton */}
          <header className={`h-[72px] border-b px-8 flex items-center justify-between ${
            isDarkTheme ? 'bg-[#0F172A] border-[#1E293B]' : 'bg-white border-slate-200/80'
          }`}>
            <div className={`h-6 w-48 ${sk}`}></div>
            <div className={`h-8 w-24 ${sk}`}></div>
          </header>

          {/* Main Dashboard Space Skeleton */}
          <main className="flex-grow p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <div className={`h-32 w-full ${sk}`}></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className={`h-44 w-full ${sk}`}></div>
              <div className={`h-44 w-full ${sk}`}></div>
              <div className={`h-44 w-full ${sk}`}></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const activeTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedTicketsCount = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const resolutionRate = tickets.length > 0 ? Math.round((resolvedTicketsCount / tickets.length) * 100) : 100;

  return (
    <div className={`min-h-screen flex font-body selection:bg-[#38b1f7]/30 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
    }`}>
      {/* Background cyber grid and glow orbs */}
      <div className={`absolute inset-0 grid-bg pointer-events-none z-0 transition-opacity duration-300 ${
        isDark ? 'opacity-40' : 'opacity-10'
      }`}></div>
      <div className={`absolute top-[-10%] right-[-10%] w-[500px] h-[500px] z-0 animate-float-1 pointer-events-none rounded-full blur-[100px] ${
        isDark ? 'bg-[#38b1f7]/15' : 'bg-[#38b1f7]/5'
      }`}></div>
      <div className={`absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] z-0 animate-float-2 pointer-events-none rounded-full blur-[100px] ${
        isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/3'
      }`}></div>

      {/* 1. Sidebar Navigation (Width: 280px) */}
      <aside className={`w-[280px] border-r p-6 flex flex-col justify-between hidden md:flex shrink-0 z-10 transition-colors duration-300 ${
        isDark 
          ? 'bg-[#0F172A]/70 backdrop-blur-md border-[#1E293B] text-[#F8FAFC]' 
          : 'bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-800'
      }`}>
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#38b1f7] flex items-center justify-center shadow-[0_0_15px_rgba(56,177,247,0.4)]">
              <span className="font-extrabold text-[#020617] text-md">Ω</span>
            </div>
            <div>
              <h2 className={`font-bold text-sm transition-colors ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>OCS Helpdesk</h2>
              <p className={`text-[9px] font-mono tracking-wider uppercase ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Portal Client</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTicketId(null); }}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "dashboard"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BarChart2 className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </button>
            
            <button
              onClick={() => { setActiveTab("tickets"); setSelectedTicketId(null); }}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "tickets"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>My Tickets</span>
              </div>
              {activeTicketsCount > 0 && (
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark ? 'bg-[#38b1f7] text-[#020617]' : 'bg-[#38b1f7] text-white'
                }`}>
                  {activeTicketsCount}
                </span>
              )}
            </button>

            <button
              disabled
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide cursor-not-allowed opacity-40 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4" />
                <span>Knowledge Base</span>
              </div>
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${
                isDark ? 'bg-zinc-900 text-zinc-400 border-white/[0.03]' : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                Sprint 2
              </span>
            </button>

            <button
              disabled
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide cursor-not-allowed opacity-40 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Section */}
        <div className={`p-3 rounded-xl border flex flex-col space-y-3 transition-colors ${
          isDark ? 'bg-[#111827]/80 border-[#1E293B]' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 border ${
              isDark 
                ? 'bg-[#38b1f7]/20 border-[#38b1f7]/20 text-[#38b1f7]' 
                : 'bg-[#38b1f7]/10 border-[#38b1f7]/20 text-[#0d7fc0]'
            }`}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-semibold truncate ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>{user.name}</p>
              <p className={`text-[9px] font-mono uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className={`w-full h-8 flex items-center justify-center text-[11px] font-bold rounded-lg transition-all duration-150 active:scale-98 ${
              isDark 
                ? 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40' 
                : 'text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600'
            }`}
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* 2. Main Work Shell */}
      <div className="flex-grow flex flex-col overflow-hidden z-10">
        {/* Top Bar Navigation (Height: 72px) */}
        <header className={`h-[72px] backdrop-blur-md border-b px-8 flex items-center justify-between shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white/80 border-slate-200/80'
        }`}>
          <div>
            <h1 className={`font-bold text-lg tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
              {activeTab === "dashboard" ? "Dashboard Overview" : "My Support Tickets"}
            </h1>
            <p className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              {activeTab === "dashboard" ? "Metrics and active support overview" : "View, manage, and discuss your submitted issues"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all duration-200 active:scale-95 ${
                isDark 
                  ? 'border-[#1E293B] hover:border-[#38b1f7]/30 text-yellow-400 hover:bg-white/5' 
                  : 'border-slate-200 hover:border-[#38b1f7]/30 text-slate-700 hover:bg-slate-100'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => {
                loadTickets(true);
                if (selectedTicketId) loadTicketDetails(selectedTicketId);
              }}
              className={`p-2 rounded border transition-colors ${
                isDark 
                  ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/30 text-[#94A3B8] hover:text-[#F8FAFC]' 
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(loadingTickets || loadingDetails) ? "animate-spin text-[#38b1f7]" : ""}`} />
            </button>
            {/* <div className={`flex items-center space-x-2 px-3 py-1 rounded text-[11px] font-semibold font-mono border ${
              isDark 
                ? 'bg-green-950/40 border-green-500/20 text-[#12B76A]' 
                : 'bg-green-50 border-green-200 text-[#027a48]'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
              <span>API: Connected</span>
            </div> */}
            {/* Small Mobile Logout */}
            <button
              onClick={() => logout()}
              className={`md:hidden text-xs font-bold px-3 py-1.5 rounded-lg border ${
                isDark 
                  ? 'bg-[#111827] border-[#1E293B] text-red-400 hover:text-white' 
                  : 'bg-white border-slate-200 text-red-600 hover:bg-slate-50'
              }`}
            >
              Logout
            </button>
          </div>
        </header>

        {/* 3. Main Dashboard Scroll Area */}
        <div className="flex-grow flex overflow-hidden">
          <main className="flex-grow overflow-y-auto p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6">
            
            {activeTab === "dashboard" && (
              <>
                {/* Welcome Announcement Board */}
                <section className={`p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-300 border ${
                  isDark 
                    ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' 
                    : 'bg-white border-slate-200/80 shadow-sm rounded-2xl'
                }`}>
                  <div className="space-y-2">
                    <h2 className={`text-xl md:text-2xl font-bold tracking-tight transition-colors ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
                      Welcome to OCS Helpdesk, <span className="text-[#38b1f7]">{user.name}</span>
                    </h2>
                    <p className={`text-sm max-w-xl transition-colors ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
                      Create, track, and discuss your support issues. Add detailed descriptions and chat in real-time with customer service representatives.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`btn-cyber flex items-center space-x-2 ${isDark ? 'text-black' : 'text-white'}`}
                  >
                    <Plus className={`w-4 h-4 ${isDark ? 'text-[#005d89]' : 'text-white'}`} />
                    <span className={isDark ? 'text-[#005d89]' : 'text-white'}>Create Ticket</span>
                  </button>
                </section>

                {/* Cards metrics system */}
                <section className="grid md:grid-cols-3 gap-6">
                  {/* Customer profile details */}
                  <div className={`p-6 flex flex-col justify-between min-h-[160px] border transition-colors duration-300 rounded-2xl ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Customer Profile</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-[#94A3B8]' : 'text-slate-400'}`}>Account E-mail:</span>
                          <span className={`font-medium truncate max-w-[160px] ${isDark ? 'text-[#F8FAFC]' : 'text-slate-800'}`}>{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`${isDark ? 'text-[#94A3B8]' : 'text-slate-400'}`}>Registration Date:</span>
                          <span className={`font-medium ${isDark ? 'text-[#F8FAFC]' : 'text-slate-800'}`}>{formatJoinedDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-[10px] font-mono pt-4 border-t truncate ${
                      isDark ? 'text-[#94A3B8] border-white/[0.03]' : 'text-slate-400 border-slate-100'
                    }`}>
                      ID: {user.id}
                    </div>
                  </div>

                  {/* Active tickets */}
                  <div className={`p-6 flex flex-col justify-between min-h-[160px] border transition-colors duration-300 rounded-2xl ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>My Active Tickets</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          activeTicketsCount > 0 
                            ? isDark ? "bg-amber-950/40 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200"
                            : isDark ? "bg-slate-800 text-slate-400 border-slate-700/30" : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}>
                          {activeTicketsCount} Open
                        </span>
                      </div>
                      <p className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>{activeTicketsCount}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className={`text-[11px] font-bold flex items-center space-x-1.5 pt-4 border-t text-left w-full transition-colors ${
                        isDark 
                          ? 'text-[#38b1f7] hover:text-white border-white/[0.03]' 
                          : 'text-[#0d7fc0] hover:text-[#085f90] border-slate-100'
                      }`}
                    >
                      <span>View active queues</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Service resolution rate */}
                  <div className={`p-6 flex flex-col justify-between min-h-[160px] border transition-colors duration-300 rounded-2xl ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Service Resolution</h3>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                          isDark ? 'bg-green-950/40 text-[#12B76A] border-green-500/20' : 'bg-green-50 text-green-700 border-green-200'
                        }`}>Active</span>
                      </div>
                      <p className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#12B76A]' : 'text-green-600'}`}>{resolutionRate}%</p>
                    </div>
                    <p className={`text-[11px] leading-relaxed pt-4 border-t ${
                      isDark ? 'text-[#94A3B8] border-white/[0.03]' : 'text-slate-500 border-slate-100'
                    }`}>
                      Resolution check matches {resolvedTicketsCount} resolved out of {tickets.length} total tickets.
                    </p>
                  </div>
                </section>

                {/* Recent Tickets Block */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Recent Support Requests</h3>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className={`text-xs transition-colors ${
                        isDark ? 'text-[#38b1f7] hover:text-white' : 'text-[#0d7fc0] hover:text-[#085f90] hover:underline'
                      }`}
                    >
                      View All Tickets
                    </button>
                  </div>

                  <div className={`overflow-hidden border transition-all duration-300 ${
                    isDark 
                      ? 'glass-card border-white/[0.06]' 
                      : 'bg-white border-slate-200/80 shadow-sm rounded-2xl'
                  }`}>
                    {loadingTickets ? (
                      <div className="p-8 space-y-4">
                        <div className={`h-6 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-6 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-6 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className={`p-8 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        No support tickets submitted yet. Click &quot;Create Ticket&quot; to open your first ticket.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className={`border-b font-mono uppercase tracking-wider transition-colors ${
                              isDark 
                                ? 'border-[#1E293B] bg-slate-900/30 text-slate-400' 
                                : 'border-slate-200 bg-slate-50 text-slate-500'
                            }`}>
                              <th className="p-4">Ticket</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Priority</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Last Updated</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y transition-colors ${
                            isDark ? 'divide-[#1E293B]' : 'divide-slate-100'
                          }`}>
                            {tickets.slice(0, 5).map(t => (
                              <tr key={t.id} className={`transition-colors group ${
                                isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50/70'
                              }`}>
                                <td className="p-4">
                                  <div>
                                    <p className={`font-semibold transition-colors ${
                                      isDark 
                                        ? 'text-slate-200 group-hover:text-[#38b1f7]' 
                                        : 'text-slate-800 group-hover:text-[#0d7fc0]'
                                    }`}>{t.title}</p>
                                    <p className={`text-[10px] truncate max-w-[240px] mt-0.5 ${
                                      isDark ? 'text-slate-400' : 'text-slate-500'
                                    }`}>{t.description}</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.category?.name}</span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getPriorityStyle(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getStatusStyle(t.status)}`}>
                                    {t.status}
                                  </span>
                                </td>
                                <td className={`p-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  {new Date(t.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setActiveTab("tickets");
                                      setSelectedTicketId(t.id);
                                    }}
                                    className={`px-3 py-1 border rounded-lg transition-all ${
                                      isDark 
                                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                    }`}
                                  >
                                    Discuss
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {activeTab === "tickets" && (
              <div className="grid lg:grid-cols-12 gap-8 items-start h-full">
                {/* Tickets list panel (7 cols if drawer is active, 12 if not) */}
                <div className={`${selectedTicketId ? "lg:col-span-5" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>My Tickets Pipeline</h3>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="btn-cyber h-9 text-xs px-4 py-0 flex items-center space-x-1.5 shadow-none"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>New Ticket</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {loadingTickets ? (
                      <div className="space-y-3">
                        <div className={`h-24 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-24 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-24 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className={`p-8 text-center text-sm border rounded-2xl ${
                        isDark ? 'glass-card border-white/[0.06] text-slate-500' : 'bg-white border-slate-200 shadow-sm text-slate-400'
                      }`}>
                        No support tickets found. Create a ticket to get started.
                      </div>
                    ) : (
                      tickets.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`p-5 cursor-pointer text-left transition-all duration-200 border rounded-2xl ${
                            selectedTicketId === t.id
                              ? isDark
                                ? "border-[#38b1f7]/50 bg-slate-900/60 shadow-[0_0_15px_rgba(56,177,247,0.08)]"
                                : "border-[#38b1f7]/60 bg-white shadow-[0_4px_12px_rgba(56,177,247,0.08)]"
                              : isDark
                                ? "bg-[#0F172A]/45 border-white/[0.06] hover:border-[#38b1f7]/20 hover:bg-slate-900/20"
                                : "bg-white border-slate-200/80 shadow-sm hover:border-[#38b1f7]/30 hover:bg-slate-50/50 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className={`font-bold text-sm truncate transition-colors ${
                              selectedTicketId === t.id
                                ? isDark ? "text-[#38b1f7]" : "text-[#0d7fc0]"
                                : isDark ? "text-slate-100 hover:text-[#38b1f7]" : "text-slate-800 hover:text-[#0d7fc0]"
                            }`}>{t.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getStatusStyle(t.status)}`}>
                              {t.status}
                            </span>
                          </div>
                          
                          <p className={`text-xs line-clamp-2 mb-4 leading-relaxed transition-colors ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {t.description}
                          </p>

                          <div className={`flex items-center justify-between text-[10px] pt-3 border-t transition-colors ${
                            isDark ? 'border-white/[0.03] text-slate-400' : 'border-slate-100 text-slate-500'
                          }`}>
                            <span className={`font-semibold px-2 py-0.5 rounded border transition-colors ${
                              isDark 
                                ? 'text-slate-300 bg-slate-800/40 border-slate-700/20' 
                                : 'text-slate-600 bg-slate-100 border-slate-200/60'
                            }`}>
                              {t.category?.name}
                            </span>
                            <div className="flex items-center space-x-3">
                              <span className={`font-mono font-semibold ${getPriorityStyle(t.priority)} px-1.5 py-0.5 rounded border`}>
                                {t.priority}
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Dynamic details thread panel (5 cols) */}
                {selectedTicketId && (
                  <div className={`lg:col-span-7 h-[calc(100vh-160px)] flex flex-col transition-all duration-300 border rounded-2xl overflow-hidden ${
                    isDark 
                      ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' 
                      : 'bg-white border-slate-200/80 shadow-md'
                  }`}>
                    {loadingDetails && !detailedTicket ? (
                      <div className="p-8 flex-grow space-y-4">
                        <div className={`h-8 w-1/3 ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-4 w-1/2 ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                        <div className={`h-32 w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                      </div>
                    ) : detailedTicket ? (
                      <>
                        {/* Header Details Panel */}
                        <div className={`p-5 border-b flex items-center justify-between transition-colors ${
                          isDark ? 'border-[#1E293B] bg-slate-900/40' : 'border-slate-200 bg-slate-50/50'
                        }`}>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className={`font-bold text-md tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>{detailedTicket.title}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusStyle(detailedTicket.status)}`}>
                                {detailedTicket.status}
                              </span>
                            </div>
                            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Opened: {new Date(detailedTicket.createdAt).toLocaleString()} | Category: <span className={`font-semibold ${isDark ? 'text-[#38b1f7]' : 'text-[#0d7fc0]'}`}>{detailedTicket.category?.name}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {detailedTicket.status !== "RESOLVED" && detailedTicket.status !== "CLOSED" && (
                              <button
                                onClick={handleResolveTicket}
                                className={`h-8 px-3 rounded-lg text-[10px] font-bold border transition-all flex items-center space-x-1 ${
                                  isDark 
                                    ? 'border-green-500/20 text-green-400 hover:text-white hover:bg-green-950/30' 
                                    : 'border-green-300 bg-green-50/40 text-green-700 hover:bg-green-100/60'
                                }`}
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Resolve Ticket</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicketId(null)}
                              className={`p-1.5 rounded transition-colors ${
                                isDark 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200'
                              }`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Message Threads area */}
                        <div className={`flex-grow overflow-y-auto p-5 space-y-4 ${
                          isDark ? 'bg-slate-950/10' : 'bg-slate-50/20'
                        }`}>
                          {/* Original Description ticket post */}
                          <div className={`p-4 rounded-xl border space-y-2 ${
                            isDark ? 'bg-slate-900/70 border-[#1E293B]' : 'bg-white border-slate-200/80 shadow-sm'
                          }`}>
                            <div className={`flex items-center justify-between text-[10px] border-b pb-2 ${
                              isDark ? 'text-slate-400 border-white/[0.03]' : 'text-slate-500 border-slate-100'
                            }`}>
                              <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{detailedTicket.customer?.name} (Customer)</span>
                              <span>Initial Inquiry</span>
                            </div>
                            <p className={`text-xs leading-relaxed whitespace-pre-wrap ${
                              isDark ? 'text-slate-200' : 'text-slate-700'
                            }`}>{detailedTicket.description}</p>
                          </div>

                          {/* Message Loop */}
                          {messages.map((msg) => {
                            const isMe = msg.sender.id === user.id;
                            const isStaff = msg.sender.role === "ADMIN" || msg.sender.role === "AGENT";

                            return (
                              <div
                                key={msg.id}
                                className={`flex flex-col space-y-1 max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                              >
                                <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
                                  isMe
                                    ? isDark
                                      ? "bg-[#38b1f7]/10 text-slate-200 border-[#38b1f7]/25 rounded-tr-none"
                                      : "bg-[#38b1f7]/10 text-slate-800 border-[#38b1f7]/25 rounded-tr-none shadow-sm"
                                    : isStaff
                                      ? isDark
                                        ? "bg-emerald-950/30 text-slate-200 border-emerald-500/20 rounded-tl-none"
                                        : "bg-emerald-50 text-slate-800 border-emerald-200 rounded-tl-none"
                                      : isDark
                                        ? "bg-slate-900/60 text-slate-200 border-[#1E293B] rounded-tl-none"
                                        : "bg-slate-100 text-slate-800 border-slate-200 rounded-tl-none"
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <span className={`text-[9px] px-1 ${
                                  isDark ? 'text-slate-500' : 'text-slate-400'
                                }`}>
                                  {isMe ? "You" : `${msg.sender.name} (${msg.sender.role})`} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Send reply input form footer */}
                        <div className={`p-4 border-t transition-colors ${
                          isDark ? 'border-[#1E293B] bg-slate-900/30' : 'border-slate-200 bg-slate-50/60'
                        }`}>
                          {detailedTicket.status === "CLOSED" ? (
                            <p className="text-center text-xs text-slate-500 py-2 font-mono flex items-center justify-center space-x-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>This ticket has been marked closed. No further replies can be sent.</span>
                            </p>
                          ) : (
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Write your reply message details..."
                                className={`flex-grow text-xs h-[48px] rounded-xl outline-none focus:ring-1 transition-all duration-200 ${
                                  isDark
                                    ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                                    : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                                }`}
                                disabled={submittingMessage}
                                style={{ paddingLeft: "16px" }}
                              />
                              <button
                                type="submit"
                                disabled={submittingMessage || !newMessage.trim()}
                                className="btn-cyber h-[48px] px-4 shrink-0 flex items-center justify-center shadow-none"
                              >
                                <Send className="w-4 h-4 text-[#020617]" />
                              </button>
                            </form>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={`p-8 text-center text-sm flex-grow flex items-center justify-center ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>
                        Select a ticket to display conversation thread details.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. Ticket Creation Modal Overlay Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-lg overflow-hidden animate-error-shake shadow-2xl border transition-all duration-300 rounded-2xl ${
            isDark ? 'glass-card border-white/[0.08]' : 'bg-white border-slate-200 shadow-2xl'
          }`}>
            <div className={`p-6 border-b flex items-center justify-between transition-colors ${
              isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
            }`}>
              <div>
                <h3 className={`font-bold text-md tracking-tight ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>Create Support Ticket</h3>
                <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Describe the issue and categorize it for routing</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className={`p-1.5 rounded transition-colors border ${
                  isDark 
                    ? 'bg-slate-800 hover:bg-slate-700 border-slate-700/50 text-slate-400 hover:text-white' 
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {createError && (
                <div className={`p-3 rounded-lg text-xs font-mono border ${
                  isDark 
                    ? 'bg-red-950/40 border-red-500/20 text-red-400' 
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                  {createError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incapable of logging into mobile account"
                  className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full ${
                    isDark
                      ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                      : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                  }`}
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  disabled={submittingCreate}
                />
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category select dropdown */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Category</label>
                  {loadingCategories ? (
                    <div className={`h-[44px] w-full ${isDark ? 'skeleton' : 'skeleton-light'}`}></div>
                  ) : (
                    <select
                      className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full cursor-pointer ${
                        isDark
                          ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                          : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                      }`}
                      value={createForm.categoryId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      disabled={submittingCreate}
                      style={{ paddingRight: "30px" }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className={isDark ? "bg-[#020617] text-[#F8FAFC]" : "bg-white text-slate-900"}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Priority Level</label>
                  <select
                    className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full cursor-pointer ${
                      isDark
                        ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                        : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                    }`}
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" }))}
                    disabled={submittingCreate}
                  >
                    <option value="LOW" className={isDark ? "bg-[#020617] text-[#F8FAFC]" : "bg-white text-slate-900"}>Low</option>
                    <option value="MEDIUM" className={isDark ? "bg-[#020617] text-[#F8FAFC]" : "bg-white text-slate-900"}>Medium</option>
                    <option value="HIGH" className={isDark ? "bg-[#020617] text-[#F8FAFC]" : "bg-white text-slate-900"}>High</option>
                    <option value="URGENT" className={isDark ? "bg-[#020617] text-[#F8FAFC]" : "bg-white text-slate-900"}>Urgent</option>
                  </select>
                </div>
              </div>

              {/* Description textarea */}
              <div className="space-y-1.5">
                <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Problem Description</label>
                <textarea
                  required
                  placeholder="Provide details about the issue you are experiencing..."
                  rows={4}
                  className={`w-full p-4 text-xs rounded-xl outline-none focus:ring-1 transition-all duration-200 resize-none ${
                    isDark
                      ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                      : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                  }`}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  disabled={submittingCreate}
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    isDark 
                      ? 'text-slate-300 hover:bg-slate-800' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  disabled={submittingCreate}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-cyber flex items-center space-x-2"
                  disabled={submittingCreate}
                >
                  {submittingCreate ? (
                    <span>Creating Ticket...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
