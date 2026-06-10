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
  };

  const getPriorityStyle = (priority: Ticket["priority"]) => {
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
  };

  // ── SKELETON LOADING STATE (Mandated: No full-page blocking spinners) ─────
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex font-sans select-none">
        {/* Sidebar Skeleton */}
        <aside className="w-[280px] bg-[#0F172A] border-r border-[#1E293B] p-6 flex flex-col justify-between hidden md:flex">
          <div className="space-y-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg skeleton"></div>
              <div className="h-5 w-24 skeleton"></div>
            </div>
            <div className="space-y-4">
              <div className="h-10 w-full skeleton"></div>
              <div className="h-10 w-full skeleton"></div>
              <div className="h-10 w-full skeleton"></div>
            </div>
          </div>
          <div className="h-12 w-full skeleton"></div>
        </aside>

        {/* Content Shell Skeleton */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar Skeleton */}
          <header className="h-[72px] bg-[#0F172A] border-b border-[#1E293B] px-8 flex items-center justify-between">
            <div className="h-6 w-48 skeleton"></div>
            <div className="h-8 w-24 skeleton"></div>
          </header>

          {/* Main Dashboard Space Skeleton */}
          <main className="flex-grow p-8 max-w-[1440px] w-full mx-auto space-y-6">
            <div className="h-32 w-full skeleton"></div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="h-44 w-full skeleton"></div>
              <div className="h-44 w-full skeleton"></div>
              <div className="h-44 w-full skeleton"></div>
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
    <div className="min-h-screen bg-[#020617] text-[#F8FAFC] flex font-sans selection:bg-[#5FC0F9]/30 relative overflow-hidden">
      {/* Background cyber grid and glow orbs */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] glow-orb-cyan z-0 animate-float-1"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] glow-orb-indigo z-0 animate-float-2"></div>

      {/* 1. Sidebar Navigation (Width: 280px) */}
      <aside className="w-[280px] bg-[#0F172A]/70 backdrop-blur-md border-r border-[#1E293B] p-6 flex flex-col justify-between hidden md:flex shrink-0 z-10">
        <div className="space-y-8">
          {/* Brand Logo Header */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-[#5FC0F9] flex items-center justify-center shadow-[0_0_15px_rgba(95,192,249,0.4)]">
              <span className="font-extrabold text-[#020617] text-md">Ω</span>
            </div>
            <div>
              <h2 className="font-bold text-sm text-[#F8FAFC]">OCS Helpdesk</h2>
              <p className="text-[9px] text-[#94A3B8] font-mono tracking-wider uppercase">Portal Client</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedTicketId(null); }}
              className={`w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "dashboard"
                  ? "bg-[#1E293B]/70 border border-[#5FC0F9]/20 text-[#5FC0F9]"
                  : "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
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
                  ? "bg-[#1E293B]/70 border border-[#5FC0F9]/20 text-[#5FC0F9]"
                  : "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>My Tickets</span>
              </div>
              {activeTicketsCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5FC0F9] text-[#020617] font-bold">
                  {activeTicketsCount}
                </span>
              )}
            </button>

            <button
              disabled
              className="w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide text-slate-500 cursor-not-allowed opacity-50"
            >
              <div className="flex items-center space-x-2.5">
                <BookOpen className="w-4 h-4" />
                <span>Knowledge Base</span>
              </div>
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/[0.03]">
                Sprint 2
              </span>
            </button>

            <button
              disabled
              className="w-full h-10 flex items-center justify-between px-3 rounded-lg text-xs font-semibold tracking-wide text-slate-500 cursor-not-allowed opacity-50"
            >
              <div className="flex items-center space-x-2.5">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile Section */}
        <div className="p-3 rounded-xl bg-[#111827]/80 border border-[#1E293B] flex flex-col space-y-3">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#38B1F7]/20 border border-[#5FC0F9]/20 flex items-center justify-center text-sm font-bold text-[#5FC0F9] shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#F8FAFC] truncate">{user.name}</p>
              <p className="text-[9px] text-[#94A3B8] font-mono uppercase tracking-wider">{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="w-full h-8 flex items-center justify-center text-[11px] font-bold text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all duration-150 active:scale-98"
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* 2. Main Work Shell */}
      <div className="flex-grow flex flex-col overflow-hidden z-10">
        {/* Top Bar Navigation (Height: 72px) */}
        <header className="h-[72px] bg-[#0F172A]/70 backdrop-blur-md border-b border-[#1E293B] px-8 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg text-[#F8FAFC] tracking-tight">
              {activeTab === "dashboard" ? "Dashboard Overview" : "My Support Tickets"}
            </h1>
            <p className="text-[10px] text-[#94A3B8]">
              {activeTab === "dashboard" ? "Metrics and active support overview" : "View, manage, and discuss your submitted issues"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                loadTickets(true);
                if (selectedTicketId) loadTicketDetails(selectedTicketId);
              }}
              className="p-2 rounded bg-slate-800/40 hover:bg-slate-800 border border-slate-700/30 text-[#94A3B8] hover:text-[#F8FAFC] transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${(loadingTickets || loadingDetails) ? "animate-spin text-[#5FC0F9]" : ""}`} />
            </button>
            <div className="flex items-center space-x-2 px-3 py-1 rounded bg-green-950/40 border border-green-500/20 text-[#12B76A] text-[11px] font-semibold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse"></span>
              <span>API: Connected</span>
            </div>
            {/* Small Mobile Logout */}
            <button
              onClick={() => logout()}
              className="md:hidden text-xs font-bold px-3 py-1.5 rounded-lg bg-[#111827] border border-[#1E293B] text-red-400 hover:text-white"
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
                <section className="glass-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#F8FAFC]">
                      Welcome to OCS Customer Hub, <span className="text-[#5FC0F9]">{user.name}</span>
                    </h2>
                    <p className="text-[#94A3B8] text-sm max-w-xl">
                      Create, track, and discuss your support issues. Add detailed descriptions and chat in real-time with customer service representatives.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-cyber flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Ticket</span>
                  </button>
                </section>

                {/* Cards metrics system */}
                <section className="grid md:grid-cols-3 gap-6">
                  {/* Customer profile details */}
                  <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px] bg-slate-900/60 backdrop-blur border-white/[0.03]">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-3">Customer Profile</h3>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">Account E-mail:</span>
                          <span className="text-[#F8FAFC] font-medium truncate max-w-[160px]">{user.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#94A3B8]">Registration Date:</span>
                          <span className="text-[#F8FAFC] font-medium">{formatJoinedDate(user.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] text-[#94A3B8] font-mono pt-4 border-t border-white/[0.03] truncate">
                      ID: {user.id}
                    </div>
                  </div>

                  {/* Active tickets */}
                  <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px] bg-slate-900/60 backdrop-blur border-white/[0.03]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">My Active Tickets</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${activeTicketsCount > 0 ? "bg-amber-950/40 text-amber-400 border-amber-500/20" : "bg-slate-800 text-slate-400 border-slate-700/30"}`}>
                          {activeTicketsCount} Open
                        </span>
                      </div>
                      <p className="text-3xl font-extrabold text-[#F8FAFC] tracking-tight">{activeTicketsCount}</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="text-[11px] font-bold text-[#5FC0F9] flex items-center space-x-1.5 hover:text-white pt-4 border-t border-white/[0.03] text-left w-full"
                    >
                      <span>View active queues</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Service resolution rate */}
                  <div className="ocs-card p-6 flex flex-col justify-between min-h-[160px] bg-slate-900/60 backdrop-blur border-white/[0.03]">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Service Resolution</h3>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-950/40 text-[#12B76A] border border-green-500/20">Active</span>
                      </div>
                      <p className="text-3xl font-extrabold text-[#12B76A] tracking-tight">{resolutionRate}%</p>
                    </div>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed pt-4 border-t border-white/[0.03]">
                      Resolution check matches {resolvedTicketsCount} resolved out of {tickets.length} total tickets.
                    </p>
                  </div>
                </section>

                {/* Recent Tickets Block */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Recent Support Requests</h3>
                    <button
                      onClick={() => setActiveTab("tickets")}
                      className="text-xs text-[#5FC0F9] hover:underline"
                    >
                      View All Tickets
                    </button>
                  </div>

                  <div className="glass-card overflow-hidden">
                    {loadingTickets ? (
                      <div className="p-8 space-y-4">
                        <div className="h-6 w-full skeleton"></div>
                        <div className="h-6 w-full skeleton"></div>
                        <div className="h-6 w-full skeleton"></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm">
                        No support tickets submitted yet. Click &quot;Create Ticket&quot; to open your first ticket.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#1E293B] bg-slate-900/30 text-slate-400 font-mono uppercase tracking-wider">
                              <th className="p-4">Ticket</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Priority</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Last Updated</th>
                              <th className="p-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E293B]">
                            {tickets.slice(0, 5).map(t => (
                              <tr key={t.id} className="hover:bg-slate-900/40 transition-colors group">
                                <td className="p-4">
                                  <div>
                                    <p className="font-semibold text-slate-200 group-hover:text-[#5FC0F9] transition-colors">{t.title}</p>
                                    <p className="text-[10px] text-slate-400 truncate max-w-[240px] mt-0.5">{t.description}</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className="text-slate-300 font-medium">{t.category?.name}</span>
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
                                <td className="p-4 text-slate-400">
                                  {new Date(t.updatedAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => {
                                      setActiveTab("tickets");
                                      setSelectedTicketId(t.id);
                                    }}
                                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50 rounded-lg transition-all"
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
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">My Tickets Pipeline</h3>
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
                        <div className="h-24 w-full skeleton"></div>
                        <div className="h-24 w-full skeleton"></div>
                        <div className="h-24 w-full skeleton"></div>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="glass-card p-8 text-center text-slate-500 text-sm">
                        No support tickets found. Create a ticket to get started.
                      </div>
                    ) : (
                      tickets.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`glass-card p-5 cursor-pointer text-left transition-all ${
                            selectedTicketId === t.id
                              ? "border-[#5FC0F9]/50 bg-slate-900/60 shadow-[0_0_15px_rgba(95,192,249,0.1)]"
                              : "hover:border-[#5FC0F9]/20 hover:bg-slate-900/20"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h4 className="font-bold text-sm text-slate-100 truncate group-hover:text-[#5FC0F9]">{t.title}</h4>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border shrink-0 ${getStatusStyle(t.status)}`}>
                              {t.status}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                            {t.description}
                          </p>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-white/[0.03]">
                            <span className="font-semibold text-slate-300 bg-slate-800/40 px-2 py-0.5 rounded border border-slate-700/20">
                              {t.category?.name}
                            </span>
                            <div className="flex items-center space-x-3">
                              <span className={`font-mono font-semibold ${getPriorityStyle(t.priority)} px-1.5 py-0.5 rounded border`}>
                                {t.priority}
                              </span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 text-slate-500" />
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
                  <div className="lg:col-span-7 glass-card h-[calc(100vh-160px)] flex flex-col transition-all duration-300">
                    {loadingDetails && !detailedTicket ? (
                      <div className="p-8 flex-grow space-y-4">
                        <div className="h-8 w-1/3 skeleton"></div>
                        <div className="h-4 w-1/2 skeleton"></div>
                        <div className="h-32 w-full skeleton"></div>
                      </div>
                    ) : detailedTicket ? (
                      <>
                        {/* Header Details Panel */}
                        <div className="p-5 border-b border-[#1E293B] bg-slate-900/40 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-md text-[#F8FAFC] tracking-tight">{detailedTicket.title}</h3>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getStatusStyle(detailedTicket.status)}`}>
                                {detailedTicket.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">
                              Opened: {new Date(detailedTicket.createdAt).toLocaleString()} | Category: <span className="text-[#5FC0F9] font-medium">{detailedTicket.category?.name}</span>
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {detailedTicket.status !== "RESOLVED" && detailedTicket.status !== "CLOSED" && (
                              <button
                                onClick={handleResolveTicket}
                                className="h-8 px-3 rounded-lg text-[10px] font-bold border border-green-500/20 text-green-400 hover:text-white hover:bg-green-950/30 transition-all flex items-center space-x-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                <span>Resolve Ticket</span>
                              </button>
                            )}
                            <button
                              onClick={() => setSelectedTicketId(null)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Message Threads area */}
                        <div className="flex-grow overflow-y-auto p-5 space-y-4">
                          {/* Original Description ticket post */}
                          <div className="p-4 rounded-xl bg-slate-900/70 border border-[#1E293B] space-y-2">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-white/[0.03] pb-2">
                              <span className="font-bold text-slate-300">{detailedTicket.customer?.name} (Customer)</span>
                              <span>Initial Inquiry</span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-200 whitespace-pre-wrap">{detailedTicket.description}</p>
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
                                <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                                  isMe
                                    ? "bg-[#5FC0F9]/10 text-slate-200 border border-[#5FC0F9]/20 rounded-tr-none"
                                    : isStaff
                                      ? "bg-[#10B981]/10 text-slate-200 border border-[#10B981]/20 rounded-tl-none"
                                      : "bg-slate-900/60 text-slate-200 border border-[#1E293B] rounded-tl-none"
                                }`}>
                                  <p className="whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <span className="text-[9px] text-slate-500 px-1">
                                  {isMe ? "You" : `${msg.sender.name} (${msg.sender.role})`} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Send reply input form footer */}
                        <div className="p-4 border-t border-[#1E293B] bg-slate-900/30">
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
                                className="flex-grow glass-input text-xs"
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
                      <div className="p-8 text-center text-slate-500 text-sm flex-grow flex items-center justify-center">
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
          <div className="glass-card w-full max-w-lg overflow-hidden animate-error-shake shadow-2xl border-white/[0.08]">
            <div className="p-6 border-b border-[#1E293B] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-md text-[#F8FAFC] tracking-tight">Create Support Ticket</h3>
                <p className="text-[10px] text-slate-400">Describe the issue and categorize it for routing</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-xs text-red-400 font-mono">
                  {createError}
                </div>
              )}

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Incapable of logging into mobile account"
                  className="ocs-input"
                  value={createForm.title}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                  disabled={submittingCreate}
                />
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category select dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Category</label>
                  {loadingCategories ? (
                    <div className="h-11 w-full skeleton"></div>
                  ) : (
                    <select
                      className="ocs-input"
                      value={createForm.categoryId}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                      disabled={submittingCreate}
                      style={{ paddingRight: "30px" }}
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-[#020617] text-[#F8FAFC]">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Priority Level</label>
                  <select
                    className="ocs-input"
                    value={createForm.priority}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT" }))}
                    disabled={submittingCreate}
                  >
                    <option value="LOW" className="bg-[#020617] text-[#F8FAFC]">Low</option>
                    <option value="MEDIUM" className="bg-[#020617] text-[#F8FAFC]">Medium</option>
                    <option value="HIGH" className="bg-[#020617] text-[#F8FAFC]">High</option>
                    <option value="URGENT" className="bg-[#020617] text-[#F8FAFC]">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Description textarea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Problem Description</label>
                <textarea
                  required
                  placeholder="Provide details about the issue you are experiencing..."
                  rows={4}
                  className="w-full p-4 text-xs bg-slate-900 border border-[#1E293B] rounded-xl text-slate-100 focus:border-[#5FC0F9] focus:outline-none focus:ring-1 focus:ring-[#5FC0F9] resize-none"
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
                  className="btn-ghost"
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
