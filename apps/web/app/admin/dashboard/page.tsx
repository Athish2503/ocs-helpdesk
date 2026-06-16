"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchWithAuth } from "../../../lib/api";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Layers,
  BookOpen,
  Plus,
  Trash2,
  X,
  Search,
  AlertCircle,
  Send,
  Edit2,
  CheckCircle,
  Clock,
  CircleDot,
  MinusCircle,
  ArrowUpCircle,
  ArrowUp,
  Minus,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useDialog } from "../../../context/DialogContext";
import AdminShell, { AdminShellSkeleton } from "../../../components/admin/AdminShell";

// ── Types ──────────────────────────────────────────────────────────
interface Category { id: string; name: string; }
interface Team {
  id: string; name: string; description: string | null;
  members: { id: string; name: string; email: string; role: string }[];
  _count?: { tickets: number };
}
interface Agent { id: string; name: string; email: string; }
interface UserProfile {
  id: string; name: string; email: string;
  role: "CUSTOMER" | "ADMIN" | "AGENT";
  isActive: boolean; emailVerified: boolean; createdAt: string;
  teams?: { id: string; name: string }[];
}
interface TicketMessage {
  id: string; message: string; createdAt: string;
  sender: { id: string; name: string; email: string; role: string };
}
interface TicketData {
  id: string; title: string; description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string; updatedAt: string;
  category: Category;
  customer: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
  team: { id: string; name: string } | null;
  messages?: TicketMessage[];
}
interface KBArticle {
  id: string; title: string; slug: string; content: string;
  isPublished: boolean; isInternal: boolean; createdAt: string;
  author: { id: string; name: string };
  category: Category | null;
}

// ── Status / Priority Helpers ──────────────────────────────────────
function statusBadgeClass(status: string) {
  switch (status) {
    case "OPEN": return "admin-badge admin-badge-open";
    case "IN_PROGRESS": return "admin-badge admin-badge-in-progress";
    case "RESOLVED": return "admin-badge admin-badge-resolved";
    case "CLOSED": return "admin-badge admin-badge-closed";
    default: return "admin-badge admin-badge-closed";
  }
}
function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "URGENT": return "admin-badge admin-badge-urgent";
    case "HIGH": return "admin-badge admin-badge-high";
    case "MEDIUM": return "admin-badge admin-badge-medium";
    case "LOW": return "admin-badge admin-badge-low";
    default: return "admin-badge admin-badge-low";
  }
}
function StatusIcon({ status }: { status: string }) {
  const cls = "w-3 h-3";
  switch (status) {
    case "OPEN": return <CircleDot className={`${cls} text-blue-500`} />;
    case "IN_PROGRESS": return <Clock className={`${cls} text-amber-500`} />;
    case "RESOLVED": return <CheckCircle className={`${cls} text-green-500`} />;
    default: return <MinusCircle className={`${cls} text-slate-400`} />;
  }
}

// ── Main Component ─────────────────────────────────────────────────
export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const dialog = useDialog();

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") return s;
    }
    return "light";
  });
  useEffect(() => {
    const handler = () => {
      const s = localStorage.getItem("theme");
      if (s === "dark" || s === "light") setTheme(s);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  const toggleTheme = () => {
    const n = theme === "light" ? "dark" : "light";
    setTheme(n);
    localStorage.setItem("theme", n);
    toast.info(`Switched to ${n === "dark" ? "Dark" : "Light"} Mode`);
  };
  const isDark = theme === "dark";

  // Active Tab
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "teams" | "clients" | "admins" | "kb">("overview");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "overview" || p === "tickets" || p === "teams" || p === "clients" || p === "admins" || p === "kb") {
        setActiveTab(p);
      }
    }
  }, []);

  // Data
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ticket state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("ALL");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("ALL");

  // Team state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newTeamMembers, setNewTeamMembers] = useState<string[]>([]);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [editTeamName, setEditTeamName] = useState("");
  const [editTeamDesc, setEditTeamDesc] = useState("");
  const [editTeamMembers, setEditTeamMembers] = useState<string[]>([]);

  // User state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userFormName, setUserFormName] = useState("");
  const [userFormEmail, setUserFormEmail] = useState("");
  const [userFormPassword, setUserFormPassword] = useState("");
  const [userFormRole, setUserFormRole] = useState<"CUSTOMER" | "AGENT" | "ADMIN">("CUSTOMER");
  const [userFormIsActive, setUserFormIsActive] = useState(true);
  const [userFormTeams, setUserFormTeams] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // KB state
  const [kbEditing, setKbEditing] = useState(false);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbIsPublished, setKbIsPublished] = useState(false);
  const [kbIsInternal, setKbIsInternal] = useState(false);
  const [kbCategoryId, setKbCategoryId] = useState("");

  // ── Data Fetching ────────────────────────────────────────────────
  const refreshAllData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [ticketsRes, teamsRes, agentsRes, kbRes, catRes] = await Promise.all([
        fetchWithAuth("/tickets"),
        fetchWithAuth("/teams"),
        fetchWithAuth("/users/agents"),
        fetchWithAuth("/kb"),
        fetchWithAuth("/categories"),
      ]);
      if (ticketsRes.ok) setTickets((await ticketsRes.json()).data.tickets);
      if (teamsRes.ok) setTeams((await teamsRes.json()).data.teams);
      if (agentsRes.ok) setAgents((await agentsRes.json()).data.agents);
      if (kbRes.ok) setKbArticles((await kbRes.json()).data.articles);
      if (catRes.ok) {
        const r = await catRes.json();
        setCategories(r.data.categories || r.data);
      }
      if (user?.role === "ADMIN") {
        const usersRes = await fetchWithAuth("/users");
        if (usersRes.ok) setUsers((await usersRes.json()).data.users);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please refresh.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { if (user) refreshAllData(); }, [user]); // eslint-disable-line

  // ── Ticket Actions ───────────────────────────────────────────────
  const selectTicket = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setTicketReply("");
    try {
      const res = await fetchWithAuth(`/tickets/${ticket.id}`);
      if (res.ok) setSelectedTicket((await res.json()).data.ticket);
    } catch (err) { console.error(err); }
  };

  const updateTicketDetails = async (updates: { status?: string; priority?: string; teamId?: string | null; agentId?: string | null }) => {
    if (!selectedTicket) return;
    try {
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}`, { method: "PATCH", body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = (await res.json()).data.ticket;
        setSelectedTicket(prev => prev ? { ...prev, ...updated } : null);
        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        toast.success("Ticket updated.");
      } else toast.error("Failed to update ticket.");
    } catch { toast.error("Failed to update ticket."); }
  };

  const submitTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;
    try {
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}/messages`, { method: "POST", body: JSON.stringify({ message: ticketReply }) });
      if (res.ok) {
        const newMsg = (await res.json()).data.message;
        setSelectedTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMsg] } : null);
        setTicketReply("");
        toast.success("Reply sent.");
      } else toast.error("Failed to send reply.");
    } catch { toast.error("Failed to send reply."); }
  };

  // ── Team Actions ─────────────────────────────────────────────────
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      const res = await fetchWithAuth("/teams", { method: "POST", body: JSON.stringify({ name: newTeamName, description: newTeamDesc, memberIds: newTeamMembers }) });
      if (res.ok) {
        setNewTeamName(""); setNewTeamDesc(""); setNewTeamMembers([]); setShowCreateTeam(false);
        refreshAllData(); toast.success("Team created.");
      } else toast.error((await res.json()).error?.message || "Error creating team");
    } catch { toast.error("Failed to create team."); }
  };

  const toggleTeamMemberSelection = (agentId: string) =>
    setNewTeamMembers(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);

  const handleDeleteTeam = async (teamId: string) => {
    const confirmed = await dialog.confirm("Delete this team? Assigned tickets will be unassigned.", "Delete Team");
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) { refreshAllData(); toast.success("Team deleted."); }
      else toast.error("Failed to delete team.");
    } catch { toast.error("Failed to delete team."); }
  };

  const handleEditTeamClick = (t: Team) => {
    setSelectedTeam(t); setEditTeamName(t.name); setEditTeamDesc(t.description || "");
    setEditTeamMembers(t.members.map(m => m.id)); setShowEditTeam(true);
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !editTeamName.trim()) { toast.error("Team name is required."); return; }
    try {
      const res = await fetchWithAuth(`/teams/${selectedTeam.id}`, { method: "PATCH", body: JSON.stringify({ name: editTeamName, description: editTeamDesc, memberIds: editTeamMembers }) });
      if (res.ok) { toast.success("Team updated."); setShowEditTeam(false); setSelectedTeam(null); refreshAllData(); }
      else toast.error((await res.json()).error?.message || "Error updating team");
    } catch { toast.error("Failed to update team."); }
  };

  // ── User Actions ─────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim() || !userFormPassword.trim()) { toast.error("Name, email, and password are required."); return; }
    try {
      const res = await fetchWithAuth("/users", { method: "POST", body: JSON.stringify({ name: userFormName, email: userFormEmail, password: userFormPassword, role: userFormRole, teamIds: (userFormRole === "AGENT" || userFormRole === "ADMIN") ? userFormTeams : [] }) });
      if (res.ok) {
        toast.success("User created."); setShowCreateUser(false);
        setUserFormName(""); setUserFormEmail(""); setUserFormPassword(""); setUserFormRole("CUSTOMER"); setUserFormTeams([]);
        refreshAllData();
      } else toast.error((await res.json()).error?.message || "Error creating user");
    } catch { toast.error("Failed to create user."); }
  };

  const handleEditUserClick = (u: UserProfile) => {
    setSelectedUser(u); setUserFormName(u.name); setUserFormEmail(u.email); setUserFormPassword("");
    setUserFormRole(u.role); setUserFormIsActive(u.isActive); setUserFormTeams(u.teams ? u.teams.map(t => t.id) : []);
    setShowEditUser(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !userFormName.trim() || !userFormEmail.trim()) { toast.error("Name and email are required."); return; }
    const payload: any = { name: userFormName, email: userFormEmail, role: userFormRole, isActive: userFormIsActive, teamIds: (userFormRole === "AGENT" || userFormRole === "ADMIN") ? userFormTeams : [] };
    if (userFormPassword.trim()) payload.password = userFormPassword;
    try {
      const res = await fetchWithAuth(`/users/${selectedUser.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (res.ok) { toast.success("User updated."); setShowEditUser(false); setSelectedUser(null); refreshAllData(); }
      else toast.error((await res.json()).error?.message || "Error updating user");
    } catch { toast.error("Failed to update user."); }
  };

  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = (await res.json()).data.user;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        toast.success("User updated.");
      } else toast.error("Failed to update user.");
    } catch { toast.error("Failed to update user."); }
  };

  // ── KB Actions ───────────────────────────────────────────────────
  const handleSaveKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;
    const payload = { title: kbTitle, content: kbContent, isPublished: kbIsPublished, isInternal: kbIsInternal, categoryId: kbCategoryId || null };
    try {
      const res = kbArticleId
        ? await fetchWithAuth(`/kb/${kbArticleId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await fetchWithAuth("/kb", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        setKbTitle(""); setKbContent(""); setKbIsPublished(false); setKbIsInternal(false); setKbCategoryId(""); setKbArticleId(null); setKbEditing(false);
        refreshAllData(); toast.success("KB article saved.");
      } else toast.error((await res.json()).error?.message || "Error saving article");
    } catch { toast.error("Failed to save article."); }
  };

  const startEditKB = (art: KBArticle) => {
    setKbArticleId(art.id); setKbTitle(art.title); setKbContent(art.content);
    setKbIsPublished(art.isPublished); setKbIsInternal(art.isInternal); setKbCategoryId(art.category?.id || "");
    setKbEditing(true);
  };

  const handleDeleteKB = async (articleId: string) => {
    const confirmed = await dialog.confirm("Delete this article permanently?", "Delete Article");
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/kb/${articleId}`, { method: "DELETE" });
      if (res.ok) { refreshAllData(); toast.success("Article deleted."); }
      else toast.error("Failed to delete article.");
    } catch { toast.error("Failed to delete article."); }
  };

  // ── Loading skeleton ─────────────────────────────────────────────
  if (authLoading || !user) {
    const isDarkTheme = typeof window !== "undefined" && localStorage.getItem("theme") === "dark";
    return <AdminShellSkeleton isDark={isDarkTheme} />;
  }

  // Derived data
  const filteredTickets = tickets.filter(t => {
    if (ticketStatusFilter !== "ALL" && t.status !== ticketStatusFilter) return false;
    if (ticketPriorityFilter !== "ALL" && t.priority !== ticketPriorityFilter) return false;
    return true;
  });

  const tabTitles: Record<string, { title: string; description: string }> = {
    overview: { title: "Overview", description: "Operational summary & quick actions" },
    tickets: { title: "Ticket Queue", description: "Manage and assign support requests" },
    teams: { title: "Teams", description: "Organize agents into support groups" },
    clients: { title: "Client Accounts", description: "External customer profiles" },
    admins: { title: "Staff Directory", description: "Agents, admins, and permissions" },
    kb: { title: "Knowledge Base", description: "Self-service articles & documentation" },
  };

  const current = tabTitles[activeTab] || tabTitles.overview;

  return (
    <AdminShell
      user={user}
      onLogout={() => logout("/admin/login")}
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab as any);
        setSelectedTicket(null);
        setKbEditing(false);
      }}
      headerTitle={current.title}
      headerDescription={current.description}
      isLoading={dataLoading}
      onRefresh={refreshAllData}
      isDark={isDark}
      onToggleTheme={toggleTheme}
    >
      <div className="p-6 md:p-8 max-w-[1440px] w-full mx-auto space-y-6 admin-fade-in">

        {/* ── Error Banner ───────────────────────────────────────── */}
        {error && (
          <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm ${isDark ? "bg-red-950/30 border-red-500/25 text-red-300" : "bg-red-50 border-red-200 text-red-700"}`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto shrink-0 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Total Tickets"
                value={tickets.length}
                icon={<Ticket className="w-5 h-5" />}
                iconBg="bg-blue-50 text-blue-600"
                iconBgDark="bg-blue-500/10 text-blue-400"
                isDark={isDark}
              />
              <StatCard
                label="Pending"
                value={tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length}
                icon={<Clock className="w-5 h-5" />}
                iconBg="bg-amber-50 text-amber-600"
                iconBgDark="bg-amber-500/10 text-amber-400"
                isDark={isDark}
                highlight
              />
              <StatCard
                label="Active Teams"
                value={teams.length}
                icon={<Layers className="w-5 h-5" />}
                iconBg="bg-indigo-50 text-indigo-600"
                iconBgDark="bg-indigo-500/10 text-indigo-400"
                isDark={isDark}
              />
              <StatCard
                label="KB Articles"
                value={kbArticles.length}
                icon={<BookOpen className="w-5 h-5" />}
                iconBg="bg-emerald-50 text-emerald-600"
                iconBgDark="bg-emerald-500/10 text-emerald-400"
                isDark={isDark}
              />
            </div>

            {/* Overview grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Unassigned Queue */}
              <div className={`lg:col-span-2 admin-card p-5 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Unassigned Queue</h2>
                  <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {tickets.filter(t => !t.agent).length} unassigned
                  </span>
                </div>
                <div className={`divide-y overflow-y-auto max-h-72 ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                  {tickets.filter(t => !t.agent).length === 0 ? (
                    <EmptyState icon={<CheckCircle className="w-8 h-8" />} title="All caught up!" description="No unassigned tickets right now." isDark={isDark} />
                  ) : tickets.filter(t => !t.agent).map(t => (
                    <div
                      key={t.id}
                      onClick={() => { setActiveTab("tickets"); selectTicket(t); }}
                      className={`flex items-center justify-between py-3 px-2 rounded-lg cursor-pointer transition-colors ${isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}
                    >
                      <div className="space-y-1 min-w-0 flex-1 mr-4">
                        <p className={`text-sm font-medium truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{t.title}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{t.category.name}</span>
                          <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                        </div>
                      </div>
                      <span className={`text-xs shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{new Date(t.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Info */}
              <div className={`admin-card p-5 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Session Info</h2>
                <div className="space-y-3">
                  {[
                    { label: "Logged in as", value: user.name },
                    { label: "Role", value: user.role },
                    { label: "Resolved today", value: tickets.filter(t => t.status === "RESOLVED").length.toString() },
                    { label: "Published articles", value: kbArticles.filter(a => a.isPublished).length.toString() },
                  ].map(item => (
                    <div key={item.label} className={`flex justify-between items-center py-2 border-b text-sm last:border-0 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                      <span className={isDark ? "text-slate-500" : "text-slate-400"}>{item.label}</span>
                      <span className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: TICKETS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "tickets" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* Ticket List */}
            <div className={`lg:col-span-3 admin-card ${isDark ? "admin-dark" : ""} overflow-hidden`}>
              {/* Toolbar */}
              <div className={`px-5 py-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                <h2 className={`text-sm font-semibold flex-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                  All Tickets
                  {filteredTickets.length !== tickets.length && (
                    <span className={`ml-2 text-xs font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>({filteredTickets.length} shown)</span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={ticketStatusFilter}
                    onChange={e => setTicketStatusFilter(e.target.value)}
                    className={`admin-select ${isDark ? "admin-dark" : ""} h-9 text-xs`}
                    style={{ height: 36 }}
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
                    className={`admin-select ${isDark ? "admin-dark" : ""} h-9 text-xs`}
                    style={{ height: 36 }}
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className={`divide-y overflow-y-auto max-h-[600px] ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                {filteredTickets.length === 0 ? (
                  <EmptyState icon={<Ticket className="w-8 h-8" />} title="No tickets found" description="No tickets match the active filters." isDark={isDark} />
                ) : filteredTickets.map(t => (
                  <div
                    key={t.id}
                    onClick={() => selectTicket(t)}
                    className={`flex items-start justify-between px-5 py-4 cursor-pointer transition-colors ${
                      selectedTicket?.id === t.id
                        ? isDark ? "bg-[#38b1f7]/8 border-l-2 border-[#38b1f7]" : "bg-blue-50/60 border-l-2 border-[#38b1f7]"
                        : isDark ? "hover:bg-white/[0.025] border-l-2 border-transparent" : "hover:bg-slate-50 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0 mr-3">
                      <p className={`text-sm font-medium leading-tight truncate ${isDark ? "text-slate-100" : "text-slate-800"}`}>{t.title}</p>
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className={statusBadgeClass(t.status)}>
                          <StatusIcon status={t.status} />
                          {t.status.replace("_", " ")}
                        </span>
                        <span className={priorityBadgeClass(t.priority)}>{t.priority}</span>
                        {t.team && (
                          <span className={`admin-badge ${isDark ? "bg-[#38b1f7]/10 text-[#5fc0f9] border-[#38b1f7]/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                            {t.team.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>{t.customer.name}</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={`lg:col-span-2 admin-card sticky top-6 ${isDark ? "admin-dark" : ""} overflow-hidden`}>
              {selectedTicket ? (
                <div className="flex flex-col h-full max-h-[85vh]">
                  {/* Panel header */}
                  <div className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[11px] font-mono mb-1 ${isDark ? "text-[#5fc0f9]" : "text-[#0d7fc0]"}`}>#{selectedTicket.id.slice(0, 8)}</p>
                      <h3 className={`text-sm font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{selectedTicket.title}</h3>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDark ? "text-slate-500 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto">
                    {/* Description */}
                    <div className="px-5 py-4">
                      <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{selectedTicket.description}</p>
                    </div>

                    {/* Metadata controls */}
                    <div className={`mx-5 mb-4 p-4 rounded-xl border space-y-3 ${isDark ? "bg-white/[0.02] border-white/[0.05]" : "bg-slate-50 border-slate-200"}`}>
                      {[
                        {
                          label: "Priority", value: selectedTicket.priority,
                          options: ["LOW", "MEDIUM", "HIGH", "URGENT"],
                          onChange: (v: string) => updateTicketDetails({ priority: v }),
                        },
                        {
                          label: "Status", value: selectedTicket.status,
                          options: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
                          onChange: (v: string) => updateTicketDetails({ status: v }),
                        },
                      ].map(({ label, value, options, onChange }) => (
                        <div key={label} className="flex items-center justify-between gap-3">
                          <span className={`text-xs font-medium shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
                          <select
                            value={value}
                            onChange={e => onChange(e.target.value)}
                            className={`admin-select text-xs flex-1 max-w-[160px] ${isDark ? "admin-dark" : ""}`}
                            style={{ height: 32 }}
                          >
                            {options.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                          </select>
                        </div>
                      ))}

                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-xs font-medium shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Team</span>
                        <select
                          value={selectedTicket.team?.id || ""}
                          onChange={e => updateTicketDetails({ teamId: e.target.value || null, agentId: null })}
                          className={`admin-select text-xs flex-1 max-w-[160px] ${isDark ? "admin-dark" : ""}`}
                          style={{ height: 32 }}
                        >
                          <option value="">Unassigned</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className={`text-xs font-medium shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Agent</span>
                        <select
                          value={selectedTicket.agent?.id || ""}
                          onChange={e => updateTicketDetails({ agentId: e.target.value || null })}
                          className={`admin-select text-xs flex-1 max-w-[160px] ${isDark ? "admin-dark" : ""}`}
                          style={{ height: 32 }}
                        >
                          <option value="">Unassigned</option>
                          {(selectedTicket.team
                            ? agents.filter(a => teams.find(t => t.id === selectedTicket.team?.id)?.members.some(m => m.id === a.id))
                            : agents
                          ).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="px-5 pb-4 space-y-3">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
                        Conversation
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedTicket.messages?.map(msg => (
                          <div key={msg.id} className={`p-3 rounded-xl border text-sm ${
                            msg.sender.role === "CUSTOMER"
                              ? isDark ? "bg-[#38b1f7]/6 border-[#38b1f7]/15" : "bg-blue-50/60 border-blue-100"
                              : isDark ? "bg-white/[0.03] border-white/[0.04]" : "bg-slate-50 border-slate-100"
                          }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`text-xs font-semibold ${
                                msg.sender.role === "CUSTOMER"
                                  ? isDark ? "text-[#5fc0f9]" : "text-blue-700"
                                  : isDark ? "text-amber-400" : "text-amber-700"
                              }`}>{msg.sender.name}</span>
                              <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className={`text-xs leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}>{msg.message}</p>
                          </div>
                        ))}
                        {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                          <p className={`text-xs text-center py-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}>No messages yet.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Reply box */}
                  <div className={`px-5 py-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                    <form onSubmit={submitTicketReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={ticketReply}
                        onChange={e => setTicketReply(e.target.value)}
                        placeholder="Write a reply..."
                        className={`admin-input ${isDark ? "admin-dark" : ""} flex-1 text-sm`}
                        style={{ height: 38 }}
                      />
                      <button type="submit" className="admin-btn admin-btn-primary px-3" style={{ height: 38 }} aria-label="Send reply">
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="h-64">
                  <EmptyState icon={<Ticket className="w-8 h-8" />} title="Select a ticket" description="Click any ticket in the list to view details, assign agents, and reply." isDark={isDark} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: TEAMS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "teams" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Support Teams</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Organize agents and route tickets by team.</p>
              </div>
              <button onClick={() => setShowCreateTeam(true)} className="admin-btn admin-btn-primary">
                <Plus className="w-4 h-4" />
                New Team
              </button>
            </div>

            {/* ── Create Team Modal ─────────────────────────────── */}
            {showCreateTeam && (
              <TeamModal
                title="Create New Team"
                subtitle="Set up a team to group agents and route tickets"
                isDark={isDark}
                name={newTeamName}
                onNameChange={setNewTeamName}
                description={newTeamDesc}
                onDescriptionChange={setNewTeamDesc}
                selectedMemberIds={newTeamMembers}
                onMembersChange={setNewTeamMembers}
                agents={agents}
                onClose={() => { setShowCreateTeam(false); setNewTeamName(""); setNewTeamDesc(""); setNewTeamMembers([]); }}
                onSubmit={handleCreateTeam}
                submitLabel="Create Team"
              />
            )}

            {/* ── Edit Team Modal ───────────────────────────────── */}
            {showEditTeam && selectedTeam && (
              <TeamModal
                title="Edit Team"
                subtitle={`Editing: ${selectedTeam.name}`}
                isDark={isDark}
                name={editTeamName}
                onNameChange={setEditTeamName}
                description={editTeamDesc}
                onDescriptionChange={setEditTeamDesc}
                selectedMemberIds={editTeamMembers}
                onMembersChange={setEditTeamMembers}
                agents={agents}
                onClose={() => { setShowEditTeam(false); setSelectedTeam(null); }}
                onSubmit={handleEditTeam}
                submitLabel="Save Changes"
              />
            )}

            {/* ── Teams Grid ────────────────────────────────────── */}
            {teams.length === 0 ? (
              <div className={`admin-card ${isDark ? "admin-dark" : ""}`}>
                <EmptyState icon={<Layers className="w-10 h-10" />} title="No teams yet" description="Create your first team to group agents and route support tickets efficiently." isDark={isDark} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {teams.map(t => (
                  <div
                    key={t.id}
                    className={`admin-card admin-card-hover flex flex-col ${isDark ? "admin-dark" : ""}`}
                  >
                    {/* Card header */}
                    <div className={`flex items-start justify-between px-5 pt-5 pb-4 border-b ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isDark ? "bg-[#38b1f7]/12 text-[#5fc0f9]" : "bg-[#38b1f7]/10 text-[#0d7fc0]"}`}>
                            <Layers className="w-4 h-4" />
                          </div>
                          <h3 className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-slate-900"}`}>{t.name}</h3>
                        </div>
                        <p className={`text-xs pl-10 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                          {t.members.length} member{t.members.length !== 1 ? "s" : ""} · {t._count?.tickets ?? 0} tickets
                        </p>
                      </div>
                      {user.role === "ADMIN" && (
                        <div className="flex gap-1 shrink-0">
                          <button
                            onClick={() => handleEditTeamClick(t)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-[#5fc0f9] hover:bg-white/[0.05]" : "text-slate-400 hover:text-[#0d7fc0] hover:bg-blue-50"}`}
                            title="Edit team"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeam(t.id)}
                            className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-950/20" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}
                            title="Delete team"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="px-5 py-3 flex-1">
                      {t.description ? (
                        <p className={`text-xs leading-relaxed ${isDark ? "text-slate-400" : "text-slate-600"}`}>{t.description}</p>
                      ) : (
                        <p className={`text-xs italic ${isDark ? "text-slate-600" : "text-slate-400"}`}>No description</p>
                      )}
                    </div>

                    {/* Members */}
                    <div className={`px-5 pb-5 pt-3 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-2.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>Members</p>
                      {t.members.length === 0 ? (
                        <p className={`text-xs ${isDark ? "text-slate-700" : "text-slate-400"}`}>No members assigned</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {t.members.map(m => (
                            <div
                              key={m.id}
                              title={m.email}
                              className={`flex items-center gap-1.5 admin-badge ${isDark ? "bg-[#38b1f7]/8 text-[#5fc0f9] border-[#38b1f7]/15" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                            >
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isDark ? "bg-[#38b1f7]/20" : "bg-blue-200"}`}>
                                {m.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate max-w-[80px]">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CLIENTS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "clients" && user.role === "ADMIN" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Client Accounts</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>External customers and support submitters.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search clients..." className={`admin-input ${isDark ? "admin-dark" : ""} pl-9 w-64 text-sm`} style={{ height: 38 }} />
                </div>
                <button
                  onClick={() => { setUserFormName(""); setUserFormEmail(""); setUserFormPassword(""); setUserFormRole("CUSTOMER"); setUserFormTeams([]); setShowCreateUser(true); }}
                  className="admin-btn admin-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  New Client
                </button>
              </div>
            </div>

            <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === "CUSTOMER").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8"><span className={isDark ? "text-slate-500" : "text-slate-400"}>No clients found.</span></td></tr>
                    ) : users.filter(u => u.role === "CUSTOMER").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <tr key={u.id}>
                        <td><span className={`font-medium text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>{u.name}</span></td>
                        <td><span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{u.email}</span></td>
                        <td>
                          <button onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })} className={`admin-badge cursor-pointer transition-opacity hover:opacity-80 ${u.isActive ? "admin-badge-active" : "admin-badge-suspended"}`}>
                            {u.isActive ? "Active" : "Suspended"}
                          </button>
                        </td>
                        <td><span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                        <td className="text-center">
                          <button onClick={() => handleEditUserClick(u)} className={`admin-btn admin-btn-ghost admin-btn-sm`}>
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Client Modal */}
            {showCreateUser && userFormRole === "CUSTOMER" && (
              <UserModal
                title="Create Client Account"
                subtitle="New external customer profile"
                isDark={isDark}
                showRole={false}
                showTeams={false}
                showStatusToggle={false}
                formName={userFormName} setFormName={setUserFormName}
                formEmail={userFormEmail} setFormEmail={setUserFormEmail}
                formPassword={userFormPassword} setFormPassword={setUserFormPassword}
                formRole={userFormRole} setFormRole={setUserFormRole}
                formIsActive={userFormIsActive} setFormIsActive={setUserFormIsActive}
                formTeams={userFormTeams} setFormTeams={setUserFormTeams}
                teams={teams}
                onClose={() => setShowCreateUser(false)}
                onSubmit={handleCreateUser}
                submitLabel="Create Client"
              />
            )}

            {/* Edit Client Modal */}
            {showEditUser && selectedUser?.role === "CUSTOMER" && (
              <UserModal
                title="Edit Client Account"
                subtitle={`ID: ${selectedUser.id.slice(0, 12)}...`}
                isDark={isDark}
                showRole={false}
                showTeams={false}
                showStatusToggle={true}
                formName={userFormName} setFormName={setUserFormName}
                formEmail={userFormEmail} setFormEmail={setUserFormEmail}
                formPassword={userFormPassword} setFormPassword={setUserFormPassword}
                formRole={userFormRole} setFormRole={setUserFormRole}
                formIsActive={userFormIsActive} setFormIsActive={setUserFormIsActive}
                formTeams={userFormTeams} setFormTeams={setUserFormTeams}
                teams={teams}
                onClose={() => { setShowEditUser(false); setSelectedUser(null); }}
                onSubmit={handleSaveEditUser}
                submitLabel="Save Changes"
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: STAFF DIRECTORY
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "admins" && user.role === "ADMIN" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Staff Directory</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Agents, administrators, and their permissions.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className={`absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search staff..." className={`admin-input ${isDark ? "admin-dark" : ""} pl-9 w-50 text-sm`} style={{ height: 40 }} />
                </div>
                <button
                  onClick={() => { setUserFormName(""); setUserFormEmail(""); setUserFormPassword(""); setUserFormRole("AGENT"); setUserFormTeams([]); setShowCreateUser(true); }}
                  className="admin-btn admin-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  New Staff
                </button>
              </div>
            </div>

            <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Teams</th>
                      <th>Status</th>
                      <th>Created</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.role === "AGENT" || u.role === "ADMIN").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8"><span className={isDark ? "text-slate-500" : "text-slate-400"}>No staff found.</span></td></tr>
                    ) : users.filter(u => u.role === "AGENT" || u.role === "ADMIN").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
                      <tr key={u.id}>
                        <td><span className={`font-medium text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>{u.name}</span></td>
                        <td><span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>{u.email}</span></td>
                        <td>
                          <span className={`admin-badge ${u.role === "ADMIN" ? "admin-badge-admin" : "admin-badge-agent"}`}>{u.role}</span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {u.teams && u.teams.length > 0
                              ? u.teams.map(t => <span key={t.id} className={`admin-badge admin-badge-agent`}>{t.name}</span>)
                              : <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>—</span>
                            }
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handleUpdateUser(u.id, { isActive: !u.isActive })} className={`admin-badge cursor-pointer hover:opacity-80 transition-opacity ${u.isActive ? "admin-badge-active" : "admin-badge-suspended"}`}>
                            {u.isActive ? "Active" : "Suspended"}
                          </button>
                        </td>
                        <td><span className={`text-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>{new Date(u.createdAt).toLocaleDateString()}</span></td>
                        <td className="text-center">
                          <button onClick={() => handleEditUserClick(u)} className="admin-btn admin-btn-ghost admin-btn-sm">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Create Staff Modal */}
            {showCreateUser && (userFormRole === "AGENT" || userFormRole === "ADMIN") && (
              <UserModal
                title="Create Staff Account"
                subtitle="New agent or administrator profile"
                isDark={isDark}
                showRole={true}
                showTeams={true}
                showStatusToggle={false}
                formName={userFormName} setFormName={setUserFormName}
                formEmail={userFormEmail} setFormEmail={setUserFormEmail}
                formPassword={userFormPassword} setFormPassword={setUserFormPassword}
                formRole={userFormRole} setFormRole={setUserFormRole}
                formIsActive={userFormIsActive} setFormIsActive={setUserFormIsActive}
                formTeams={userFormTeams} setFormTeams={setUserFormTeams}
                teams={teams}
                onClose={() => setShowCreateUser(false)}
                onSubmit={handleCreateUser}
                submitLabel="Create Staff"
              />
            )}

            {/* Edit Staff Modal */}
            {showEditUser && selectedUser && (selectedUser.role === "AGENT" || selectedUser.role === "ADMIN") && (
              <UserModal
                title="Edit Staff Profile"
                subtitle={`ID: ${selectedUser.id.slice(0, 12)}...`}
                isDark={isDark}
                showRole={true}
                showTeams={true}
                showStatusToggle={true}
                formName={userFormName} setFormName={setUserFormName}
                formEmail={userFormEmail} setFormEmail={setUserFormEmail}
                formPassword={userFormPassword} setFormPassword={setUserFormPassword}
                formRole={userFormRole} setFormRole={setUserFormRole}
                formIsActive={userFormIsActive} setFormIsActive={setUserFormIsActive}
                formTeams={userFormTeams} setFormTeams={setUserFormTeams}
                teams={teams}
                onClose={() => { setShowEditUser(false); setSelectedUser(null); }}
                onSubmit={handleSaveEditUser}
                submitLabel="Save Changes"
              />
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: KNOWLEDGE BASE (Quick inline, navigates to full KB)
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "kb" && (
          <div className="space-y-5">
            {!kbEditing ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Knowledge Base</h2>
                    <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Articles and self-service documentation.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => router.push("/admin/dashboard/kb")} className="admin-btn admin-btn-secondary admin-btn-sm">
                      <BookOpen className="w-4 h-4" />
                      Full KB Manager
                    </button>
                    <button
                      onClick={() => { setKbArticleId(null); setKbTitle(""); setKbContent(""); setKbIsPublished(false); setKbIsInternal(false); setKbCategoryId(""); setKbEditing(true); }}
                      className="admin-btn admin-btn-primary"
                    >
                      <Plus className="w-4 h-4" />
                      New Article
                    </button>
                  </div>
                </div>

                <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
                  <div className={`divide-y ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                    {kbArticles.length === 0 ? (
                      <EmptyState icon={<BookOpen className="w-8 h-8" />} title="No articles yet" description="Create your first KB article to help customers self-serve." isDark={isDark} />
                    ) : kbArticles.map(art => (
                      <div key={art.id} className={`flex items-center justify-between px-5 py-4 gap-4 transition-colors ${isDark ? "hover:bg-white/[0.025]" : "hover:bg-slate-50"}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`text-sm font-medium truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>{art.title}</h3>
                            <span className={`admin-badge ${art.isPublished ? "admin-badge-resolved" : "admin-badge-medium"}`}>
                              {art.isPublished ? "Published" : "Draft"}
                            </span>
                            {art.isInternal && (
                              <span className={`admin-badge admin-badge-closed`}>Internal</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            {art.category && <span className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{art.category.name}</span>}
                            <span className={`text-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>By {art.author.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => startEditKB(art)} className="admin-btn admin-btn-ghost admin-btn-sm">
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button onClick={() => handleDeleteKB(art.id)} className={`p-2 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-950/15" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Quick KB Editor */
              <div className="max-w-4xl space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{kbArticleId ? "Edit Article" : "New Article"}</h2>
                  <button onClick={() => setKbEditing(false)} className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}>
                    ← Back to list
                  </button>
                </div>

                <form onSubmit={handleSaveKB}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className={`md:col-span-2 admin-card p-5 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Article Title <span className="text-red-500">*</span></label>
                        <input type="text" required value={kbTitle} onChange={e => setKbTitle(e.target.value)} placeholder="e.g. How to reset your password" className={`admin-input ${isDark ? "admin-dark" : ""}`} />
                      </div>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Content (Markdown) <span className="text-red-500">*</span></label>
                        <textarea required value={kbContent} onChange={e => setKbContent(e.target.value)} placeholder="Write your article content here..." className={`admin-textarea font-mono ${isDark ? "admin-dark" : ""}`} style={{ minHeight: 300 }} />
                      </div>
                    </div>

                    <div className={`admin-card p-5 space-y-4 h-fit ${isDark ? "admin-dark" : ""}`}>
                      <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h3>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Category</label>
                        <select value={kbCategoryId} onChange={e => setKbCategoryId(e.target.value)} className={`admin-select ${isDark ? "admin-dark" : ""}`}>
                          <option value="">Uncategorized</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3 pt-1">
                        <label className={`flex items-center gap-3 text-sm cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          <input type="checkbox" checked={kbIsPublished} onChange={() => setKbIsPublished(!kbIsPublished)} className="w-4 h-4 rounded accent-[#38b1f7]" />
                          Publish immediately
                        </label>
                        <label className={`flex items-center gap-3 text-sm cursor-pointer ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                          <input type="checkbox" checked={kbIsInternal} onChange={() => setKbIsInternal(!kbIsInternal)} className="w-4 h-4 rounded accent-amber-500" />
                          Internal only (agents only)
                        </label>
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="admin-btn admin-btn-primary w-full">
                          {kbArticleId ? "Update Article" : "Save Article"}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </AdminShell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function StatCard({ label, value, icon, iconBg, iconBgDark, isDark, highlight }: {
  label: string; value: number; icon: React.ReactNode;
  iconBg: string; iconBgDark: string; isDark: boolean; highlight?: boolean;
}) {
  return (
    <div className={`admin-card p-5 flex items-center justify-between ${isDark ? "admin-dark" : ""}`}>
      <div>
        <p className={`text-xs font-medium mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{label}</p>
        <p className={`text-3xl font-bold ${highlight ? "text-[#38b1f7]" : isDark ? "text-white" : "text-slate-900"}`}>{value}</p>
      </div>
      <div className={`admin-stat-icon-wrap ${isDark ? iconBgDark : iconBg}`}>
        {icon}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description, isDark }: {
  icon: React.ReactNode; title: string; description: string; isDark: boolean;
}) {
  return (
    <div className="admin-empty-state">
      <span className={isDark ? "text-slate-700" : "text-slate-300"}>{icon}</span>
      <h3 className={isDark ? "!text-slate-400" : ""}>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

// Shared User Create/Edit Modal
interface UserModalProps {
  title: string; subtitle: string; isDark: boolean;
  showRole: boolean; showTeams: boolean; showStatusToggle: boolean;
  formName: string; setFormName: (v: string) => void;
  formEmail: string; setFormEmail: (v: string) => void;
  formPassword: string; setFormPassword: (v: string) => void;
  formRole: "CUSTOMER" | "AGENT" | "ADMIN"; setFormRole: (v: any) => void;
  formIsActive: boolean; setFormIsActive: (v: boolean) => void;
  formTeams: string[]; setFormTeams: (v: string[]) => void;
  teams: { id: string; name: string }[];
  onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

function UserModal({ title, subtitle, isDark, showRole, showTeams, showStatusToggle, formName, setFormName, formEmail, setFormEmail, formPassword, setFormPassword, formRole, setFormRole, formIsActive, setFormIsActive, formTeams, setFormTeams, teams, onClose, onSubmit, submitLabel }: UserModalProps) {
  return (
    <div className="admin-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`admin-modal ${isDark ? "admin-dark" : ""}`}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg mt-0.5 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Full Name <span className="text-red-500">*</span></label>
            <input type="text" required value={formName} onChange={e => setFormName(e.target.value)} placeholder="Alex Carter" className={`admin-input ${isDark ? "admin-dark" : ""}`} />
          </div>
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Email Address <span className="text-red-500">*</span></label>
            <input type="email" required value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="alex@company.com" className={`admin-input ${isDark ? "admin-dark" : ""}`} />
          </div>
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Password {!showStatusToggle && <span className="text-red-500">*</span>}</label>
            <input type="password" required={!showStatusToggle} value={formPassword} onChange={e => setFormPassword(e.target.value)} placeholder={showStatusToggle ? "Leave blank to keep current" : "••••••••"} className={`admin-input ${isDark ? "admin-dark" : ""}`} />
          </div>
          {showRole && (
            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Role</label>
              <select value={formRole} onChange={e => setFormRole(e.target.value)} className={`admin-select ${isDark ? "admin-dark" : ""}`}>
                <option value="AGENT">Agent — Support Representative</option>
                <option value="ADMIN">Admin — Full Access</option>
              </select>
            </div>
          )}
          {showStatusToggle && (
            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Account Status</label>
              <select value={formIsActive ? "true" : "false"} onChange={e => setFormIsActive(e.target.value === "true")} className={`admin-select ${isDark ? "admin-dark" : ""}`}>
                <option value="true">Active</option>
                <option value="false">Suspended</option>
              </select>
            </div>
          )}
          {showTeams && teams.length > 0 && (
            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Assign to Teams</label>
              <div className={`border rounded-xl p-3 max-h-36 overflow-y-auto grid grid-cols-2 gap-2 ${isDark ? "border-[#1e293b] bg-white/[0.02]" : "border-slate-200 bg-slate-50"}`}>
                {teams.map(t => (
                  <label key={t.id} className={`flex items-center gap-2 text-sm cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    <input type="checkbox" checked={formTeams.includes(t.id)} onChange={() => setFormTeams(formTeams.includes(t.id) ? formTeams.filter(id => id !== t.id) : [...formTeams, t.id])} className="rounded accent-[#38b1f7]" />
                    <span className="truncate">{t.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost">Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary">{submitLabel}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Team Modal with Searchable Member Dropdown ─────────────────────
interface TeamModalProps {
  title: string;
  subtitle: string;
  isDark: boolean;
  name: string;
  onNameChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  selectedMemberIds: string[];
  onMembersChange: (ids: string[]) => void;
  agents: { id: string; name: string; email: string }[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
}

function TeamModal({
  title, subtitle, isDark, name, onNameChange, description, onDescriptionChange,
  selectedMemberIds, onMembersChange, agents, onClose, onSubmit, submitLabel,
}: TeamModalProps) {
  const [memberSearch, setMemberSearch] = React.useState("");

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const selectedAgents = agents.filter(a => selectedMemberIds.includes(a.id));

  const toggleMember = (id: string) => {
    onMembersChange(
      selectedMemberIds.includes(id)
        ? selectedMemberIds.filter(x => x !== id)
        : [...selectedMemberIds, id]
    );
  };

  const removeMember = (id: string) => {
    onMembersChange(selectedMemberIds.filter(x => x !== id));
  };

  return (
    <div
      className="admin-modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`admin-modal w-full max-w-[520px] ${isDark ? "admin-dark" : ""}`}
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className={`flex items-start justify-between mb-6 pb-5 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ml-3 shrink-0 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Team Name */}
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>
              Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="e.g. Billing Support, Tier-2 Tech"
              className={`admin-input ${isDark ? "admin-dark" : ""}`}
            />
          </div>

          {/* Description */}
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Description</label>
            <textarea
              value={description}
              onChange={e => onDescriptionChange(e.target.value)}
              placeholder="Describe the team's scope, routing rules, or SLA..."
              className={`admin-textarea ${isDark ? "admin-dark" : ""}`}
              rows={2}
            />
          </div>

          {/* Members section */}
          <div className="admin-form-group">
            <div className="flex items-center justify-between mb-1.5">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Team Members</label>
              {selectedMemberIds.length > 0 && (
                <span className={`text-xs font-medium ${isDark ? "text-[#5fc0f9]" : "text-[#0d7fc0]"}`}>
                  {selectedMemberIds.length} selected
                </span>
              )}
            </div>

            {/* Selected member chips */}
            {selectedAgents.length > 0 && (
              <div className={`flex flex-wrap gap-1.5 mb-3 p-2.5 rounded-xl border ${isDark ? "border-[#38b1f7]/15 bg-[#38b1f7]/5" : "border-blue-100 bg-blue-50/60"}`}>
                {selectedAgents.map(a => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${isDark ? "bg-[#38b1f7]/12 text-[#5fc0f9] border-[#38b1f7]/20" : "bg-white text-blue-700 border-blue-200 shadow-sm"}`}
                  >
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? "bg-[#38b1f7]/25" : "bg-blue-200 text-blue-700"}`}>
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                    <span>{a.name}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(a.id)}
                      className={`ml-0.5 rounded-sm transition-colors ${isDark ? "text-[#5fc0f9]/60 hover:text-red-400" : "text-blue-400 hover:text-red-500"}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Searchable agent list */}
            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-[#1e293b]" : "border-slate-200"}`}>
              {/* Search bar */}
              <div className={`flex items-center gap-2 px-3 py-2.5 border-b ${isDark ? "border-[#1e293b] bg-[#0c1525]" : "border-slate-100 bg-slate-50"}`}>
                <Search className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search agents by name or email…"
                  className={`flex-1 text-sm bg-transparent outline-none ${isDark ? "text-white placeholder:text-slate-600" : "text-slate-800 placeholder:text-slate-400"}`}
                />
                {memberSearch && (
                  <button type="button" onClick={() => setMemberSearch("")} className={isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-600"}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Agent list */}
              <div className="max-h-44 overflow-y-auto">
                {agents.length === 0 ? (
                  <p className={`text-xs text-center py-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>No agents available.</p>
                ) : filteredAgents.length === 0 ? (
                  <p className={`text-xs text-center py-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>No agents match "{memberSearch}"</p>
                ) : (
                  filteredAgents.map(a => {
                    const isSelected = selectedMemberIds.includes(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleMember(a.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          isSelected
                            ? isDark ? "bg-[#38b1f7]/10" : "bg-blue-50"
                            : isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected
                            ? isDark ? "bg-[#38b1f7]/20 text-[#5fc0f9]" : "bg-blue-100 text-blue-700"
                            : isDark ? "bg-white/[0.06] text-slate-400" : "bg-slate-100 text-slate-600"
                        }`}>
                          {a.name.charAt(0).toUpperCase()}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isSelected
                              ? isDark ? "text-[#5fc0f9]" : "text-blue-700"
                              : isDark ? "text-slate-200" : "text-slate-800"
                          }`}>{a.name}</p>
                          <p className={`text-xs truncate ${isDark ? "text-slate-600" : "text-slate-400"}`}>{a.email}</p>
                        </div>

                        {/* Checkmark */}
                        {isSelected && (
                          <CheckCircle className={`w-4 h-4 shrink-0 ${isDark ? "text-[#5fc0f9]" : "text-blue-600"}`} />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className={`flex justify-end gap-2 pt-2 border-t ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
            <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost">
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
