"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchWithAuth } from "../../../lib/api";
import {
  Server,
  ShieldAlert,
  Users,
  Layers,
  BookOpen,
  Ticket,
  Plus,
  Trash,
  X,
  Search,
  AlertCircle,
  Send,
  Sun,
  Moon,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Types matching database schema
interface Category {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: { id: string; name: string; email: string; role: string }[];
  _count?: { tickets: number };
}

interface Agent {
  id: string;
  name: string;
  email: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN" | "AGENT";
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

interface TicketMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: { id: string; name: string; email: string; role: string };
}

interface TicketData {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt: string;
  category: Category;
  customer: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
  team: { id: string; name: string } | null;
  messages?: TicketMessage[];
}

interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  isInternal: boolean;
  createdAt: string;
  author: { id: string; name: string };
  category: Category | null;
}

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();

  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      return saved === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem("admin_sidebar_collapsed", String(next));
  };
  
  // Theme state synced with local storage and window storage events
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
    toast.info(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const isDark = theme === 'dark';

  // Tab State: overview, tickets, teams, users, kb
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "teams" | "users" | "kb">("overview");
  
  // Data States
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Fetch / Loading states
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selected resource for details/modals
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  
  // Modals & Creation state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  
  // KB Editor state
  const [kbEditing, setKbEditing] = useState<boolean>(false);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbIsPublished, setKbIsPublished] = useState(false);
  const [kbIsInternal, setKbIsInternal] = useState(false);
  const [kbCategoryId, setKbCategoryId] = useState("");

  // Search/Filters states
  const [ticketStatusFilter, setTicketStatusFilter] = useState("ALL");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("ALL");
  const [userSearch, setUserSearch] = useState("");

  // Fetch all administrative data from backend
  const refreshAllData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const ticketsRes = await fetchWithAuth("/tickets");
      if (ticketsRes.ok) {
        const res = await ticketsRes.json();
        setTickets(res.data.tickets);
      }

      const teamsRes = await fetchWithAuth("/teams");
      if (teamsRes.ok) {
        const res = await teamsRes.json();
        setTeams(res.data.teams);
      }

      const agentsRes = await fetchWithAuth("/users/agents");
      if (agentsRes.ok) {
        const res = await agentsRes.json();
        setAgents(res.data.agents);
      }

      const kbRes = await fetchWithAuth("/kb");
      if (kbRes.ok) {
        const res = await kbRes.json();
        setKbArticles(res.data.articles);
      }

      const catRes = await fetchWithAuth("/categories");
      if (catRes.ok) {
        const res = await catRes.json();
        setCategories(res.data.categories || res.data); // handles array returns
      }

      // Only Admins can view users directory
      if (user?.role === "ADMIN") {
        const usersRes = await fetchWithAuth("/users");
        if (usersRes.ok) {
          const res = await usersRes.json();
          setUsers(res.data.users);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Network error: Failed to pull data streams from API.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Handle ticket reload/detail view fetch
  const selectTicket = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setTicketReply("");
    try {
      const res = await fetchWithAuth(`/tickets/${ticket.id}`);
      if (res.ok) {
        const resData = await res.json();
        setSelectedTicket(resData.data.ticket);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Ticket status / priority updates
  const updateTicketDetails = async (updates: { status?: string; priority?: string; teamId?: string | null; agentId?: string | null }) => {
    if (!selectedTicket) return;
    try {
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const resData = await res.json();
        const updated = resData.data.ticket;
        setSelectedTicket(prev => prev ? { ...prev, ...updated } : null);
        // Refresh ticket list
        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        toast.success("Ticket details updated successfully!");
      } else {
        toast.error("Failed to update ticket details.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update ticket details.");
    }
  };

  // Send a reply to ticket
  const submitTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;

    try {
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: ticketReply }),
      });
      if (res.ok) {
        const resData = await res.json();
        const newMessage = resData.data.message;
        setSelectedTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : null);
        setTicketReply("");
        toast.success("Reply message sent successfully!");
      } else {
        toast.error("Failed to send message reply.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message.");
    }
  };

  // Create Team
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    try {
      const res = await fetchWithAuth("/teams", {
        method: "POST",
        body: JSON.stringify({
          name: newTeamName,
          description: newTeamDesc,
          memberIds: newTeamMembers,
        }),
      });
      if (res.ok) {
        setNewTeamName("");
        setNewTeamDesc("");
        setNewTeamMembers([]);
        setShowCreateTeam(false);
        refreshAllData();
        toast.success("Team created successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.error?.message || "Error creating team");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error: Failed to create team.");
    }
  };

  // Toggle agent in team checklist
  const toggleTeamMemberSelection = (agentId: string) => {
    setNewTeamMembers(prev =>
      prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
    );
  };

  // Delete Team
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm("Are you sure you want to delete this team? All assigned tickets will be unassigned.")) return;
    try {
      const res = await fetchWithAuth(`/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) {
        refreshAllData();
        toast.success("Team deleted successfully!");
      } else {
        toast.error("Failed to delete team.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete team.");
    }
  };

  // Update User role/status
  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const resData = await res.json();
        const updatedUser = resData.data.user;
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
        toast.success("User profile updated successfully!");
      } else {
        toast.error("Failed to update user profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user profile.");
    }
  };

  // Save KB Article (Create/Update)
  const handleSaveKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;

    const payload = {
      title: kbTitle,
      content: kbContent,
      isPublished: kbIsPublished,
      isInternal: kbIsInternal,
      categoryId: kbCategoryId || null,
    };

    try {
      let res;
      if (kbArticleId) {
        // Edit mode
        res = await fetchWithAuth(`/kb/${kbArticleId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode
        res = await fetchWithAuth("/kb", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setKbTitle("");
        setKbContent("");
        setKbIsPublished(false);
        setKbIsInternal(false);
        setKbCategoryId("");
        setKbArticleId(null);
        setKbEditing(false);
        refreshAllData();
        toast.success("Knowledge Base article saved successfully!");
      } else {
        const errData = await res.json();
        toast.error(errData.error?.message || "Error saving article");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save KB article.");
    }
  };

  // Edit KB Article loader
  const startEditKB = (article: KBArticle) => {
    setKbArticleId(article.id);
    setKbTitle(article.title);
    setKbContent(article.content);
    setKbIsPublished(article.isPublished);
    setKbIsInternal(article.isInternal);
    setKbCategoryId(article.category?.id || "");
    setKbEditing(true);
  };

  // Delete KB Article
  const handleDeleteKB = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const res = await fetchWithAuth(`/kb/${articleId}`, { method: "DELETE" });
      if (res.ok) {
        refreshAllData();
        toast.success("KB article deleted successfully!");
      } else {
        toast.error("Failed to delete KB article.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete KB article.");
    }
  };

  // ── SKELETON LOADING STATE (Unified with design variables) ───────────────────
  if (authLoading || !user) {
    const isDarkTheme = typeof window !== "undefined" && localStorage.getItem("theme") === "dark";
    const sk = isDarkTheme ? "skeleton" : "skeleton-light";
    
    return (
      <div className={`min-h-screen flex font-body select-none transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}>
        {/* Sidebar Skeleton */}
        <aside className={`w-[280px] border-r p-6 flex flex-col justify-between hidden md:flex shrink-0 ${
          isDarkTheme ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white border-slate-200/80'
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
            isDarkTheme ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white border-slate-200/80'
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

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (ticketStatusFilter !== "ALL" && t.status !== ticketStatusFilter) return false;
    if (ticketPriorityFilter !== "ALL" && t.priority !== ticketPriorityFilter) return false;
    return true;
  });

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (!userSearch.trim()) return true;
    return (
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
  });

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

      {/* ── SIDEBAR NAVIGATION ─────────────────────────────────── */}
      <aside className={`border-r p-4 flex flex-col justify-between hidden md:flex shrink-0 z-25 transition-all duration-300 ease-in-out group/sidebar ${
        isSidebarCollapsed 
          ? "w-[76px] hover:w-[280px]" 
          : "w-[280px]"
      } ${
        isDark 
          ? 'bg-[#0F172A]/70 backdrop-blur-md border-[#1E293B] text-[#F8FAFC]' 
          : 'bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-800'
      }`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#38b1f7] flex items-center justify-center shadow-[0_0_15px_rgba(56,177,247,0.4)] shrink-0">
                <span className="font-extrabold text-[#020617] text-md">🛡️</span>
              </div>
              <div className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto" : "opacity-100 w-auto"
              }`}>
                <h2 className={`font-bold text-sm transition-colors whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>Admin Center</h2>
                <p className={`text-[9px] font-mono tracking-wider uppercase whitespace-nowrap ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>OCS Operations</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg border transition-all duration-200 active:scale-95 shrink-0 ${
                isSidebarCollapsed ? "opacity-0 group-hover/sidebar:opacity-100" : "opacity-100"
              } ${
                isDark 
                  ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' 
                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
              }`}
              title={isSidebarCollapsed ? "Expand Sidebar Lock" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("overview"); setKbEditing(false); setSelectedTicket(null); }}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "overview"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Server className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Console Desk</span>
            </button>
            <button
              onClick={() => { setActiveTab("tickets"); setKbEditing(false); }}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "tickets"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Ticket className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>All Ticket Queue</span>
            </button>
            <button
              onClick={() => { setActiveTab("teams"); setKbEditing(false); setSelectedTicket(null); }}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "teams"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Team control</span>
            </button>
            {user.role === "ADMIN" && (
              <button
                onClick={() => { setActiveTab("users"); setKbEditing(false); setSelectedTicket(null); }}
                className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === "users"
                    ? isDark
                      ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                      : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                    : isDark 
                      ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Users className="w-4.5 h-4.5 mr-2.5 shrink-0" />
                <span className={`transition-all duration-300 ${
                  isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
                }`}>User Directory</span>
              </button>
            )}
            <button
              onClick={() => router.push("/admin/dashboard/kb")}
              className={`w-full h-10 flex items-center px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === "kb"
                  ? isDark
                    ? "bg-[#1E293B]/70 border border-[#38b1f7]/20 text-[#38b1f7] shadow-[0_0_10px_rgba(56,177,247,0.05)]"
                    : "bg-[#38b1f7]/8 border border-[#38b1f7]/20 text-[#0d7fc0]"
                  : isDark 
                    ? "text-[#CBD5E1] hover:bg-white/[0.03] hover:text-white"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <BookOpen className="w-4.5 h-4.5 mr-2.5 shrink-0" />
              <span className={`transition-all duration-300 ${
                isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto whitespace-nowrap" : "opacity-100 w-auto"
              }`}>Knowledge Base</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
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
            <div className={`overflow-hidden transition-all duration-300 ${
              isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:w-auto" : "opacity-100 w-auto"
            }`}>
              <p className={`text-xs font-semibold truncate whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>{user.name}</p>
              <p className={`text-[9px] font-mono uppercase tracking-wider whitespace-nowrap ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>{user.role}</p>
            </div>
          </div>
          <button
            onClick={() => logout("/admin/login")}
            className={`w-full flex items-center justify-center text-[11px] font-bold rounded-lg transition-all duration-150 active:scale-98 ${
              isSidebarCollapsed ? "opacity-0 h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:h-8 py-0" : "opacity-100 h-8 py-2"
            } ${
              isDark 
                ? 'text-red-400 hover:text-white hover:bg-red-950/40 border border-red-500/20 hover:border-red-500/40' 
                : 'text-red-650 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600'
            }`}
          >
            Logout Session
          </button>
        </div>
      </aside>

      {/* ── MAIN WORKSPACE SHELL ────────────────────────────────────────────── */}
      <div className="flex-grow flex flex-col overflow-hidden z-10">
        
        {/* Header (Top Bar) */}
        <header className={`h-[72px] backdrop-blur-md border-b px-8 flex items-center justify-between shrink-0 transition-colors duration-300 ${
          isDark ? 'bg-[#0F172A]/70 border-[#1E293B]' : 'bg-white/80 border-slate-200/80'
        }`}>
          <div>
            <h1 className={`font-bold text-lg tracking-tight capitalize ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
              {activeTab} panel
            </h1>
            <p className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              Administrative dashboard & operational center
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

            {/* Sync Console / Refresh Button */}
            <button
              onClick={refreshAllData}
              disabled={dataLoading}
              className={`p-2 rounded border transition-colors ${
                isDark 
                  ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/30 text-[#94A3B8] hover:text-[#F8FAFC]' 
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Sync Console"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? "animate-spin text-[#38b1f7]" : ""}`} />
            </button>
            
            {/* Mobile Logout */}
            <button
              onClick={() => logout("/admin/login")}
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

        {/* Dynamic Workspace Scroll View */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6">
          {error && (
            <div className={`p-4 rounded-xl border text-xs font-semibold flex items-start space-x-2.5 shadow-lg ${
              isDark 
                ? 'bg-red-950/40 border-red-500/30 text-red-300' 
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
              <span className="font-mono">{error}</span>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 1: OVERVIEW                                                    */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Tickets */}
                <div className={`p-6 border rounded-xl flex items-center justify-between transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Total Tickets</h3>
                    <p className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tickets.length}</p>
                  </div>
                  <Ticket className="w-8 h-8 text-[#38B1F7]" />
                </div>
                
                {/* Pending (Open) */}
                <div className={`p-6 border rounded-xl flex items-center justify-between transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Pending (Open)</h3>
                    <p className="text-3xl font-extrabold text-[#5FC0F9]">
                      {tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-[#5FC0F9]" />
                </div>

                {/* Active Teams */}
                <div className={`p-6 border rounded-xl flex items-center justify-between transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Active Teams</h3>
                    <p className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{teams.length}</p>
                  </div>
                  <Layers className="w-8 h-8 text-indigo-400" />
                </div>

                {/* KB Articles */}
                <div className={`p-6 border rounded-xl flex items-center justify-between transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h3 className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>KB Articles</h3>
                    <p className={`text-3xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{kbArticles.length}</p>
                  </div>
                  <BookOpen className="w-8 h-8 text-emerald-400" />
                </div>
              </section>

              {/* Layout details */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Unassigned Support Queue */}
                <div className={`p-6 border rounded-xl lg:col-span-2 space-y-4 transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Unassigned Support Queue</h3>
                  <div className={`divide-y max-h-[300px] overflow-y-auto ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                    {tickets.filter(t => !t.agent).length === 0 ? (
                      <p className={`text-xs py-4 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tickets currently unassigned.</p>
                    ) : (
                      tickets.filter(t => !t.agent).map(t => (
                        <div
                          key={t.id}
                          onClick={() => { setActiveTab("tickets"); selectTicket(t); }}
                          className={`py-3 flex items-center justify-between px-2 rounded cursor-pointer transition-colors ${
                            isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.title}</h4>
                            <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-mono">
                              <span>CAT: {t.category.name}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                t.priority === "URGENT" 
                                  ? isDark ? "bg-red-950/40 text-red-400 border border-red-500/20" : "bg-red-50 text-red-700 border border-red-200"
                                  : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-600"
                              }`}>{t.priority}</span>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* System Identity */}
                <div className={`p-6 border rounded-xl space-y-4 transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h3 className={`text-sm font-bold uppercase tracking-wider font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>System Identity</h3>
                  <div className="space-y-4 text-xs font-mono">
                    <div className={`p-3 border rounded-lg space-y-2 ${
                      isDark ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Identity:</span>
                        <span className={`font-bold ${isDark ? 'text-[#5FC0F9]' : 'text-[#0d7fc0]'}`}>{user.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">User Role:</span>
                        <span className="text-emerald-400 font-bold">{user.role}</span>
                      </div>
                      <div className="flex justify-between flex-wrap gap-2">
                        <span className="text-slate-500">Node Cluster:</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>express_pnpm_node20</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 2: TICKETS                                                     */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === "tickets" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Ticket Queue List */}
              <div className={`p-6 border rounded-xl lg:col-span-2 space-y-6 transition-colors ${
                isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
              }`}>
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Helpdesk Dispatch</h3>
                  <div className="flex items-center space-x-3">
                    <select
                      value={ticketStatusFilter}
                      onChange={e => setTicketStatusFilter(e.target.value)}
                      className={`text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#5FC0F9] border ${
                        isDark 
                          ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                    <select
                      value={ticketPriorityFilter}
                      onChange={e => setTicketPriorityFilter(e.target.value)}
                      className={`text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#5FC0F9] border ${
                        isDark 
                          ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    >
                      <option value="ALL">All Priorities</option>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className={`overflow-x-auto divide-y ${isDark ? 'divide-white/[0.05]' : 'divide-slate-100'}`}>
                  {filteredTickets.length === 0 ? (
                    <p className={`text-xs py-6 font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No tickets matched active filters.</p>
                  ) : (
                    filteredTickets.map(t => (
                      <div
                        key={t.id}
                        onClick={() => selectTicket(t)}
                        className={`py-3.5 px-3 flex items-center justify-between cursor-pointer rounded-lg transition-colors border ${
                          selectedTicket?.id === t.id 
                            ? isDark ? "bg-[#1E293B] border-[#334155]" : "bg-blue-50/50 border-[#38b1f7]/30"
                            : "border-transparent"
                        } ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
                      >
                        <div className="space-y-1.5 max-w-[70%]">
                          <h4 className={`text-xs font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{t.title}</h4>
                          <div className="flex items-center flex-wrap gap-2 text-[9px] text-slate-500 font-mono">
                            <span className={`px-1.5 py-0.5 rounded border ${
                              t.status === "OPEN" 
                                ? isDark ? "bg-blue-950/50 text-blue-400 border-blue-500/20" : "bg-blue-50 text-blue-700 border-blue-200"
                                : t.status === "IN_PROGRESS"
                                ? isDark ? "bg-amber-950/50 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-200"
                                : t.status === "RESOLVED"
                                ? isDark ? "bg-green-950/50 text-green-400 border-green-500/20" : "bg-green-50 text-green-700 border-green-200"
                                : isDark ? "bg-slate-800 text-slate-400 border-slate-700/30" : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {t.status}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border ${
                              t.priority === "URGENT" 
                                ? isDark ? "bg-red-950/40 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                                : t.priority === "HIGH"
                                ? isDark ? "bg-orange-950/30 text-orange-400 border-orange-500/20" : "bg-orange-50 text-orange-700 border-orange-200"
                                : t.priority === "MEDIUM"
                                ? isDark ? "bg-yellow-950/30 text-yellow-400 border-yellow-500/20" : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : isDark ? "bg-slate-800 text-slate-400 border-slate-700/20" : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}>
                              {t.priority}
                            </span>
                            <span>Assignee: {t.agent?.name || "NONE"}</span>
                            {t.team && <span className={`font-semibold ${isDark ? 'text-[#5FC0F9]' : 'text-[#0d7fc0]'}`}>[{t.team.name}]</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{t.customer.name}</p>
                          <p className="text-[8px] text-slate-500 font-mono mt-0.5">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Ticket Assignment & Conversation Detail Panel */}
              <div className={`p-6 border rounded-xl space-y-6 lg:sticky lg:top-8 transition-colors ${
                isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
              }`}>
                {selectedTicket ? (
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[9px] font-mono ${isDark ? 'text-[#5FC0F9]' : 'text-[#0d7fc0]'}`}>ID: {selectedTicket.id.slice(0, 8)}...</span>
                        <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-red-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedTicket.title}</h3>
                      <p className={`text-xs mt-2 p-3 rounded border whitespace-pre-wrap ${
                        isDark 
                          ? 'text-slate-400 bg-slate-900/60 border-white/[0.02]' 
                          : 'text-slate-600 bg-slate-50 border-slate-200'
                      }`}>
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Metadata controls */}
                    <div className={`p-3.5 border rounded-lg text-xs space-y-3 font-mono ${
                      isDark ? 'bg-white/[0.01] border-white/[0.04]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      {/* Priority */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Priority:</span>
                        <select
                          value={selectedTicket.priority}
                          onChange={e => updateTicketDetails({ priority: e.target.value })}
                          className={`rounded text-[11px] px-1.5 py-0.5 focus:outline-none border ${
                            isDark 
                              ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Status:</span>
                        <select
                          value={selectedTicket.status}
                          onChange={e => updateTicketDetails({ status: e.target.value })}
                          className={`rounded text-[11px] px-1.5 py-0.5 focus:outline-none border ${
                            isDark 
                              ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="OPEN">Open</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </div>

                      {/* Team Assignment */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Team:</span>
                        <select
                          value={selectedTicket.team?.id || ""}
                          onChange={e => {
                            const val = e.target.value;
                            updateTicketDetails({ teamId: val || null, agentId: null });
                          }}
                          className={`rounded text-[11px] px-1.5 py-0.5 focus:outline-none max-w-[150px] border ${
                            isDark 
                              ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="">Unassigned</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Agent Assignment */}
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Agent:</span>
                        <select
                          value={selectedTicket.agent?.id || ""}
                          onChange={e => {
                            const val = e.target.value;
                            updateTicketDetails({ agentId: val || null });
                          }}
                          className={`rounded text-[11px] px-1.5 py-0.5 focus:outline-none max-w-[150px] border ${
                            isDark 
                              ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="">Unassigned</option>
                          {/* Filter agents to only members of the selected team, if a team is assigned */}
                          {(selectedTicket.team
                            ? agents.filter(a =>
                                teams
                                  .find(t => t.id === selectedTicket.team?.id)
                                  ?.members.some(m => m.id === a.id)
                              )
                            : agents
                          ).map(agent => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Messages Conversation */}
                    <div className="space-y-3">
                      <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Communication log</h4>
                      
                      <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                        {selectedTicket.messages?.map(msg => (
                          <div key={msg.id} className={`p-2.5 rounded border text-[11px] space-y-1 ${
                            isDark 
                              ? 'bg-slate-900 border-white/[0.02]' 
                              : 'bg-slate-50 border-slate-200'
                          }`}>
                            <div className="flex items-center justify-between text-slate-500 font-mono text-[9px]">
                              <span className={msg.sender.role === "CUSTOMER" 
                                ? isDark ? "text-[#5FC0F9]" : "text-[#0d7fc0]" 
                                : "text-amber-500"
                              }>
                                {msg.sender.name} ({msg.sender.role})
                              </span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className={`whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{msg.message}</p>
                          </div>
                        ))}
                        {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                          <p className={`text-[10px] font-mono ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>No communication records.</p>
                        )}
                      </div>

                      {/* Reply Box */}
                      <form onSubmit={submitTicketReply} className="flex items-stretch gap-2 pt-2">
                        <input
                          type="text"
                          required
                          value={ticketReply}
                          onChange={e => setTicketReply(e.target.value)}
                          placeholder="Respond to client..."
                          className={`flex-grow text-xs rounded px-3 py-2 focus:outline-none focus:border-[#5FC0F9] border ${
                            isDark 
                              ? 'bg-slate-900 border-[#334155] text-white placeholder-slate-500' 
                              : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                          }`}
                        />
                        <button type="submit" className="px-3 bg-[#5FC0F9] hover:bg-[#38B1F7] text-[#020617] rounded flex items-center justify-center transition-all cursor-pointer">
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="h-[250px] flex flex-col items-center justify-center text-center space-y-2 text-slate-500 font-mono">
                    <Ticket className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="text-xs">No ticket active.</p>
                    <p className="text-[10px] text-slate-600 max-w-[200px]">Select any queue item to dispatch, assign or reply.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 3: TEAMS                                                       */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === "teams" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Operations Teams</h3>
                  <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Group customer support agents by department and assign tickets.</p>
                </div>
                <button
                  onClick={() => setShowCreateTeam(!showCreateTeam)}
                  className={`btn-cyber flex items-center px-4 py-2 text-xs font-mono font-bold ${
                    isDark ? 'text-black' : 'text-white'
                  }`}
                >
                  <Plus className="w-4 h-4 mr-2" /> CREATE NEW TEAM
                </button>
              </div>

              {/* Create Team Form Section */}
              {showCreateTeam && (
                <form onSubmit={handleCreateTeam} className={`p-6 border rounded-xl space-y-4 max-w-xl transition-colors ${
                  isDark 
                    ? 'bg-[#0F172A]/45 border-[#5FC0F9]/20' 
                    : 'bg-white border-[#38b1f7]/30 shadow-sm'
                }`}>
                  <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-[#5FC0F9]' : 'text-[#0d7fc0]'}`}>Team Registration</h4>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Team Name</label>
                    <input
                      type="text"
                      required
                      value={newTeamName}
                      onChange={e => setNewTeamName(e.target.value)}
                      placeholder="e.g. Billing Escalations, Tier 2 Technical"
                      className={`w-full text-xs rounded px-3 py-2 focus:outline-none focus:border-[#5FC0F9] border ${
                        isDark 
                          ? 'bg-slate-900 border-[#334155] text-white' 
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Description</label>
                    <textarea
                      value={newTeamDesc}
                      onChange={e => setNewTeamDesc(e.target.value)}
                      placeholder="Purpose / ticket routing rules..."
                      className={`w-full text-xs rounded px-3 py-2 focus:outline-none focus:border-[#5FC0F9] h-20 border ${
                        isDark 
                          ? 'bg-slate-900 border-[#334155] text-white' 
                          : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>

                  {/* Assign members checkboxes */}
                  <div className="space-y-2">
                    <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Select Team Members (Agents)</label>
                    <div className={`grid grid-cols-2 gap-2 max-h-[120px] overflow-y-auto border p-2.5 rounded ${
                      isDark 
                        ? 'bg-slate-900/40 border-[#334155]' 
                        : 'bg-slate-50 border-slate-200'
                    }`}>
                      {agents.map(a => (
                        <label key={a.id} className={`flex items-center space-x-2 text-xs font-mono cursor-pointer select-none ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          <input
                            type="checkbox"
                            checked={newTeamMembers.includes(a.id)}
                            onChange={() => toggleTeamMemberSelection(a.id)}
                            className="rounded border-[#334155] text-[#5FC0F9] cursor-pointer"
                          />
                          <span>{a.name}</span>
                        </label>
                      ))}
                      {agents.length === 0 && (
                        <p className="text-[10px] text-slate-500 font-mono col-span-2">No agents found. Register users with AGENT roles first.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateTeam(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-bold bg-[#5FC0F9] text-[#020617] rounded hover:bg-[#38B1F7] transition-colors cursor-pointer"
                    >
                      Save Team
                    </button>
                  </div>
                </form>
              )}

              {/* Teams Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map(t => (
                  <div key={t.id} className={`p-6 border rounded-xl flex flex-col justify-between min-h-[200px] transition-colors ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t.name}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">Tickets: {t._count?.tickets ?? 0}</p>
                        </div>
                        {user.role === "ADMIN" && (
                          <button
                            onClick={() => handleDeleteTeam(t.id)}
                            className="text-slate-500 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed font-sans ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{t.description || "No description provided."}</p>
                    </div>

                    <div className={`pt-4 mt-4 border-t ${isDark ? 'border-white/[0.04]' : 'border-slate-100'}`}>
                      <span className="block text-[9px] font-mono uppercase text-slate-500 mb-2">Members ({t.members.length})</span>
                      <div className="flex flex-wrap gap-1.5">
                        {t.members.map(m => (
                          <span key={m.id} className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                            isDark 
                              ? 'bg-[#111827] border-white/[0.05] text-slate-300' 
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {m.name}
                          </span>
                        ))}
                        {t.members.length === 0 && (
                          <span className="text-[9px] font-mono text-slate-500">No agents registered.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {teams.length === 0 && (
                  <p className="text-xs text-slate-500 font-mono">No operations teams constructed yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 4: USER DIRECTORY                                              */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === "users" && user.role === "ADMIN" && (
            <div className={`p-6 border rounded-xl space-y-6 transition-colors ${
              isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>User Directory</h3>
                  <p className="text-[10px] text-slate-500 font-mono">RBAC / account administration dashboard</p>
                </div>

                {/* Search */}
                <div className="relative max-w-sm w-full">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className={`w-full text-xs rounded pl-8 pr-3 py-2 focus:outline-none focus:border-[#5FC0F9] border ${
                      isDark 
                        ? 'bg-slate-900 border-[#334155] text-white' 
                        : 'bg-white border-slate-300 text-slate-800'
                    }`}
                  />
                  <Search className="absolute left-2.5 top-2.5 text-slate-500 w-3.5 h-3.5" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className={`border-b text-slate-500 font-bold uppercase text-[9px] ${
                      isDark ? 'border-white/[0.05]' : 'border-slate-200'
                    }`}>
                      <th className="py-3 px-2">Name</th>
                      <th className="py-3 px-2">Email</th>
                      <th className="py-3 px-2">Role Permissions</th>
                      <th className="py-3 px-2">Access Status</th>
                      <th className="py-3 px-2 text-right">Created At</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/[0.03]' : 'divide-slate-100'}`}>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={isDark ? 'hover:bg-white/[0.01]' : 'hover:bg-slate-50/50'}>
                        <td className={`py-3.5 px-2 font-sans font-semibold ${isDark ? 'text-slate-200' : 'text-slate-850'}`}>{u.name}</td>
                        <td className={`py-3.5 px-2 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>{u.email}</td>
                        <td className="py-3.5 px-2">
                          <select
                            value={u.role}
                            onChange={e => handleUpdateUser(u.id, { role: e.target.value })}
                            className={`rounded text-[10px] px-2 py-0.5 focus:outline-none border ${
                              isDark 
                                ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                                : 'bg-white border-slate-300 text-slate-800'
                            }`}
                          >
                            <option value="CUSTOMER">CUSTOMER</option>
                            <option value="AGENT">AGENT</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-2">
                          <button
                            onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              u.isActive 
                                ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : isDark ? "bg-red-950/40 text-red-400 border-red-500/20" : "bg-red-50 text-red-750 border-red-200"
                            }`}
                          >
                            {u.isActive ? "ACTIVE" : "SUSPENDED"}
                          </button>
                        </td>
                        <td className="py-3.5 px-2 text-right text-slate-500 text-[10px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-slate-500 text-center font-mono">No users matched search criteria.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────────── */}
          {/* TAB 5: KNOWLEDGE BASE                                              */}
          {/* ─────────────────────────────────────────────────────────────────── */}
          {activeTab === "kb" && (
            <div className="space-y-6">
              
              {/* KB Main Views */}
              {!kbEditing ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>Knowledge Repository</h3>
                      <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Construct support manuals and self-service documentation articles.</p>
                    </div>
                    <button
                      onClick={() => {
                        setKbArticleId(null);
                        setKbTitle("");
                        setKbContent("");
                        setKbIsPublished(false);
                        setKbIsInternal(false);
                        setKbCategoryId("");
                        setKbEditing(true);
                      }}
                      className={`btn-cyber flex items-center px-4 py-2 text-xs font-mono font-bold ${
                        isDark ? 'text-black' : 'text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4 mr-2" /> CREATE NEW ARTICLE
                    </button>
                  </div>

                  {/* Articles Grid list */}
                  <div className="grid grid-cols-1 gap-4">
                    {kbArticles.map(art => (
                      <div key={art.id} className={`p-5 border rounded-xl flex items-center justify-between gap-6 transition-colors ${
                        isDark 
                          ? 'bg-[#0F172A]/45 border-white/[0.03] hover:border-white/[0.08]' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}>
                        <div className="space-y-1.5 max-w-[70%]">
                          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                            <h4 className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{art.title}</h4>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                              art.isPublished 
                                ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                : isDark ? "bg-slate-800 border-slate-700/50 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
                            }`}>
                              {art.isPublished ? "PUBLISHED" : "DRAFT"}
                            </span>
                            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded font-bold border ${
                              art.isInternal 
                                ? isDark ? "bg-red-950/40 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200" 
                                : isDark ? "bg-slate-900 border-white/[0.04] text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"
                            }`}>
                              {art.isInternal ? "INTERNAL ONLY" : "PUBLIC"}
                            </span>
                          </div>
                          
                          <p className={`text-[11px] truncate max-w-xl ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>{art.content}</p>
                          
                          <div className="flex items-center space-x-4 text-[9px] text-slate-500 font-mono">
                            <span>Author: {art.author.name}</span>
                            {art.category && <span>Category: {art.category.name}</span>}
                            <span>Slug: {art.slug}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => startEditKB(art)}
                            className={`px-2.5 py-1 text-[10px] font-bold font-mono border rounded transition-colors ${
                              isDark 
                                ? 'bg-[#1E293B] border-[#334155] text-slate-300 hover:text-white' 
                                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleDeleteKB(art.id)}
                            className={`p-1.5 border rounded transition-colors ${
                              isDark 
                                ? 'bg-slate-900 border-white/[0.03] hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 text-slate-500' 
                                : 'bg-slate-50 border-slate-200 hover:bg-red-50 hover:text-red-750 hover:border-red-200 text-slate-400'
                            }`}
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {kbArticles.length === 0 && (
                      <p className="text-xs text-slate-500 font-mono">No articles found in repository.</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Interactive Markdown Article Editor */
                <form onSubmit={handleSaveKB} className={`p-6 border rounded-xl space-y-6 max-w-4xl transition-colors ${
                  isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`text-xs font-bold uppercase tracking-wider font-mono ${isDark ? 'text-[#5FC0F9]' : 'text-[#0d7fc0]'}`}>
                      {kbArticleId ? "Update Article" : "Create KB Article"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setKbEditing(false)}
                      className={`text-xs font-mono font-semibold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      ← BACK TO REPOSITORY
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Editor Inputs */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Article Title</label>
                        <input
                          type="text"
                          required
                          value={kbTitle}
                          onChange={e => setKbTitle(e.target.value)}
                          placeholder="e.g. How to recover forgotten account passwords"
                          className={`w-full text-xs rounded px-3 py-2 focus:outline-none focus:border-[#5FC0F9] border ${
                            isDark 
                              ? 'bg-slate-900 border-[#334155] text-white' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold">Content (Markdown supported)</label>
                        <textarea
                          required
                          value={kbContent}
                          onChange={e => setKbContent(e.target.value)}
                          placeholder="Type markdown article body here..."
                          className={`w-full text-xs rounded px-3 py-2.5 h-80 font-mono focus:outline-none focus:border-[#5FC0F9] border ${
                            isDark 
                              ? 'bg-slate-900 border-[#334155] text-white' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Right: Settings panel */}
                    <div className={`p-4 rounded-lg border space-y-6 ${
                      isDark ? 'bg-slate-900/40 border-white/[0.03]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <h5 className={`text-[10px] font-bold uppercase tracking-wider font-mono pb-2 border-b ${
                        isDark ? 'text-slate-400 border-white/[0.05]' : 'text-slate-650 border-slate-200'
                      }`}>Settings</h5>
                      
                      <div className="space-y-2">
                        <label className="block text-[9px] text-slate-400 font-mono uppercase font-bold">Classification Category</label>
                        <select
                          value={kbCategoryId}
                          onChange={e => setKbCategoryId(e.target.value)}
                          className={`w-full text-xs rounded px-2.5 py-1.5 focus:outline-none focus:border-[#5FC0F9] border ${
                            isDark 
                              ? 'bg-[#0F172A] border-[#334155] text-slate-200' 
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="">Unclassified</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Toggles */}
                      <div className="space-y-4 pt-2">
                        <label className={`flex items-center space-x-2 text-xs font-mono cursor-pointer select-none ${
                          isDark ? 'text-slate-300' : 'text-slate-750'
                        }`}>
                          <input
                            type="checkbox"
                            checked={kbIsPublished}
                            onChange={() => setKbIsPublished(!kbIsPublished)}
                            className="rounded border-[#334155] text-[#5FC0F9] cursor-pointer"
                          />
                          <span>Publish Immediately</span>
                        </label>

                        <label className={`flex items-center space-x-2 text-xs font-mono cursor-pointer select-none ${
                          isDark ? 'text-red-400' : 'text-red-750'
                        }`}>
                          <input
                            type="checkbox"
                            checked={kbIsInternal}
                            onChange={() => setKbIsInternal(!kbIsInternal)}
                            className="rounded border-[#334155] text-red-500 cursor-pointer"
                          />
                          <span>Internal Agent View Only</span>
                        </label>
                      </div>

                      <div className="pt-6">
                        <button
                          type="submit"
                          className="w-full py-2.5 text-xs font-mono font-bold bg-[#5FC0F9] hover:bg-[#38B1F7] text-[#020617] rounded active:scale-98 transition-all cursor-pointer"
                        >
                          {kbArticleId ? "UPDATE ARTICLE" : "PERSIST ARTICLE"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
