"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { fetchWithAuth } from "../../../lib/api";
import { getCookie } from "../../../lib/cookie";
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
  Upload,
  Minus,
  ChevronDown,
  MessageSquare,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUpRight,
  History,
  Calendar,
  Check,
  UserCheck,
  Shield,
  User,
  Coins,
  ArrowDownCircle,
  Mail,
  Phone,
  Globe,
  Server,
  CreditCard,
  FileText,
  ShieldAlert,
  RotateCw,
  RefreshCw,
  Lock,
} from "lucide-react";
import { useDialog } from "../../../context/DialogContext";
import AdminShell, { AdminShellSkeleton } from "../../../components/admin/AdminShell";
import Loader from "../../../components/Loader";

// ── Types ──────────────────────────────────────────────────────────
interface Category { 
  id: string; 
  name: string; 
  slug?: string | null;
  description?: string | null;
  isActive?: boolean;
  parentId?: string | null;
}
interface Team {
  id: string; name: string; description: string | null;
  members: { id: string; name: string; email: string; role: string }[];
  _count?: { tickets: number };
}
interface Agent { id: string; name: string; email: string; role: string; }
interface CustomerCreditsData {
  id: string;
  allocatedHours: number;
  usedHours: number;
  remainingHours: number;
  billableHours: number;
}
interface UserProfile {
  id: string; name: string; email: string;
  role: "CUSTOMER" | "ADMIN" | "AGENT" | "SUPPORT_L1" | "SUPPORT_L2" | "BILLING";
  isActive: boolean; emailVerified: boolean; createdAt: string;
  phoneNumber?: string | null;
  crmCustomerId?: string | null;
  teams?: { id: string; name: string }[];
  customerCredits?: CustomerCreditsData | null;
}
interface TicketMessage {
  id: string; message: string; createdAt: string;
  sender: { id: string; name: string; email: string; role: string };
}
interface StatusHistoryItem {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  createdAt: string;
  changedBy: { id: string; name: string; role: string } | null;
}
interface CreditTransactionItem {
  id: string;
  customerCreditsId: string;
  ticketId: string | null;
  hours: number;
  type: string;
  description: string | null;
  createdAt: string;
}
interface TicketAttachment {
  id: string;
  filename: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
  uploadedBy?: { id: string; name: string; role: string } | null;
}

interface TicketData {
  id: string; title: string; description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  createdAt: string; updatedAt: string;
  category: Category;
  customer: { id: string; name: string; email: string };
  agent: { id: string; name: string; email: string } | null;
  isEscalated?: boolean;
  escalatedAt?: string | null;
  escalatedById?: string | null;
  escalatedBy?: { id: string; name: string; email: string } | null;
  escalationReason?: string | null;
  team: { id: string; name: string } | null;
  messages?: TicketMessage[];
  affectedDomain?: string | null;
  issueCategory?: string | null;
  firstResponseAt?: string | null;
  resolvedAt?: string | null;
  ttrHours?: number | null;
  statusHistory?: StatusHistoryItem[];
  creditTransactions?: CreditTransactionItem[];
  createdBySecondaryEmail?: string | null;
  attachments?: TicketAttachment[];
}
interface KBArticle {
  id: string; title: string; slug: string; content: string;
  isPublished: boolean; isInternal: boolean; createdAt: string;
  author: { id: string; name: string };
  category: Category | null;
}
interface RoutingRule {
  id: string;
  issueCategory: string;
  assigneeId: string | null;
  teamId: string | null;
  secondaryAssigneeId: string | null;
  assignee?: { id: string; name: string; email: string } | null;
  secondaryAssignee?: { id: string; name: string; email: string } | null;
  team?: { id: string; name: string } | null;
}

interface SlaPolicy {
  id: string;
  name: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "ALL";
  firstResponseHours: number;
  resolutionHours: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "teams" | "clients" | "admins" | "kb" | "routing" | "credits" | "sla" | "permissions">("overview");
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search).get("tab");
      if (p === "overview" || p === "tickets" || p === "teams" || p === "clients" || p === "admins" || p === "kb" || p === "routing" || p === "credits" || p === "sla" || p === "permissions") {
        setActiveTab(p as any);
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
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ticket state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("ALL");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("ALL");
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("ALL");
  const [ticketSortBy, setTicketSortBy] = useState("newest");

  // Resolution modal state
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [resolveTicketHours, setResolveTicketHours] = useState(1.0);
  const [resolveTicketNotes, setResolveTicketNotes] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<"RESOLVED" | "CLOSED" | null>(null);

  // Asynchronous mutation submitting states
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingResolve, setSubmittingResolve] = useState(false);
  const [updatingTicketDetails, setUpdatingTicketDetails] = useState(false);
  const [submittingTeam, setSubmittingTeam] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [submittingKB, setSubmittingKB] = useState(false);
  const [submittingCategory, setSubmittingCategory] = useState(false);
  const [submittingRoutingRule, setSubmittingRoutingRule] = useState(false);
  const [submittingSla, setSubmittingSla] = useState(false);

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
  const [userFormRole, setUserFormRole] = useState<"CUSTOMER" | "AGENT" | "ADMIN" | "SUPPORT_L1" | "SUPPORT_L2" | "BILLING">("CUSTOMER");
  const [userFormIsActive, setUserFormIsActive] = useState(true);
  const [userFormTeams, setUserFormTeams] = useState<string[]>([]);
  const [userFormPhone, setUserFormPhone] = useState("");
  const [userFormCrmId, setUserFormCrmId] = useState("");
  const [userSearch, setUserSearch] = useState("");

  // KB state
  const [kbEditing, setKbEditing] = useState(false);
  const [kbArticleId, setKbArticleId] = useState<string | null>(null);
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [kbIsPublished, setKbIsPublished] = useState(false);
  const [kbIsInternal, setKbIsInternal] = useState(false);
  const [kbCategoryId, setKbCategoryId] = useState("");

  // Categories CRUD state
  const [catFormName, setCatFormName] = useState("");
  const [catFormDesc, setCatFormDesc] = useState("");
  const [catFormParentId, setCatFormParentId] = useState("");
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  // Custom routing rule creation state
  const [newRuleCategory, setNewRuleCategory] = useState("");
  const [newRuleAssignee, setNewRuleAssignee] = useState("");
  const [newRuleTeam, setNewRuleTeam] = useState("");
  const [newRuleSecondary, setNewRuleSecondary] = useState("");

  // Role permissions state
  const [rolePermissions, setRolePermissions] = useState<{ role: string; permissions: string[] }[]>([]);
  const [savingPermissionsRole, setSavingPermissionsRole] = useState<string | null>(null);

  // Client credits state
  const [creditsEditingUser, setCreditsEditingUser] = useState<UserProfile | null>(null);
  const [creditsAllocated, setCreditsAllocated] = useState<number>(20);
  const [creditsDescription, setCreditsDescription] = useState<string>("");

  // Client detail view state
  const [selectedClientView, setSelectedClientView] = useState<UserProfile | null>(null);
  const [clientDetailLoading, setClientDetailLoading] = useState(false);
  const [clientActiveTab, setClientActiveTab] = useState<"profile" | "contact" | "domains" | "services" | "subscriptions" | "tickets" | "sla" | "audit">("profile");

  // Client list filter state
  const [clientFilter, setClientFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED" | "PENDING" | "CRM">("ALL");

  // Bulk import state
  const [importingCrm, setImportingCrm] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; failed: number; total: number } | null>(null);

  // SLA Policies state
  const [slaPolicies, setSlaPolicies] = useState<SlaPolicy[]>([]);
  const [slaSubTab, setSlaSubTab] = useState<"policies" | "metrics">("policies");
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [editingSlaPolicy, setEditingSlaPolicy] = useState<SlaPolicy | null>(null);
  const [slaFormName, setSlaFormName] = useState("");
  const [slaFormPriority, setSlaFormPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT" | "ALL">("MEDIUM");
  const [slaFormFirstResponse, setSlaFormFirstResponse] = useState<number | string>(4);
  const [slaFormResolution, setSlaFormResolution] = useState<number | string>(24);
  const [slaFormIsActive, setSlaFormIsActive] = useState<boolean>(true);

  // Pagination states for Client Accounts & Client Credits
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(10);
  const [creditsCurrentPage, setCreditsCurrentPage] = useState(1);
  const [creditsPageSize, setCreditsPageSize] = useState(10);

  useEffect(() => {
    setClientCurrentPage(1);
  }, [userSearch, clientFilter]);

  useEffect(() => {
    setCreditsCurrentPage(1);
  }, [userSearch]);

  const openSlaModalForCreate = () => {
    setEditingSlaPolicy(null);
    setSlaFormName("");
    setSlaFormPriority("MEDIUM");
    setSlaFormFirstResponse(4);
    setSlaFormResolution(24);
    setSlaFormIsActive(true);
    setShowSlaModal(true);
  };

  const openSlaModalForEdit = (policy: SlaPolicy) => {
    setEditingSlaPolicy(policy);
    setSlaFormName(policy.name);
    setSlaFormPriority(policy.priority);
    setSlaFormFirstResponse(policy.firstResponseHours);
    setSlaFormResolution(policy.resolutionHours);
    setSlaFormIsActive(policy.isActive);
    setShowSlaModal(true);
  };

  const handleSaveSlaPolicy = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = slaFormName.trim();
    if (!trimmedName) {
      toast.error("Policy name is required.");
      return;
    }

    const frHours = Number(slaFormFirstResponse);
    if (isNaN(frHours) || frHours <= 0) {
      toast.error("First response target must be a positive number.");
      return;
    }

    const resHours = Number(slaFormResolution);
    if (isNaN(resHours) || resHours <= 0) {
      toast.error("Resolution target must be a positive number.");
      return;
    }

    if (resHours < frHours) {
      toast.error("Resolution target cannot be less than First Response target.");
      return;
    }

    setSubmittingSla(true);
    try {
      const payload = {
        name: trimmedName,
        priority: slaFormPriority,
        firstResponseHours: frHours,
        resolutionHours: resHours,
        isActive: slaFormIsActive,
      };

      let res;
      if (editingSlaPolicy) {
        res = await fetchWithAuth(`/sla/${editingSlaPolicy.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetchWithAuth("/sla", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(editingSlaPolicy ? "SLA Policy updated successfully." : "SLA Policy created successfully.");
        setShowSlaModal(false);
        setEditingSlaPolicy(null);
        refreshAllData();
      } else {
        toast.error(data.error?.message || "Failed to save SLA Policy.");
      }
    } catch (err) {
      toast.error("An error occurred while saving SLA Policy.");
    } finally {
      setSubmittingSla(false);
    }
  };

  const handleToggleSlaPolicy = async (policy: SlaPolicy) => {
    try {
      const res = await fetchWithAuth(`/sla/${policy.id}/toggle`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !policy.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`SLA Policy "${policy.name}" ${!policy.isActive ? "activated" : "deactivated"}.`);
        refreshAllData();
      } else {
        toast.error(data.error?.message || "Failed to toggle SLA Policy.");
      }
    } catch (err) {
      toast.error("Failed to toggle SLA Policy.");
    }
  };

  const handleDeleteSlaPolicy = async (id: string, name: string) => {
    const confirm = await dialog.confirm(
      `Are you sure you want to delete SLA policy "${name}"?`,
      "Delete SLA Policy"
    );
    if (!confirm) return;

    try {
      const res = await fetchWithAuth(`/sla/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("SLA Policy deleted successfully.");
        refreshAllData();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to delete SLA Policy.");
      }
    } catch (err) {
      toast.error("Failed to delete SLA Policy.");
    }
  };


  const handleBulkImportCrm = async () => {
    setImportingCrm(true);
    setImportResult(null);
    toast.info("Importing all customers from CRM — this may take a moment...");
    try {
      const res = await fetchWithAuth("/sync/import-all", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        const { imported, failed, total } = data.data;
        setImportResult({ imported, failed, total });
        toast.success(`Import complete: ${imported} synced${failed > 0 ? `, ${failed} failed` : ""}.`);
        refreshAllData();
      } else {
        toast.error(data.error?.message || data.message || "Import failed.");
      }
    } catch (err) {
      toast.error("Failed to connect to CRM import endpoint.");
    } finally {
      setImportingCrm(false);
    }
  };

  const handleSelectClient = async (user: UserProfile) => {
    setSelectedClientView(user);
    setClientActiveTab("profile");
    setClientDetailLoading(true);
    try {
      const res = await fetchWithAuth(`/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedClientView(data.data.user);
      }
    } catch (err) {
      console.error("Failed to load client details:", err);
      toast.error("Failed to load client details.");
    } finally {
      setClientDetailLoading(false);
    }
  };

  const handleSendInvitation = async (userId: string, generateTempPassword = false) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}/invite`, {
        method: "POST",
        body: JSON.stringify({ generateTempPassword })
      });
      if (res.ok) {
        toast.success("Invitation email sent successfully.");
        const userObj = selectedClientView;
        if (userObj) {
          handleSelectClient(userObj);
        }
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to send invitation.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while sending the invitation.");
    }
  };

  const handleResendInvitation = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}/resend-invite`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Invitation email resent successfully.");
        const userObj = selectedClientView;
        if (userObj) {
          handleSelectClient(userObj);
        }
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to resend invitation.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while resending the invitation.");
    }
  };

  const handleSendResetPasswordLink = async (userId: string) => {
    try {
      const res = await fetchWithAuth(`/users/${userId}/reset-password-link`, {
        method: "POST"
      });
      if (res.ok) {
        toast.success("Password reset email sent successfully.");
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to send password reset link.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while sending reset link.");
    }
  };


  // ── Data Fetching ────────────────────────────────────────────────
  const refreshAllData = async () => {
    setDataLoading(true);
    setError(null);
    try {
      const [ticketsRes, teamsRes, agentsRes, kbRes, catRes, slaRes] = await Promise.all([
        fetchWithAuth("/tickets"),
        fetchWithAuth("/teams"),
        fetchWithAuth("/users/agents"),
        fetchWithAuth("/kb"),
        fetchWithAuth("/categories?all=true"),
        fetchWithAuth("/sla"),
      ]);
      if (ticketsRes.ok) setTickets((await ticketsRes.json()).data.tickets);
      if (teamsRes.ok) setTeams((await teamsRes.json()).data.teams);
      if (agentsRes.ok) setAgents((await agentsRes.json()).data.agents);
      if (kbRes.ok) setKbArticles((await kbRes.json()).data.articles);
      if (catRes.ok) {
        const r = await catRes.json();
        setCategories(r.data.categories || r.data);
      }
      if (slaRes.ok) setSlaPolicies((await slaRes.json()).data.policies);
      if (user?.role === "ADMIN") {
        const [usersRes, rulesRes, permRes] = await Promise.all([
          fetchWithAuth("/users"),
          fetchWithAuth("/users/routing-rules"),
          fetchWithAuth("/users/role-permissions"),
        ]);
        if (usersRes.ok) setUsers((await usersRes.json()).data.users);
        if (rulesRes.ok) setRoutingRules((await rulesRes.json()).data.rules);
        if (permRes.ok) setRolePermissions((await permRes.json()).data.permissions);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load data. Please refresh.");
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { if (user) refreshAllData(); }, [user]); // eslint-disable-line

  // Real-time SSE Synchronization
  useEffect(() => {
    if (!user) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const token = getCookie("accessToken");
    if (!token) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      const url = `${API_URL}/users/me/events?t=${encodeURIComponent(token)}`;
      eventSource = new EventSource(url);

      eventSource.addEventListener("connected", () => {
        console.log("[SSE] Admin Dashboard connected to real-time events.");
      });

      eventSource.addEventListener("ticket.update", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as { ticketId: string; action: string };
          console.log(`[SSE] Received ticket.update event for ticket: ${payload.ticketId}, action: ${payload.action}`);
          // Trigger dynamic refresh to synchronize tickets in real-time
          refreshAllData();
        } catch (err) {
          console.error("[SSE] Failed to parse ticket.update event:", err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [user]);

  // ── Ticket Actions ───────────────────────────────────────────────
  const selectTicket = async (ticket: TicketData) => {
    setSelectedTicket(ticket);
    setTicketReply("");
    try {
      const res = await fetchWithAuth(`/tickets/${ticket.id}`);
      if (res.ok) setSelectedTicket((await res.json()).data.ticket);
    } catch (err) { console.error(err); }
  };

  const updateTicketDetails = async (
    updates: { status?: string; priority?: string; teamId?: string | null; agentId?: string | null; isEscalated?: boolean; escalationReason?: string | null },
    directHours?: number,
    resolveNotes?: string
  ) => {
    if (!selectedTicket) return;
    try {
      setUpdatingTicketDetails(true);
      let hoursConsumed: number | null = null;
      if (updates.status === "RESOLVED" || updates.status === "CLOSED") {
        if (directHours !== undefined) {
          hoursConsumed = directHours;
        } else {
          // Open custom Resolution Modal instead of using window.prompt
          setPendingStatusChange(updates.status as any);
          setResolveTicketHours(1.0);
          setResolveTicketNotes("");
          setShowResolveModal(true);
          return;
        }
      }

      // If we have resolveNotes, post it first as a ticket reply message
      if (resolveNotes && resolveNotes.trim()) {
        try {
          await fetchWithAuth(`/tickets/${selectedTicket.id}/messages`, {
            method: "POST",
            body: JSON.stringify({ message: resolveNotes.trim() })
          });
        } catch (err) {
          console.error("Failed to post resolution notes:", err);
        }
      }

      // Pass the current ticket's updatedAt for optimistic locking check
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}`, { 
        method: "PATCH", 
        body: JSON.stringify({ ...updates, hoursConsumed, updatedAt: selectedTicket.updatedAt }) 
      });
      if (res.ok) {
        const updated = (await res.json()).data.ticket;
        setSelectedTicket(prev => prev ? { ...prev, ...updated } : null);
        setTickets(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
        toast.success("Ticket updated successfully.");
        refreshAllData();
      } else if (res.status === 409) {
        toast.error("Conflict: This ticket was updated by another agent. Refreshing ticket...");
        refreshAllData();
      } else {
        const errData = await res.json().catch(() => null);
        toast.error(errData?.error?.message || "Failed to update ticket.");
      }
    } catch { toast.error("Failed to update ticket."); }
    finally { setUpdatingTicketDetails(false); }
  };

  const submitTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !ticketReply.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await fetchWithAuth(`/tickets/${selectedTicket.id}/messages`, { method: "POST", body: JSON.stringify({ message: ticketReply }) });
      if (res.ok) {
        const newMsg = (await res.json()).data.message;
        setSelectedTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMsg] } : null);
        setTicketReply("");
        toast.success("Reply sent.");
      } else toast.error("Failed to send reply.");
    } catch { toast.error("Failed to send reply."); }
    finally { setSubmittingReply(false); }
  };

  const handleResolveSubmit = async (e: React.FormEvent, files: File[]) => {
    e.preventDefault();
    if (!selectedTicket || !pendingStatusChange) return;

    try {
      setSubmittingResolve(true);
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);

          const uploadRes = await fetchWithAuth(`/tickets/${selectedTicket.id}/attachments`, {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errBody = await uploadRes.json();
            throw new Error(errBody.error?.message || `Failed to upload screenshot: ${file.name}`);
          }
        }
      }

      await updateTicketDetails({ status: pendingStatusChange }, resolveTicketHours, resolveTicketNotes);
      setShowResolveModal(false);
      setPendingStatusChange(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to resolve ticket.");
    } finally {
      setSubmittingResolve(false);
    }
  };

  // ── Team Actions ─────────────────────────────────────────────────
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    try {
      setSubmittingTeam(true);
      const res = await fetchWithAuth("/teams", { method: "POST", body: JSON.stringify({ name: newTeamName, description: newTeamDesc, memberIds: newTeamMembers }) });
      if (res.ok) {
        setNewTeamName(""); setNewTeamDesc(""); setNewTeamMembers([]); setShowCreateTeam(false);
        refreshAllData(); toast.success("Team created.");
      } else toast.error((await res.json()).error?.message || "Error creating team");
    } catch { toast.error("Failed to create team."); }
    finally { setSubmittingTeam(false); }
  };

  const toggleTeamMemberSelection = (agentId: string) =>
    setNewTeamMembers(prev => prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]);

  const handleDeleteTeam = async (teamId: string) => {
    const confirmed = await dialog.confirm("Delete this team? Assigned tickets will be unassigned.", "Delete Team");
    if (!confirmed) return;
    try {
      setSubmittingTeam(true);
      const res = await fetchWithAuth(`/teams/${teamId}`, { method: "DELETE" });
      if (res.ok) { refreshAllData(); toast.success("Team deleted."); }
      else toast.error("Failed to delete team.");
    } catch { toast.error("Failed to delete team."); }
    finally { setSubmittingTeam(false); }
  };

  const handleEditTeamClick = (t: Team) => {
    setSelectedTeam(t); setEditTeamName(t.name); setEditTeamDesc(t.description || "");
    setEditTeamMembers(t.members.map(m => m.id)); setShowEditTeam(true);
  };

  const handleEditTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !editTeamName.trim()) { toast.error("Team name is required."); return; }
    try {
      setSubmittingTeam(true);
      const res = await fetchWithAuth(`/teams/${selectedTeam.id}`, { method: "PATCH", body: JSON.stringify({ name: editTeamName, description: editTeamDesc, memberIds: editTeamMembers }) });
      if (res.ok) { toast.success("Team updated."); setShowEditTeam(false); setSelectedTeam(null); refreshAllData(); }
      else toast.error((await res.json()).error?.message || "Error updating team");
    } catch { toast.error("Failed to update team."); }
    finally { setSubmittingTeam(false); }
  };

  // ── User Actions ─────────────────────────────────────────────────
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormName.trim() || !userFormEmail.trim() || !userFormPassword.trim()) { toast.error("Name, email, and password are required."); return; }
    try {
      setSubmittingUser(true);
      const res = await fetchWithAuth("/users", { method: "POST", body: JSON.stringify({ name: userFormName, email: userFormEmail, password: userFormPassword, role: userFormRole, phoneNumber: userFormPhone || null, crmCustomerId: userFormCrmId || null, teamIds: (userFormRole === "AGENT" || userFormRole === "ADMIN") ? userFormTeams : [] }) });
      if (res.ok) {
        toast.success("User created."); setShowCreateUser(false);
        setUserFormName(""); setUserFormEmail(""); setUserFormPassword(""); setUserFormRole("CUSTOMER"); setUserFormTeams([]);
        setUserFormPhone(""); setUserFormCrmId("");
        refreshAllData();
      } else toast.error((await res.json()).error?.message || "Error creating user");
    } catch { toast.error("Failed to create user."); }
    finally { setSubmittingUser(false); }
  };

  const handleEditUserClick = (u: UserProfile) => {
    setSelectedUser(u); setUserFormName(u.name); setUserFormEmail(u.email); setUserFormPassword("");
    setUserFormRole(u.role); setUserFormIsActive(u.isActive); setUserFormTeams(u.teams ? u.teams.map(t => t.id) : []);
    setUserFormPhone(u.phoneNumber || ""); setUserFormCrmId(u.crmCustomerId || "");
    setShowEditUser(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !userFormName.trim() || !userFormEmail.trim()) { toast.error("Name and email are required."); return; }
    const payload: any = { name: userFormName, email: userFormEmail, role: userFormRole, isActive: userFormIsActive, phoneNumber: userFormPhone || null, crmCustomerId: userFormCrmId || null, teamIds: (userFormRole === "AGENT" || userFormRole === "ADMIN") ? userFormTeams : [] };
    if (userFormPassword.trim()) payload.password = userFormPassword;
    try {
      setSubmittingUser(true);
      const res = await fetchWithAuth(`/users/${selectedUser.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (res.ok) {
        toast.success("User updated."); setShowEditUser(false); setSelectedUser(null);
        setSelectedClientView(null);
        setUserFormPhone(""); setUserFormCrmId("");
        refreshAllData();
      }
      else toast.error((await res.json()).error?.message || "Error updating user");
    } catch { toast.error("Failed to update user."); }
    finally { setSubmittingUser(false); }
  };

  const handleUpdateUser = async (userId: string, updates: { role?: string; isActive?: boolean }) => {
    try {
      setSubmittingUser(true);
      const res = await fetchWithAuth(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(updates) });
      if (res.ok) {
        const updated = (await res.json()).data.user;
        setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
        // Keep the client detail panel in sync if this user is currently selected
        setSelectedClientView(prev => prev && prev.id === updated.id ? { ...prev, ...updated } : prev);
        toast.success("User updated.");
      } else toast.error("Failed to update user.");
    } catch { toast.error("Failed to update user."); }
    finally { setSubmittingUser(false); }
  };

  // ── KB Actions ───────────────────────────────────────────────────
  const handleSaveKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbTitle.trim() || !kbContent.trim()) return;
    const payload = { title: kbTitle, content: kbContent, isPublished: kbIsPublished, isInternal: kbIsInternal, categoryId: kbCategoryId || null };
    try {
      setSubmittingKB(true);
      const res = kbArticleId
        ? await fetchWithAuth(`/kb/${kbArticleId}`, { method: "PATCH", body: JSON.stringify(payload) })
        : await fetchWithAuth("/kb", { method: "POST", body: JSON.stringify(payload) });
      if (res.ok) {
        setKbTitle(""); setKbContent(""); setKbIsPublished(false); setKbIsInternal(false); setKbCategoryId(""); setKbArticleId(null); setKbEditing(false);
        refreshAllData(); toast.success("KB article saved.");
      } else toast.error((await res.json()).error?.message || "Error saving article");
    } catch { toast.error("Failed to save article."); }
    finally { setSubmittingKB(false); }
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
      setSubmittingKB(true);
      const res = await fetchWithAuth(`/kb/${articleId}`, { method: "DELETE" });
      if (res.ok) { refreshAllData(); toast.success("Article deleted."); }
      else toast.error("Failed to delete article.");
    } catch { toast.error("Failed to delete article."); }
    finally { setSubmittingKB(false); }
  };

  // ── Categories CRUD Actions ──────────────────────────────────────
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;
    const body = { 
      name: catFormName.trim(), 
      description: catFormDesc.trim() || null, 
      parentId: catFormParentId || null 
    };
    try {
      setSubmittingCategory(true);
      const res = editingCatId
        ? await fetchWithAuth(`/categories/${editingCatId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await fetchWithAuth("/categories", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setCatFormName("");
        setCatFormDesc("");
        setCatFormParentId("");
        setEditingCatId(null);
        toast.success("Category saved.");
        refreshAllData();
      } else {
        toast.error(data.error?.message || "Failed to save category.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatFormName(cat.name);
    setCatFormDesc(cat.description || "");
    setCatFormParentId(cat.parentId || "");
  };

  const handleDeleteCategory = async (id: string) => {
    const cat = categories.find(c => c.id === id);
    const hasAssociations = (cat as any)?.ticket_count > 0 || (cat as any)?.article_count > 0;
    
    let reassignToId: string | undefined = undefined;
    if (hasAssociations) {
      const otherCats = categories.filter(c => c.id !== id && c.isActive !== false);
      if (otherCats.length === 0) {
        toast.error("Cannot delete category: it has associated items, and there are no other active categories to merge into.");
        return;
      }
      
      const promptText = `This category is associated with tickets/articles. Select a replacement category ID to reassign them to:\n\n` +
        otherCats.map(c => `- ${c.name} (ID: ${c.id})`).join("\n");
      const reassignInput = window.prompt(promptText, otherCats[0].id);
      if (reassignInput === null) return;
      const chosen = otherCats.find(c => c.id === reassignInput.trim() || c.name.toLowerCase() === reassignInput.trim().toLowerCase());
      if (!chosen) {
        toast.error("Invalid replacement category selected.");
        return;
      }
      reassignToId = chosen.id;
    } else {
      const confirmed = await dialog.confirm("Are you sure you want to delete this category?", "Delete Category");
      if (!confirmed) return;
    }

    try {
      setSubmittingCategory(true);
      const res = await fetchWithAuth(`/categories/${id}`, { 
        method: "DELETE",
        body: JSON.stringify({ reassignToId })
      });
      if (res.ok) {
        toast.success("Category deleted.");
        refreshAllData();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to delete category.");
      }
    } catch {
      toast.error("Failed to delete category.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleBulkDeleteCategories = async () => {
    if (selectedCategoryIds.length === 0) return;
    
    // Find selected categories
    const selectedCats = categories.filter(c => selectedCategoryIds.includes(c.id));
    
    // Check if any selected category is associated with tickets or articles
    const totalTicketCount = selectedCats.reduce((acc, c) => acc + ((c as any).ticket_count || 0), 0);
    const totalArticleCount = selectedCats.reduce((acc, c) => acc + ((c as any).article_count || 0), 0);
    const hasAssociations = totalTicketCount > 0 || totalArticleCount > 0;
    
    let reassignToId: string | undefined = undefined;
    if (hasAssociations) {
      const otherCats = categories.filter(c => !selectedCategoryIds.includes(c.id) && (c as any).isActive !== false);
      if (otherCats.length === 0) {
        toast.error("Cannot bulk-delete: selected categories have associated items, and there are no other active categories to merge into.");
        return;
      }
      
      const promptText = `One or more selected categories are associated with tickets or articles (${totalTicketCount} tickets, ${totalArticleCount} articles). Select a replacement category ID to reassign them to:\n\n` +
        otherCats.map(c => `- ${c.name} (ID: ${c.id})`).join("\n");
      const reassignInput = window.prompt(promptText, otherCats[0].id);
      if (reassignInput === null) return;
      const chosen = otherCats.find(c => c.id === reassignInput.trim() || c.name.toLowerCase() === reassignInput.trim().toLowerCase());
      if (!chosen) {
        toast.error("Invalid replacement category selected.");
        return;
      }
      reassignToId = chosen.id;
    } else {
      const confirmed = await dialog.confirm(`Are you sure you want to delete the ${selectedCategoryIds.length} selected categories?`, "Bulk Delete Categories");
      if (!confirmed) return;
    }
    
    try {
      setSubmittingCategory(true);
      const res = await fetchWithAuth("/categories/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedCategoryIds, reassignToId }),
      });
      if (res.ok) {
        toast.success("Selected categories deleted successfully.");
        setSelectedCategoryIds([]);
        refreshAllData();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to bulk delete categories.");
      }
    } catch {
      toast.error("Failed to bulk delete categories.");
    } finally {
      setSubmittingCategory(false);
    }
  };

  // ── Routing Rules CRUD Actions ───────────────────────────────────
  const handleCreateRoutingRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleCategory.trim()) {
      toast.error("Category name is required.");
      return;
    }

    try {
      setSubmittingRoutingRule(true);
      const res = await fetchWithAuth("/users/routing-rules", {
        method: "POST",
        body: JSON.stringify({
          issueCategory: newRuleCategory.trim(),
          assigneeId: newRuleAssignee || null,
          teamId: newRuleTeam || null,
          secondaryAssigneeId: newRuleSecondary || null,
        }),
      });

      if (res.ok) {
        setNewRuleCategory("");
        setNewRuleAssignee("");
        setNewRuleTeam("");
        setNewRuleSecondary("");
        toast.success("Routing rule created.");
        refreshAllData();
      } else {
        const data = await res.json();
        toast.error(data.error?.message || "Failed to create rule.");
      }
    } catch {
      toast.error("Failed to create routing rule.");
    } finally {
      setSubmittingRoutingRule(false);
    }
  };

  const handleDeleteRoutingRule = async (id: string) => {
    const confirmed = await dialog.confirm("Delete this routing rule?", "Delete Routing Rule");
    if (!confirmed) return;
    try {
      setSubmittingRoutingRule(true);
      const res = await fetchWithAuth(`/users/routing-rules/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Routing rule deleted.");
        refreshAllData();
      } else {
        toast.error("Failed to delete rule.");
      }
    } catch {
      toast.error("Failed to delete routing rule.");
    } finally {
      setSubmittingRoutingRule(false);
    }
  };

  // ── Role Permissions Actions ─────────────────────────────────────
  const handleTogglePermission = async (role: string, permission: string, checked: boolean) => {
    const roleRecord = rolePermissions.find(p => p.role === role);
    const currentPerms = roleRecord?.permissions ?? [];
    const updatedPerms = checked
      ? [...currentPerms, permission]
      : currentPerms.filter(p => p !== permission);

    setSavingPermissionsRole(role);
    try {
      const res = await fetchWithAuth("/users/role-permissions", {
        method: "PATCH",
        body: JSON.stringify({ role, permissions: updatedPerms }),
      });
      if (res.ok) {
        setRolePermissions(prev => prev.map(p => p.role === role ? { ...p, permissions: updatedPerms } : p));
        toast.success(`Permissions for ${role} updated successfully.`);
      } else {
        toast.error(`Failed to update permissions for ${role}.`);
      }
    } catch {
      toast.error("An error occurred while saving permissions.");
    } finally {
      setSavingPermissionsRole(null);
    }
  };

  const handleCreateCustomRole = async (roleName: string) => {
    const roleNameUpper = roleName.toUpperCase().replace(/[^A-Z0-9_]/g, "_");
    if (rolePermissions.some(rp => rp.role === roleNameUpper)) {
      toast.error("Role already exists.");
      return;
    }

    try {
      const res = await fetchWithAuth("/users/role-permissions", {
        method: "PATCH",
        body: JSON.stringify({ role: roleNameUpper, permissions: [] }),
      });
      if (res.ok) {
        toast.success(`Role ${roleNameUpper} created successfully.`);
        refreshAllData();
      } else {
        toast.error("Failed to create role.");
      }
    } catch {
      toast.error("Error creating role.");
    }
  };

  const handleDeleteCustomRole = async (role: string) => {
    if (!confirm(`Are you sure you want to delete the role "${role}"? Any users currently assigned to this role will automatically fall back to AGENT.`)) {
      return;
    }

    try {
      const res = await fetchWithAuth(`/users/role-permissions/${role}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success(`Role ${role} deleted successfully.`);
        refreshAllData();
      } else {
        toast.error("Failed to delete role.");
      }
    } catch {
      toast.error("Error deleting role.");
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────
  if (authLoading || !user) {
    const isDarkTheme = typeof window !== "undefined" && localStorage.getItem("theme") === "dark";
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#020617]' : 'bg-[#f8fafc]'
      }`}>
        <Loader size="xl" theme={isDarkTheme ? "dark" : "light"} label="Loading secure administrator console..." />
      </div>
    );
  }

  // Derived SLA logic helper
  const getSlaDetails = (ticket: TicketData) => {
    const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
    const createdTime = new Date(ticket.createdAt).getTime();

    // Response limits (hours)
    const responseLimit = (ticket.priority === "URGENT" || ticket.priority === "HIGH") ? 2 : (ticket.priority === "MEDIUM" ? 8 : 24);
    // Resolution limits (hours)
    const resolutionLimit = (ticket.priority === "URGENT" || ticket.priority === "HIGH") ? 8 : (ticket.priority === "MEDIUM" ? 24 : 72);

    let responseHours = 0;
    let responseMet = false;
    let responseState: "MET" | "BREACHED" | "WARNING" | "PENDING" = "PENDING";

    if (ticket.firstResponseAt) {
      responseHours = (new Date(ticket.firstResponseAt).getTime() - createdTime) / (1000 * 60 * 60);
      responseMet = responseHours <= responseLimit;
      responseState = responseMet ? "MET" : "BREACHED";
    } else {
      responseHours = (Date.now() - createdTime) / (1000 * 60 * 60);
      if (responseHours > responseLimit) {
        responseState = "BREACHED";
      } else if (responseLimit - responseHours <= 1) {
        responseState = "WARNING";
      } else {
        responseState = "PENDING";
      }
    }

    let resolutionHours = 0;
    let resolutionMet = false;
    let resolutionState: "MET" | "BREACHED" | "WARNING" | "PENDING" = "PENDING";

    if (ticket.resolvedAt) {
      resolutionHours = ticket.ttrHours ?? (new Date(ticket.resolvedAt).getTime() - createdTime) / (1000 * 60 * 60);
      resolutionMet = resolutionHours <= resolutionLimit;
      resolutionState = resolutionMet ? "MET" : "BREACHED";
    } else if (isResolved) {
      resolutionState = "MET";
    } else {
      resolutionHours = (Date.now() - createdTime) / (1000 * 60 * 60);
      if (resolutionHours > resolutionLimit) {
        resolutionState = "BREACHED";
      } else if (resolutionLimit - resolutionHours <= 2) {
        resolutionState = "WARNING";
      } else {
        resolutionState = "PENDING";
      }
    }

    return {
      responseLimit,
      resolutionLimit,
      responseHours: Math.round(responseHours * 10) / 10,
      responseState,
      resolutionHours: Math.round(resolutionHours * 10) / 10,
      resolutionState,
      isResponded: !!ticket.firstResponseAt
    };
  };

  // Helper component for priority badges
  const PriorityIconComponent = ({ priority, className }: { priority: string, className?: string }) => {
    const cls = className || "w-3 h-3";
    switch (priority) {
      case "URGENT": return <AlertTriangle className={`${cls} text-red-500 animate-pulse`} />;
      case "HIGH": return <ArrowUp className={`${cls} text-amber-500`} />;
      case "MEDIUM": return <Minus className={`${cls} text-blue-500`} />;
      case "LOW": return <ArrowDownCircle className={`${cls} text-slate-400`} />;
      default: return <Minus className={`${cls} text-slate-400`} />;
    }
  };

  // Derived data
  const filteredTickets = tickets
    .filter(t => {
      if (ticketStatusFilter !== "ALL" && t.status !== ticketStatusFilter) return false;
      if (ticketPriorityFilter !== "ALL" && t.priority !== ticketPriorityFilter) return false;
      if (ticketCategoryFilter !== "ALL" && t.category.id !== ticketCategoryFilter) return false;

      if (ticketSearch.trim()) {
        const query = ticketSearch.toLowerCase();
        const matches = 
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.customer.name.toLowerCase().includes(query) ||
          t.customer.email.toLowerCase().includes(query) ||
          t.id.toLowerCase().includes(query) ||
          (t.team?.name.toLowerCase() || "").includes(query) ||
          (t.agent?.name.toLowerCase() || "").includes(query);
        if (!matches) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (ticketSortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (ticketSortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (ticketSortBy === "priority-desc" || ticketSortBy === "priority-asc") {
        const prioMap: Record<string, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, URGENT: 4 };
        const valA = prioMap[a.priority] || 0;
        const valB = prioMap[b.priority] || 0;
        return ticketSortBy === "priority-desc" ? valB - valA : valA - valB;
      }
      if (ticketSortBy === "sla-urgency") {
        const getSlaHours = (priority: string) => {
          if (priority === "URGENT" || priority === "HIGH") return 8;
          if (priority === "MEDIUM") return 24;
          return 72;
        };

        const getBreachScore = (t: TicketData) => {
          if (t.status === "RESOLVED" || t.status === "CLOSED") return 1000000;
          const elapsed = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
          const limit = getSlaHours(t.priority);
          return limit - elapsed;
        };

        return getBreachScore(a) - getBreachScore(b);
      }
      return 0;
    });

  const tabTitles: Record<string, { title: string; description: string }> = {
    overview: { title: "Overview", description: "Operational summary & quick actions" },
    tickets: { title: "Ticket Queue", description: "Manage and assign support requests" },
    teams: { title: "Teams", description: "Organize agents into support groups" },
    clients: { title: "Client Accounts", description: "External customer profiles" },
    admins: { title: "Staff Directory", description: "Agents, admins, and permissions" },
    kb: { title: "Knowledge Base", description: "Self-service articles & documentation" },
    routing: { title: "Categories & Routing", description: "Manage ticket categories and team assignment routing rules" },
    permissions: { title: "Role Permissions", description: "View and configure access control permissions for user roles" },
    credits: { title: "Client Credits", description: "Manage support credits and billing hours for customer accounts" },
    sla: { title: "SLA Metrics", description: "Real-time compliance and SLA metrics" },
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
              <div className={`px-5 py-4 border-b flex flex-col gap-4 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={`text-sm font-semibold flex-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                    Ticket Queue
                    {filteredTickets.length !== tickets.length && (
                      <span className={`ml-2 text-xs font-normal ${isDark ? "text-slate-500" : "text-slate-400"}`}>({filteredTickets.length} of {tickets.length} shown)</span>
                    )}
                  </h2>
                  <button 
                    onClick={() => {
                      setTicketSearch("");
                      setTicketStatusFilter("ALL");
                      setTicketPriorityFilter("ALL");
                      setTicketCategoryFilter("ALL");
                      setTicketSortBy("newest");
                    }}
                    className={`text-xs hover:underline ${isDark ? "text-[#38b1f7]" : "text-blue-600"}`}
                  >
                    Reset Filters
                  </button>
                </div>
                
                {/* Search & filters row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                  <div className="relative md:col-span-2">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input 
                      type="text" 
                      value={ticketSearch} 
                      onChange={e => setTicketSearch(e.target.value)} 
                      placeholder="Search tickets..." 
                      className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs`} 
                      style={{ height: 36, paddingLeft: "2.25rem" }} 
                    />
                  </div>
                  
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

                  <select
                    value={ticketCategoryFilter}
                    onChange={e => setTicketCategoryFilter(e.target.value)}
                    className={`admin-select ${isDark ? "admin-dark" : ""} h-9 text-xs`}
                    style={{ height: 36 }}
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center gap-2 justify-end text-xs">
                  <span className={isDark ? "text-slate-500" : "text-slate-400"}>Sort by:</span>
                  <select
                    value={ticketSortBy}
                    onChange={e => setTicketSortBy(e.target.value)}
                    className={`admin-select ${isDark ? "admin-dark" : ""} text-xs`}
                    style={{ height: 28, width: 140, paddingRight: 24, paddingLeft: 8, backgroundPosition: "right 6px center" }}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priority-desc">Priority: High-Low</option>
                    <option value="priority-asc">Priority: Low-High</option>
                    <option value="sla-urgency">SLA Breach Urgency</option>
                  </select>
                </div>
              </div>

              {/* List */}
              <div className={`divide-y overflow-y-auto max-h-[650px] ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                {filteredTickets.length === 0 ? (
                  <EmptyState icon={<Ticket className="w-8 h-8" />} title="No tickets found" description="No tickets match the active filters." isDark={isDark} />
                ) : filteredTickets.map(t => {
                  const initials = t.customer.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                  const sla = getSlaDetails(t);
                  const isSlaBreached = sla.responseState === "BREACHED" || sla.resolutionState === "BREACHED";
                  const isSlaWarning = sla.responseState === "WARNING" || sla.resolutionState === "WARNING";
                  
                  return (
                    <div
                      key={t.id}
                      onClick={() => selectTicket(t)}
                      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-all duration-200 border-l-2 ${
                        selectedTicket?.id === t.id
                          ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7] shadow-md" : "bg-blue-50/60 border-[#38b1f7] shadow-sm"
                          : t.status === "OPEN"
                            ? "border-blue-500 hover:translate-x-1"
                            : t.status === "IN_PROGRESS"
                              ? "border-amber-500 hover:translate-x-1"
                              : "border-transparent hover:translate-x-1"
                      } ${
                        isDark ? "hover:bg-white/[0.025]" : "hover:bg-slate-50"
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isDark ? "bg-slate-800 text-slate-350" : "bg-slate-100 text-slate-700"}`}>
                        {initials}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0 mr-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight truncate ${isDark ? "text-slate-100" : "text-slate-855"}`}>{t.title}</p>
                          <span className={`text-[10px] shrink-0 ${isDark ? "text-slate-550" : "text-slate-455"}`}>
                            {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span className={statusBadgeClass(t.status)}>
                            <StatusIcon status={t.status} />
                            {t.status.replace("_", " ")}
                          </span>
                          <span className={priorityBadgeClass(t.priority)}>
                            <PriorityIconComponent priority={t.priority} />
                            {t.priority}
                          </span>
                          {t.isEscalated && (
                            <span className="admin-badge bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30 flex items-center gap-1 font-bold">
                              <ArrowUpCircle className="w-3 h-3 text-red-500" />
                              ESCALATED
                            </span>
                          )}
                          {t.category && (
                            <span className={`admin-badge ${isDark ? "bg-white/[0.04] text-slate-455 border-white/[0.08]" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {t.category.name}
                            </span>
                          )}
                          {t.team && (
                            <span className={`admin-badge ${isDark ? "bg-[#38b1f7]/10 text-[#5fc0f9] border-[#38b1f7]/20" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                              {t.team.name}
                            </span>
                          )}
                        </div>

                        {/* SLA warning on item */}
                        {(isSlaBreached || isSlaWarning) && (
                          <div className="pt-1 flex items-center gap-1.5">
                            {isSlaBreached ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                SLA BREACHED
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500">
                                <Clock className="w-3 h-3 text-amber-500" />
                                SLA AT RISK
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detail Panel */}
            <div className={`lg:col-span-2 admin-card sticky top-6 ${isDark ? "admin-dark" : ""} overflow-hidden`}>
              {selectedTicket ? (
                <div className="flex flex-col h-full max-h-[85vh]">
                  {/* Panel header */}
                  <div className={`px-5 py-4 border-b flex items-start justify-between gap-3 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className={`text-[10px] font-mono font-bold ${isDark ? "text-[#5fc0f9]" : "text-[#0d7fc0]"}`}>#{selectedTicket.id.slice(0, 8).toUpperCase()}</p>
                        {selectedTicket.isEscalated && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-red-500 text-white px-2 py-0.5 rounded flex items-center gap-0.5 w-fit">
                            <ArrowUpCircle className="w-2.5 h-2.5" />
                            Escalated L2
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{selectedTicket.title}</h3>
                    </div>
                    <button onClick={() => setSelectedTicket(null)} className={`p-1.5 rounded-lg transition-colors shrink-0 ${isDark ? "text-slate-500 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Actions Action bar */}
                  <div className={`px-5 py-2.5 border-b flex flex-wrap gap-2 items-center bg-slate-50/50 dark:bg-white/[0.01] ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-450"}`}>Actions:</span>
                    
                    {selectedTicket.agent?.id !== user.id && (
                      <button 
                        onClick={() => updateTicketDetails({ agentId: user.id })}
                        disabled={updatingTicketDetails}
                        className="admin-btn admin-btn-ghost admin-btn-sm text-[11px] gap-1 px-2.5"
                        style={{ height: 26 }}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#38b1f7]" />
                        Assign to Me
                      </button>
                    )}
                    
                    {selectedTicket.status === "OPEN" && (
                      <button 
                        onClick={() => updateTicketDetails({ status: "IN_PROGRESS" })}
                        disabled={updatingTicketDetails}
                        className="admin-btn admin-btn-ghost admin-btn-sm text-[11px] gap-1 px-2.5"
                        style={{ height: 26 }}
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        Start Working
                      </button>
                    )}

                    {!selectedTicket.isEscalated && (selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && (
                      <button 
                        onClick={() => setShowEscalateModal(true)}
                        disabled={updatingTicketDetails}
                        className="admin-btn admin-btn-ghost admin-btn-sm text-[11px] gap-1 px-2.5"
                        style={{ height: 26 }}
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5 text-red-500" />
                        Escalate
                      </button>
                    )}
                    
                    {(selectedTicket.status === "OPEN" || selectedTicket.status === "IN_PROGRESS") && (
                      <button 
                        onClick={() => updateTicketDetails({ status: "RESOLVED" })}
                        disabled={updatingTicketDetails}
                        className="admin-btn admin-btn-primary admin-btn-sm text-[11px] gap-1 px-2.5"
                        style={{ height: 26 }}
                      >
                        {updatingTicketDetails ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Resolve Ticket
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Description */}
                    <div className="px-5 pt-4">
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        Issue Description
                      </p>
                      <div className={`p-4 rounded-xl border leading-relaxed text-xs whitespace-pre-wrap ${isDark ? "bg-[#111827] border-white/[0.04] text-slate-350" : "bg-white border-slate-200 text-slate-650"}`}>
                        {selectedTicket.description}
                        {selectedTicket.createdBySecondaryEmail && (
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#38b1f7] bg-[#38b1f7]/10 border border-[#38b1f7]/25 px-2.5 py-1 rounded-lg w-fit font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38b1f7] animate-pulse" />
                            <span>Created via secondary email: {selectedTicket.createdBySecondaryEmail}</span>
                          </div>
                        )}
                      </div>

                      {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.04] space-y-2">
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Attachments / Screenshot Proofs
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {selectedTicket.attachments.map((att) => {
                              const isImage = att.mimeType?.startsWith("image/") || att.filename?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                              const fileUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000"}${att.filePath}`;
                              return (
                                <div key={att.id} className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-white/[0.05] p-2 bg-slate-50/50 dark:bg-white/[0.01] flex flex-col justify-between h-[125px]">
                                  {isImage ? (
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-[65px] overflow-hidden rounded bg-slate-100 dark:bg-slate-950 flex items-center justify-center border dark:border-white/5 border-slate-200">
                                      <img src={fileUrl} alt={att.filename} className="max-h-full max-w-full object-contain" />
                                    </a>
                                  ) : (
                                    <div className="w-full h-[65px] rounded bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                                      <FileText className="w-6 h-6 text-slate-400" />
                                    </div>
                                  )}
                                  <div className="flex flex-col min-w-0 mt-1.5">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-sky-500 hover:underline truncate block" title={att.filename}>
                                      {att.filename}
                                    </a>
                                    {att.uploadedBy ? (
                                      <span className={`text-[9px] font-semibold truncate mt-0.5 ${
                                        att.uploadedBy.role === "CUSTOMER" 
                                          ? "text-blue-500 dark:text-blue-450" 
                                          : "text-amber-500 dark:text-amber-450"
                                      }`}>
                                        By: {att.uploadedBy.name} ({att.uploadedBy.role === "CUSTOMER" ? "Client" : "Agent"})
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                                        By: Client
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SLA Progress Bar Panel */}
                    <div className="px-5">
                      {(() => {
                        const sla = getSlaDetails(selectedTicket);
                        return (
                          <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 justify-between items-stretch text-xs ${isDark ? "bg-[#38b1f7]/4 border-white/[0.04]" : "bg-slate-50 border-slate-200"}`}>
                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 font-medium">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Response SLA</span>
                                <span className={`ml-auto font-mono text-[10px] ${
                                  sla.responseState === "MET" ? "text-green-500 font-semibold" :
                                  sla.responseState === "BREACHED" ? "text-red-500 font-bold" :
                                  sla.responseState === "WARNING" ? "text-amber-500 font-bold" : "text-slate-400"
                                }`}>
                                  {sla.responseState === "MET" && `Met: ${sla.responseHours}h`}
                                  {sla.responseState === "BREACHED" && `BREACHED (${sla.responseHours}h)`}
                                  {sla.responseState === "WARNING" && `Breach in ${Math.round((sla.responseLimit - sla.responseHours)*10)/10}h`}
                                  {sla.responseState === "PENDING" && `Elapsed: ${sla.responseHours}h`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    sla.responseState === "MET" ? "bg-green-500" :
                                    sla.responseState === "BREACHED" ? "bg-red-500" :
                                    sla.responseState === "WARNING" ? "bg-amber-500" : "bg-[#38b1f7]"
                                  }`}
                                  style={{ width: `${Math.min(100, (sla.responseHours / sla.responseLimit) * 100)}%` }}
                                />
                              </div>
                            </div>

                            <div className="flex-1 space-y-1.5">
                              <div className="flex items-center gap-2 font-medium">
                                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                                <span className={isDark ? "text-slate-300" : "text-slate-600"}>Resolution SLA</span>
                                <span className={`ml-auto font-mono text-[10px] ${
                                  sla.resolutionState === "MET" ? "text-green-500 font-semibold" :
                                  sla.resolutionState === "BREACHED" ? "text-red-500 font-bold" :
                                  sla.resolutionState === "WARNING" ? "text-amber-500 font-bold" : "text-slate-400"
                                }`}>
                                  {sla.resolutionState === "MET" && `Met: ${sla.resolutionHours}h`}
                                  {sla.resolutionState === "BREACHED" && `BREACHED (${sla.resolutionHours}h)`}
                                  {sla.resolutionState === "WARNING" && `Breach in ${Math.round((sla.resolutionLimit - sla.resolutionHours)*10)/10}h`}
                                  {sla.resolutionState === "PENDING" && `Elapsed: ${sla.resolutionHours}h`}
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    sla.resolutionState === "MET" ? "bg-green-500" :
                                    sla.resolutionState === "BREACHED" ? "bg-red-500" :
                                    sla.resolutionState === "WARNING" ? "bg-amber-500" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, (sla.resolutionHours / sla.resolutionLimit) * 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Metadata controls grid */}
                    <div className="px-5">
                      <div className={`p-4 rounded-xl border grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-50/50 dark:bg-white/[0.01] ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
                        {selectedTicket.isEscalated && (
                          <div className="md:col-span-2 flex flex-col gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1 uppercase tracking-wider text-[10px]">
                                <ArrowUpCircle className="w-4 h-4 text-red-500" />
                                Escalated L2 Ticket
                              </span>
                              <span className="text-[10px] font-semibold opacity-75">
                                {selectedTicket.escalatedAt ? new Date(selectedTicket.escalatedAt).toLocaleString() : ""}
                              </span>
                            </div>
                            {selectedTicket.escalationReason && (
                              <p className="text-[11px] leading-relaxed italic bg-white/20 dark:bg-black/20 p-2 rounded-md">
                                &ldquo;{selectedTicket.escalationReason}&rdquo;
                              </p>
                            )}
                            <div className="text-[10px] flex justify-between items-center opacity-95 pt-1 border-t border-red-500/10">
                              <span>Escalated By: {selectedTicket.escalatedBy?.name || "Agent"} ({selectedTicket.escalatedBy?.email})</span>
                            </div>
                          </div>
                        )}
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
                          <div key={label} className="flex items-center justify-between gap-3 text-xs">
                            <span className={`font-semibold shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{label}</span>
                            <select
                              value={value}
                              onChange={e => onChange(e.target.value)}
                              disabled={updatingTicketDetails}
                              className={`admin-select text-xs flex-1 max-w-[150px] ${isDark ? "admin-dark" : ""}`}
                              style={{ height: 32 }}
                            >
                              {options.map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                            </select>
                          </div>
                        ))}

                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className={`font-semibold shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Team</span>
                          <select
                            value={selectedTicket.team?.id || ""}
                            onChange={e => updateTicketDetails({ teamId: e.target.value || null, agentId: null })}
                            disabled={updatingTicketDetails}
                            className={`admin-select text-xs flex-1 max-w-[150px] ${isDark ? "admin-dark" : ""}`}
                            style={{ height: 32 }}
                          >
                            <option value="">Unassigned</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>

                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className={`font-semibold shrink-0 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Agent</span>
                          <select
                            value={selectedTicket.agent?.id || ""}
                            onChange={e => updateTicketDetails({ agentId: e.target.value || null })}
                            disabled={updatingTicketDetails}
                            className={`admin-select text-xs flex-1 max-w-[150px] ${isDark ? "admin-dark" : ""}`}
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
                    </div>

                    {/* CRM Context Details */}
                    <div className="px-5">
                      {(() => {
                        const st = selectedTicket as any;
                        const crmCust = st.customer?.crmCustomer;
                        const credits = st.customer?.customerCredits;
                        const activeSub = crmCust?.subscriptions?.find((s: any) => s.status === "ACTIVE");
                        const supportPlan = activeSub ? activeSub.planName : "Standard Support";

                        return (
                          <div className="space-y-4">
                            {/* Customer Details */}
                            <div className={`p-4 rounded-xl border space-y-2.5 bg-slate-50/50 dark:bg-white/[0.01] ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
                              <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-450"}`}>
                                CRM Customer Info
                              </h4>
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Customer</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crmCust?.displayName || st.customer?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Company</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crmCust?.companyName || "Local Customer"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Email</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crmCust?.primaryEmail || st.customer?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Phone</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{crmCust?.primaryPhone || st.customer?.phoneNumber || "None"}</span>
                                </div>
                              </div>
                            </div>

                            {/* Ticket Relations */}
                            {(st.domain || st.service || st.subscription || st.affectedDomain || st.issueCategory) && (
                              <div className={`p-4 rounded-xl border space-y-2.5 bg-slate-50/50 dark:bg-white/[0.01] ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
                                <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-450"}`}>
                                  Ticket CRM Mapping
                                </h4>
                                <div className="space-y-1.5 text-xs">
                                  {(st.domain?.domainName || st.affectedDomain) && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Domain</span>
                                      <span className={`font-semibold font-mono ${isDark ? "text-slate-200" : "text-slate-800"}`}>{st.domain?.domainName || st.affectedDomain}</span>
                                    </div>
                                  )}
                                  {(st.service?.name || st.issueCategory) && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Service</span>
                                      <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{st.service?.name || st.issueCategory}</span>
                                    </div>
                                  )}
                                  {st.subscription?.planName && (
                                    <div className="flex justify-between">
                                      <span className="text-slate-400">Subscription</span>
                                      <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{st.subscription?.planName}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Support Plan & Credits */}
                            {credits && (
                              <div className={`p-4 rounded-xl border space-y-2.5 bg-slate-50/50 dark:bg-white/[0.01] ${isDark ? "border-white/[0.04]" : "border-slate-100"}`}>
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-550" : "text-slate-455"}`}>
                                      Support Credits
                                    </h4>
                                    <p className={`text-[9px] font-medium mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                      Plan: {supportPlan}
                                    </p>
                                  </div>
                                  <span className={`text-xs font-mono font-bold ${credits.remainingHours <= 2 ? "text-red-500 animate-pulse" : "text-green-500"}`}>
                                    {credits.remainingHours} / {credits.allocatedHours || 20} hrs left
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      credits.remainingHours <= 2 ? "bg-red-500 animate-pulse" : credits.remainingHours <= 5 ? "bg-amber-500" : "bg-green-500"
                                    }`}
                                    style={{ width: `${Math.min(100, (credits.remainingHours / (credits.allocatedHours || 20)) * 100)}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-450 font-medium">
                                  <span>Allocated: {credits.allocatedHours}h</span>
                                  <span>Used: {credits.usedHours}h</span>
                                  {credits.billableHours > 0 && <span className="text-red-500 font-bold">Overage: {credits.billableHours}h</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Activity Stream Chronological Timeline */}
                    <div className="px-5 pb-4 space-y-4">
                      <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                        <History className="w-3.5 h-3.5 inline mr-1.5" />
                        Activity Stream & Discussion
                      </h4>
                      
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {(() => {
                          const timelineEvents = [
                            ...(selectedTicket.messages || []).map(m => ({
                              id: m.id,
                              type: "message" as const,
                              createdAt: m.createdAt,
                              sender: m.sender,
                              content: m.message
                            })),
                            ...(selectedTicket.statusHistory || []).map(h => ({
                              id: h.id,
                              type: "status_change" as const,
                              createdAt: h.createdAt,
                              sender: h.changedBy,
                              fromStatus: h.fromStatus,
                              toStatus: h.toStatus
                            })),
                            ...(selectedTicket.creditTransactions || []).map(tx => ({
                              id: tx.id,
                              type: "credits" as const,
                              createdAt: tx.createdAt,
                              hours: tx.hours,
                              txType: tx.type,
                              description: tx.description
                            }))
                          ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

                          if (timelineEvents.length === 0) {
                            return <p className={`text-xs text-center py-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>No activity or messages yet.</p>;
                          }

                          return timelineEvents.map(event => {
                            if (event.type === "message") {
                              const isCustomer = event.sender.role === "CUSTOMER";
                              return (
                                <div key={event.id} className={`flex gap-3 items-start ${isCustomer ? "" : "flex-row-reverse"}`}>
                                  {/* Avatar */}
                                  <div 
                                    title={`${event.sender.name} (${event.sender.role})`}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                      isCustomer
                                        ? isDark ? "bg-[#38b1f7]/15 text-[#5fc0f9]" : "bg-blue-50 text-blue-700 border border-blue-100"
                                        : isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-50 text-amber-700 border border-amber-100"
                                    }`}
                                  >
                                    {event.sender.name.charAt(0).toUpperCase()}
                                  </div>
                                  
                                  {/* Message bubble */}
                                  <div className={`flex-1 max-w-[85%] p-3 rounded-2xl border text-xs shadow-sm ${
                                    isCustomer
                                      ? isDark ? "bg-[#38b1f7]/6 border-[#38b1f7]/12 rounded-tl-none" : "bg-blue-50/70 border-blue-100 rounded-tl-none"
                                      : isDark ? "bg-[#1e293b]/60 border-white/[0.04] rounded-tr-none" : "bg-slate-50/70 border-slate-200 rounded-tr-none"
                                  }`}>
                                    <div className="flex items-center justify-between mb-1 gap-3">
                                      <span className={`font-semibold ${
                                        isCustomer
                                          ? isDark ? "text-[#5fc0f9]" : "text-blue-700"
                                          : isDark ? "text-amber-400" : "text-amber-700"
                                      }`}>
                                        {event.sender.name}
                                        <span className={`ml-1.5 text-[9px] font-normal px-1.5 py-0.5 rounded-full uppercase ${
                                          isCustomer
                                            ? isDark ? "bg-[#38b1f7]/15 text-[#5fc0f9]" : "bg-blue-50 text-blue-600"
                                            : isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600"
                                        }`}>
                                          {event.sender.role}
                                        </span>
                                      </span>
                                      <span className={`text-[9px] font-medium ${isDark ? "text-slate-550" : "text-slate-400"}`}>
                                        {new Date(event.createdAt).toLocaleDateString()} {new Date(event.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                    <p className={`leading-relaxed whitespace-pre-wrap ${isDark ? "text-slate-300" : "text-slate-700"}`}>{event.content}</p>
                                  </div>
                                </div>
                              );
                            } else if (event.type === "status_change") {
                              return (
                                <div key={event.id} className="flex items-center justify-center gap-2 my-2 py-1 px-4 text-[10px] text-slate-550 font-medium">
                                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1" />
                                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <History className="w-3 h-3 text-slate-450" />
                                    <span>
                                      Status: <span className="font-semibold text-slate-700 dark:text-slate-300">{event.fromStatus || "NONE"}</span> →{" "}
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">{event.toStatus}</span>
                                      {event.sender && ` by ${event.sender.name}`}
                                    </span>
                                  </div>
                                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 flex-1" />
                                </div>
                              );
                            } else if (event.type === "credits") {
                              return (
                                <div key={event.id} className="flex items-center justify-center gap-2 my-2 py-1 px-4 text-[10px] text-amber-650 dark:text-amber-400 font-medium">
                                  <div className="h-[1px] bg-amber-200/50 dark:bg-amber-950/20 flex-1" />
                                  <div className="flex items-center gap-1.5 shrink-0 bg-amber-55 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-250 dark:border-amber-500/20 shadow-sm">
                                    <Coins className="w-3 h-3 text-amber-500" />
                                    <span>
                                      {event.hours} Support Credits ({event.description || "Resolution charge"})
                                    </span>
                                  </div>
                                  <div className="h-[1px] bg-amber-200/50 dark:bg-amber-950/20 flex-1" />
                                </div>
                              );
                            }
                            return null;
                          });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Reply box */}
                  <div className={`px-5 py-4 border-t ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                    <form onSubmit={submitTicketReply} className="flex gap-2">
                      <input
                        type="text"
                        required
                        disabled={submittingReply}
                        value={ticketReply}
                        onChange={e => setTicketReply(e.target.value)}
                        placeholder="Write a reply..."
                        className={`admin-input ${isDark ? "admin-dark" : ""} flex-1 text-sm`}
                        style={{ height: 38 }}
                      />
                      <button type="submit" disabled={submittingReply || !ticketReply.trim()} className="admin-btn admin-btn-primary px-3" style={{ height: 38 }} aria-label="Send reply">
                        {submittingReply ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
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
                submitting={submittingTeam}
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
                submitting={submittingTeam}
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
        {activeTab === "clients" && (user.role === "ADMIN" || user.role === "SUPPORT_L1" || user.role === "SUPPORT_L2" || user.role === "BILLING") && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

            {/* ── Client List (left column) ── */}
            <div className={`lg:col-span-2 admin-card ${isDark ? "admin-dark" : ""} overflow-hidden flex flex-col`}>
              {/* ── Stats Row ── */}
              {(() => {
                const allClients = users.filter(u => u.role === "CUSTOMER");
                const activeCount = allClients.filter(u => u.isActive).length;
                const crmCount = allClients.filter(u => u.crmCustomerId).length;
                const pendingCount = allClients.filter(u => !u.emailVerified && u.crmCustomerId).length;
                return (
                  <div className={`grid grid-cols-4 divide-x border-b text-center ${isDark ? "border-white/[0.05] divide-white/[0.05]" : "border-slate-100 divide-slate-100"}`}>
                    {[
                      { label: "Total", value: allClients.length, color: isDark ? "text-white" : "text-slate-900" },
                      { label: "Active", value: activeCount, color: "text-emerald-500" },
                      { label: "CRM Synced", value: crmCount, color: isDark ? "text-[#5fc0f9]" : "text-blue-600" },
                      { label: "Pending", value: pendingCount, color: "text-amber-500" },
                    ].map(stat => (
                      <div key={stat.label} className={`py-3 px-2 ${isDark ? "hover:bg-white/[0.02]" : "hover:bg-slate-50/60"} transition-colors`}>
                        <p className={`text-base font-bold tabular-nums ${stat.color}`}>{stat.value}</p>
                        <p className={`text-[10px] font-medium mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* ── Toolbar ── */}
              <div className={`px-4 py-3 border-b flex flex-col gap-2.5 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                {/* Title row */}
                <div className="flex items-center justify-between gap-2">
                  <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Client Accounts
                  </h2>
                  <div className="flex items-center gap-1.5">
                    {/* Import All from CRM */}
                    {user.role === "ADMIN" && (
                      <button
                        onClick={handleBulkImportCrm}
                        disabled={importingCrm}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                          importingCrm
                            ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]/20 text-[#5fc0f9] opacity-70 cursor-wait" : "bg-blue-50 border-blue-200 text-blue-600 opacity-70 cursor-wait"
                            : isDark ? "bg-[#38b1f7]/10 border-[#38b1f7]/25 text-[#5fc0f9] hover:bg-[#38b1f7]/20" : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
                        }`}
                        title="Fetch and sync all customers from the CRM"
                      >
                        {importingCrm ? (
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"/>
                          </svg>
                        )}
                        {importingCrm ? "Importing..." : "Import All from CRM"}
                      </button>
                    )}
                    {/* New Client Button */}
                    {user.role === "ADMIN" && (
                      <button
                        onClick={() => { setUserFormName(""); setUserFormEmail(""); setUserFormPassword(""); setUserFormRole("CUSTOMER"); setUserFormTeams([]); setShowCreateUser(true); }}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ height: 30, fontSize: 11 }}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        New
                      </button>
                    )}
                  </div>
                </div>

                {/* Import result banner */}
                {importResult && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs border ${
                    importResult.failed > 0
                      ? isDark ? "bg-amber-500/8 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
                      : isDark ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                  }`}>
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{importResult.imported} imported{importResult.failed > 0 ? `, ${importResult.failed} failed` : " successfully"}.</span>
                    <button onClick={() => setImportResult(null)} className="ml-auto opacity-60 hover:opacity-100"><X className="w-3 h-3" /></button>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, email, or company..."
                    className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs`}
                    style={{ height: 34, paddingLeft: "2.25rem" }}
                  />
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(["ALL", "ACTIVE", "SUSPENDED", "PENDING", "CRM"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setClientFilter(f)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                        clientFilter === f
                          ? isDark ? "bg-[#38b1f7]/20 border-[#38b1f7]/40 text-[#5fc0f9]" : "bg-blue-100 border-blue-300 text-blue-700"
                          : isDark ? "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300" : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {f === "ALL" ? "All" : f === "ACTIVE" ? "Active" : f === "SUSPENDED" ? "Suspended" : f === "PENDING" ? "Pending Invite" : "CRM Synced"}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Client list ── */}
              {(() => {
                const allClients = users.filter(u => u.role === "CUSTOMER");
                const searchedClients = allClients.filter(u => {
                  if (userSearch.trim()) {
                    const q = userSearch.toLowerCase();
                    return (
                      u.name.toLowerCase().includes(q) ||
                      u.email.toLowerCase().includes(q) ||
                      ((u as any).crmCustomer?.companyName || "").toLowerCase().includes(q) ||
                      ((u as any).crmCustomer?.displayName || "").toLowerCase().includes(q)
                    );
                  }
                  return true;
                }).filter(u => {
                  if (clientFilter === "ACTIVE") return u.isActive;
                  if (clientFilter === "SUSPENDED") return !u.isActive;
                  if (clientFilter === "PENDING") return !u.emailVerified && !!u.crmCustomerId;
                  if (clientFilter === "CRM") return !!u.crmCustomerId;
                  return true;
                });

                const totalClientPages = Math.ceil(searchedClients.length / clientPageSize) || 1;
                const paginatedClients = searchedClients.slice((clientCurrentPage - 1) * clientPageSize, clientCurrentPage * clientPageSize);

                if (searchedClients.length === 0) {
                  return (
                    <div className={`divide-y overflow-y-auto flex-1 ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                      <EmptyState icon={<Users className="w-8 h-8" />} title="No clients found" description="No client accounts match your current search or filter." isDark={isDark} />
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col flex-1 min-h-0">
                    <div className={`divide-y overflow-y-auto flex-1 max-h-[580px] ${isDark ? "divide-white/[0.04]" : "divide-slate-100"}`}>
                      {paginatedClients.map(u => {
                        const initials = u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                        const credits = u.customerCredits;
                        const utilPct = credits ? Math.min(100, Math.round((credits.usedHours / Math.max(credits.allocatedHours, 0.01)) * 100)) : 0;
                        const isSelected = selectedClientView?.id === u.id;
                        const clientTickets = tickets.filter(t => t.customer.id === u.id);
                        const openCount = clientTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
                        const isActivated = u.emailVerified;
                        const hasCrm = !!u.crmCustomerId;
                        const company = (u as any).crmCustomer?.companyName;

                        return (
                          <div
                            key={u.id}
                            onClick={() => handleSelectClient(u)}
                            className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-200 border-l-2 ${
                              isSelected
                                ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]" : "bg-blue-50/60 border-[#38b1f7]"
                                : `border-transparent ${isDark ? "hover:bg-white/[0.025]" : "hover:bg-slate-50/80"}`
                            }`}
                          >
                            {/* Avatar */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected
                                ? isDark ? "bg-[#38b1f7]/25 text-[#5fc0f9]" : "bg-blue-100 text-blue-700"
                                : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"
                            }`}>
                              {initials}
                            </div>

                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Name + Status */}
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>{u.name}</p>
                                <div className="flex items-center gap-1 shrink-0">
                                  {hasCrm && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                      isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]/20 text-[#5fc0f9]" : "bg-blue-50 border-blue-200 text-blue-600"
                                    }`}>CRM</span>
                                  )}
                                  <span className={`admin-badge ${u.isActive ? "admin-badge-active" : "admin-badge-suspended"}`}>
                                    {u.isActive ? "Active" : "Off"}
                                  </span>
                                </div>
                              </div>

                              {/* Company or Email */}
                              {company ? (
                                <p className={`text-xs font-medium truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}>{company}</p>
                              ) : null}
                              <p className={`text-xs truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>{u.email}</p>

                              {/* Bottom row: invite pill + credit bar + open tickets */}
                              <div className="flex items-center gap-2 pt-0.5">
                                {/* Invite status */}
                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                                  isActivated
                                    ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                                    : hasCrm
                                    ? isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200"
                                    : isDark ? "bg-slate-800 text-slate-600 border-slate-700/50" : "bg-slate-100 text-slate-400 border-slate-200"
                                }`}>
                                  {isActivated ? "✓ Activated" : hasCrm ? "● Pending" : "○ No Invite"}
                                </span>

                                {/* Credit bar */}
                                {credits && (
                                  <div className="flex-1 flex items-center gap-1.5 min-w-0">
                                    <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}>
                                      <div
                                        className={`h-full rounded-full transition-all ${
                                          utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${utilPct}%` }}
                                      />
                                    </div>
                                    <span className={`text-[9px] shrink-0 font-medium tabular-nums ${
                                      utilPct >= 90 ? "text-red-500" : utilPct >= 70 ? "text-amber-500" : isDark ? "text-slate-500" : "text-slate-400"
                                    }`}>{credits.remainingHours}h</span>
                                  </div>
                                )}

                                {/* Open tickets badge */}
                                {openCount > 0 && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                                    isDark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {openCount} open
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <PaginationControls
                      currentPage={clientCurrentPage}
                      totalPages={totalClientPages}
                      totalItems={searchedClients.length}
                      pageSize={clientPageSize}
                      onPageChange={setClientCurrentPage}
                      onPageSizeChange={setClientPageSize}
                      isDark={isDark}
                      itemLabel="clients"
                    />
                  </div>
                );
              })()}
            </div>

            {/* ── Client Detail Panel (right column) ── */}
            <div className={`lg:col-span-3 admin-card sticky top-6 ${isDark ? "admin-dark" : ""} overflow-hidden flex flex-col`} style={{ maxHeight: "calc(100vh - 7rem)" }}>
              {clientDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-20 px-6">
                  <Loader size="md" theme={isDark ? "dark" : "light"}  />
                  <p className={`text-xs mt-3 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Loading client details...</p>
                </div>
              ) : selectedClientView ? (() => {
                const cv = selectedClientView as any;
                const credits = cv.customerCredits;
                const clientTickets = tickets.filter(t => t.customer.id === cv.id);
                const openTickets = clientTickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
                const allocH = credits?.allocatedHours ?? 0;
                const usedH = credits?.usedHours ?? 0;
                const remH = credits?.remainingHours ?? 0;
                const billH = credits?.billableHours ?? 0;
                const utilPct = allocH > 0 ? Math.min(100, Math.round((usedH / allocH) * 100)) : 0;
                const initials = cv.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

                const activeSubsList = cv.crmCustomer?.subscriptions?.filter((s: any) => String(s.status || "").toUpperCase() === "ACTIVE") || [];
                const activeSub = activeSubsList[0];
                const supportPlan = activeSub ? activeSub.planName : "Standard Support";

                const serviceCreditsMap: { [name: string]: number } = {};
                activeSubsList.forEach((sub: any) => {
                  sub.services?.forEach((svc: any) => {
                    const credit = Number(svc.serviceCredit || svc.supportCreditHours || 0);
                    if (credit > 0) {
                      serviceCreditsMap[svc.serviceName] = (serviceCreditsMap[svc.serviceName] || 0) + credit;
                    }
                  });
                });
                const serviceCredits = Object.entries(serviceCreditsMap);
                const latestInvitation = cv.crmCustomer?.invitations?.[0];
                // Compute invitation state
                const isAccountActivated = cv.emailVerified === true;
                const inviteIsPending = latestInvitation && !latestInvitation.usedAt && new Date(latestInvitation.expiresAt).getTime() > Date.now();
                const inviteIsExpired = latestInvitation && !latestInvitation.usedAt && new Date(latestInvitation.expiresAt).getTime() <= Date.now();
                // Setup buttons are disabled once activated; resend only works while pending
                const canSendSetupLink = !isAccountActivated; // disabled when already activated
                const canResend = !isAccountActivated && !!latestInvitation && !latestInvitation.usedAt;

                return (
                  <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* ── Premium Header with gradient banner ── */}
                    <div className={`relative overflow-hidden shrink-0 ${isDark ? "bg-gradient-to-br from-slate-900 via-[#0a1628] to-[#0d1f35]" : "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800"}`}>
                      {/* Decorative circles */}
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8" style={{ background: "radial-gradient(circle, white, transparent)" }} />
                      <div className="absolute bottom-0 left-12 w-20 h-20 rounded-full opacity-5 translate-y-6" style={{ background: "radial-gradient(circle, white, transparent)" }} />

                      <div className="relative px-6 pt-6 pb-5">
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 bg-white/15 text-white border border-white/20 shadow-lg">
                            {initials}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="text-lg font-bold text-white truncate">{cv.name}</h3>
                                {cv.crmCustomer?.companyName && (
                                  <p className="text-sm text-white/70 font-medium truncate mt-0.5">{cv.crmCustomer.companyName}</p>
                                )}
                                <p className="text-xs text-white/50 truncate mt-0.5">{cv.email}</p>
                              </div>
                              <button
                                onClick={() => setSelectedClientView(null)}
                                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 mt-0.5"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Status badges */}
                            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                cv.isActive ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300" : "bg-red-500/20 border-red-400/30 text-red-300"
                              }`}>
                                {cv.isActive ? "● Active" : "○ Suspended"}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                cv.crmCustomer ? "bg-blue-400/20 border-blue-400/30 text-blue-200" : "bg-slate-400/20 border-slate-400/30 text-slate-300"
                              }`}>
                                {cv.crmCustomer ? "CRM Synced" : "Local Only"}
                              </span>
                              {isAccountActivated && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-400/20 border-emerald-400/30 text-emerald-200">✓ Portal Activated</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quick stats bar */}
                        <div className="grid grid-cols-3 gap-2 mt-4">
                          <div className="bg-white/10 rounded-xl px-3 py-2 text-center border border-white/10">
                            <p className="text-base font-bold text-white tabular-nums">{clientTickets.length}</p>
                            <p className="text-[10px] text-white/50 font-medium mt-0.5">All Tickets</p>
                          </div>
                          <div className="bg-white/10 rounded-xl px-3 py-2 text-center border border-white/10">
                            <p className="text-base font-bold text-white tabular-nums">{openTickets.length}</p>
                            <p className="text-[10px] text-white/50 font-medium mt-0.5">Open Now</p>
                          </div>
                          <div className="bg-white/10 rounded-xl px-3 py-2 text-center border border-white/10">
                            <p className={`text-base font-bold tabular-nums ${remH <= 2 ? "text-red-300" : "text-white"}`}>{remH}h</p>
                            <p className="text-[10px] text-white/50 font-medium mt-0.5">Credits Left</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* ── Invitation Status Banner ── */}
                    {(() => {
                      if (isAccountActivated) {
                        return (
                          <div className={`mx-6 mt-4 mb-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0 ${
                            isDark ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                          }`}>
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Account Activated — Client has set up their password and can log in.</span>
                          </div>
                        );
                      }
                      if (inviteIsPending) {
                        return (
                          <div className={`mx-6 mt-4 mb-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0 ${
                            isDark ? "bg-amber-500/8 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                            <span>Invitation Pending — Setup link sent. Awaiting client activation.</span>
                            <span className={`ml-auto text-[10px] font-normal ${isDark ? "text-amber-500/60" : "text-amber-500"}`}>
                              Expires {new Date(latestInvitation.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        );
                      }
                      if (inviteIsExpired) {
                        return (
                          <div className={`mx-6 mt-4 mb-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-semibold shrink-0 ${
                            isDark ? "bg-red-500/8 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-700"
                          }`}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>Invitation Expired — Please send a new setup link for the client to activate.</span>
                          </div>
                        );
                      }
                      return (
                        <div className={`mx-6 mt-4 mb-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs shrink-0 ${
                          isDark ? "bg-slate-800/60 border-white/[0.05] text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
                        }`}>
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <span>No invitation sent yet. Use the action buttons below to send a setup link.</span>
                        </div>
                      );
                    })()}

                    {/* Quick Actions */}
                    <div className={`px-6 py-3 mt-3 border-b flex flex-wrap gap-2 items-center shrink-0 ${isDark ? "border-white/[0.05] bg-white/[0.01]" : "border-slate-100 bg-slate-50/50"}`}>
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-450"}`}>Actions:</span>
                      
                      {/* Send Setup Link — disabled once activated */}
                      <div title={isAccountActivated ? "Account is already activated" : ""}>
                        <button
                          onClick={() => canSendSetupLink && handleSendInvitation(cv.id, false)}
                          disabled={!canSendSetupLink}
                          className={`admin-btn admin-btn-primary admin-btn-sm transition-opacity ${
                            !canSendSetupLink ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                          }`}
                          style={{ height: 28 }}
                        >
                          <Mail className="w-3 h-3" />
                          Send Setup Link
                        </button>
                      </div>

                      {/* Send Setup Link + Temp Pass — disabled once activated */}
                      <div title={isAccountActivated ? "Account is already activated" : ""}>
                        <button
                          onClick={() => canSendSetupLink && handleSendInvitation(cv.id, true)}
                          disabled={!canSendSetupLink}
                          className={`admin-btn admin-btn-ghost admin-btn-sm transition-opacity ${
                            !canSendSetupLink ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
                          }`}
                          style={{ height: 28 }}
                        >
                          Send Setup Link + Temp Pass
                        </button>
                      </div>

                      {/* Resend Invitation — only visible while pending */}
                      {canResend && (
                        <button
                          onClick={() => handleResendInvitation(cv.id)}
                          className="admin-btn admin-btn-ghost admin-btn-sm"
                          style={{ height: 28 }}
                        >
                          Resend Invitation
                        </button>
                      )}

                      {/* Password Reset — visible only once activated */}
                      {isAccountActivated && (
                        <button
                          onClick={() => handleSendResetPasswordLink(cv.id)}
                          className={`admin-btn admin-btn-ghost admin-btn-sm`}
                          style={{ height: 28 }}
                        >
                          Send Reset Link
                        </button>
                      )}

                      {/* Toggle Login Access */}
                      <button
                        onClick={() => handleUpdateUser(cv.id, { isActive: !cv.isActive })}
                        className={`admin-btn admin-btn-sm ${
                          cv.isActive
                            ? "text-amber-600 border border-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400"
                            : "text-emerald-600 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                        }`}
                        style={{ height: 28, gap: 4 }}
                      >
                        {cv.isActive ? <MinusCircle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                        {cv.isActive ? "Disable Login" : "Enable Login"}
                      </button>

                      {/* Adjust Credits Action */}
                      <button
                        onClick={() => {
                          setCreditsEditingUser(cv);
                          setCreditsAllocated(cv.customerCredits?.allocatedHours ?? 20);
                          setCreditsDescription("");
                          setActiveTab("credits");
                          setSelectedClientView(null);
                        }}
                        className={`admin-btn admin-btn-sm ${
                          isDark ? "text-[#5fc0f9] border-[#38b1f7]/25 bg-[#38b1f7]/8 hover:bg-[#38b1f7]/15" : "text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100"
                        }`}
                        style={{ height: 28, gap: 4 }}
                      >
                        <Coins className="w-3 h-3" />
                        Adjust Credits
                      </button>
                    </div>

                    {/* Tab Navigation */}
                    <div className={`flex border-b overflow-x-auto scrollbar-hide px-6 shrink-0 ${isDark ? "border-white/[0.05]" : "border-slate-100"}`}>
                      {[
                        { id: "profile", label: "Profile" },
                        { id: "contact", label: "Contact Info" },
                        { id: "domains", label: "Domains" },
                        { id: "services", label: "Services" },
                        { id: "subscriptions", label: "Subscriptions" },
                        { id: "tickets", label: "Tickets" },
                        { id: "sla", label: "SLA & Credits" },
                        { id: "audit", label: "Audit History" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setClientActiveTab(tab.id as any)}
                          className={`py-3 px-4 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors -mb-px ${
                            clientActiveTab === tab.id
                              ? isDark
                                ? "border-[#38b1f7] text-[#5fc0f9]"
                                : "border-blue-600 text-blue-600"
                              : isDark
                              ? "border-transparent text-slate-500 hover:text-slate-300"
                              : "border-transparent text-slate-400 hover:text-slate-600"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="px-6 py-5 space-y-6">

                      {/* 1. Profile Tab */}
                      {clientActiveTab === "profile" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Display Name */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Display Name</p>
                              <p className={`text-sm font-semibold leading-snug ${isDark ? "text-white" : "text-slate-800"}`}>{cv.crmCustomer?.displayName || cv.name}</p>
                            </div>
                            {/* Company Name */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Company Name</p>
                              <p className={`text-sm font-semibold leading-snug ${isDark ? "text-white" : "text-slate-800"}`}>{cv.crmCustomer?.companyName || <span className={isDark ? "text-slate-600" : "text-slate-400"}>No Company Specified</span>}</p>
                            </div>
                            {/* CRM Customer ID */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRM Customer ID</p>
                              <p className={`text-sm font-mono font-medium leading-snug ${isDark ? "text-[#5fc0f9]" : "text-blue-700"}`}>{cv.crmCustomerId || <span className={isDark ? "text-slate-600" : "text-slate-400"}>Not Linked</span>}</p>
                            </div>
                            {/* Account Creation */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Account Creation</p>
                              <p className={`text-sm font-medium leading-snug ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                {new Date(cv.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {/* Last Synced At */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last Synced At</p>
                              <p className={`text-sm font-medium leading-snug ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                {cv.crmCustomer?.lastSyncedAt ? new Date(cv.crmCustomer.lastSyncedAt).toLocaleString() : <span className={isDark ? "text-slate-600" : "text-slate-400"}>Never</span>}
                              </p>
                            </div>
                            {/* Last Login At */}
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.025] border-white/[0.07]" : "bg-white border-slate-200 shadow-sm"}`}>
                              <p className={`text-[10px] uppercase font-bold tracking-widest mb-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Last Login At</p>
                              <p className={`text-sm font-medium leading-snug ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                                {cv.lastLoginAt ? new Date(cv.lastLoginAt).toLocaleString() : <span className={isDark ? "text-slate-600" : "text-slate-400"}>Never Logged In</span>}
                              </p>
                            </div>
                          </div>

                          {latestInvitation && (() => {
                            const invStatus = isAccountActivated
                              ? { label: "Account Activated", sub: `Activated on ${new Date(latestInvitation.usedAt).toLocaleString()}`, color: isDark ? "border-emerald-500/20 bg-emerald-500/5" : "border-emerald-200 bg-emerald-50", iconColor: "text-emerald-500", textColor: isDark ? "text-emerald-400" : "text-emerald-700" }
                              : inviteIsPending
                              ? { label: "Invitation Pending", sub: `Expires ${new Date(latestInvitation.expiresAt).toLocaleString()}`, color: isDark ? "border-amber-500/20 bg-amber-500/5" : "border-amber-200 bg-amber-50", iconColor: "text-amber-500", textColor: isDark ? "text-amber-400" : "text-amber-700" }
                              : { label: "Invitation Expired", sub: `Expired ${new Date(latestInvitation.expiresAt).toLocaleString()}`, color: isDark ? "border-red-500/20 bg-red-500/5" : "border-red-200 bg-red-50", iconColor: "text-red-500", textColor: isDark ? "text-red-400" : "text-red-700" };
                            return (
                              <div className={`rounded-xl border mt-4 overflow-hidden`}>
                                {/* Status header */}
                                <div className={`px-4 py-3 flex items-center gap-2.5 border-b ${invStatus.color} ${
                                  isDark ? "border-white/[0.06]" : "border-slate-100"
                                }`}>
                                  <ShieldAlert className={`w-4 h-4 shrink-0 ${invStatus.iconColor}`} />
                                  <div className="min-w-0">
                                    <p className={`text-xs font-bold ${invStatus.textColor}`}>{invStatus.label}</p>
                                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{invStatus.sub}</p>
                                  </div>
                                </div>
                                {/* Details grid */}
                                <div className={`px-4 py-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs ${isDark ? "bg-white/[0.01]" : "bg-slate-50/60"}`}>
                                  <div>
                                    <span className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>Sent To</span>
                                    <p className={`font-semibold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{latestInvitation.email}</p>
                                  </div>
                                  <div>
                                    <span className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>Expires / Activated</span>
                                    <p className={`font-semibold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                      {isAccountActivated
                                        ? new Date(latestInvitation.usedAt).toLocaleDateString()
                                        : new Date(latestInvitation.expiresAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  {latestInvitation.temporaryPassword && !isAccountActivated && (
                                    <div className="md:col-span-2">
                                      <span className={`${isDark ? "text-slate-500" : "text-slate-400"}`}>Temporary Password</span>
                                      <p className={`font-mono font-semibold mt-0.5 text-sm px-2.5 py-1 rounded-lg border inline-block ${isDark ? "bg-slate-800 border-white/[0.06] text-slate-200" : "bg-white border-slate-200 text-slate-700"}`}>
                                        {latestInvitation.temporaryPassword}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* 2. Contact Information Tab */}
                      {clientActiveTab === "contact" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-slate-50 border-slate-100"}`}>
                              <h5 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Mail className="w-3.5 h-3.5" />
                                Email Addresses
                              </h5>
                              <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between py-1 border-b border-dashed dark:border-white/[0.05] border-slate-200">
                                  <span className="text-slate-400">Login/Credential Email</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.email}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-dashed dark:border-white/[0.05] border-slate-200">
                                  <span className="text-slate-400">CRM Primary Email</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.crmCustomer?.primaryEmail || "Not synced"}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-slate-400">CRM Secondary Email</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.crmCustomer?.secondaryEmail || "None"}</span>
                                </div>
                              </div>
                            </div>

                            <div className={`p-4 rounded-xl border ${isDark ? "bg-white/[0.02] border-white/[0.06]" : "bg-slate-50 border-slate-100"}`}>
                              <h5 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-3 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Phone className="w-3.5 h-3.5" />
                                Phone Numbers
                              </h5>
                              <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between py-1 border-b border-dashed dark:border-white/[0.05] border-slate-200">
                                  <span className="text-slate-400">Login Phone Number</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.phoneNumber || "None"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-dashed dark:border-white/[0.05] border-slate-200">
                                  <span className="text-slate-400">CRM Primary Phone</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.crmCustomer?.primaryPhone || "Not synced"}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                  <span className="text-slate-400">CRM Secondary Phone</span>
                                  <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{cv.crmCustomer?.secondaryPhone || "None"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Domains Tab */}
                      {clientActiveTab === "domains" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Globe className="w-3.5 h-3.5" />
                              Synced Domains ({cv.crmCustomer?.domains?.length || 0})
                            </h4>
                          </div>
                          {!cv.crmCustomer?.domains || cv.crmCustomer.domains.length === 0 ? (
                            <p className={`text-sm text-center py-8 border border-dashed rounded-xl ${isDark ? "text-slate-650 border-white/[0.06]" : "text-slate-400 border-slate-200"}`}>
                              No domains registered for this customer in CRM.
                            </p>
                          ) : (
                            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-white/[0.05] divide-y divide-white/[0.04]" : "border-slate-200 divide-y divide-slate-100"}`}>
                              {cv.crmCustomer.domains.map((dom: any) => (
                                <div key={dom.crmDomainId || dom.id} className="flex justify-between items-center px-4 py-3 text-xs">
                                  <span className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{dom.domainName}</span>
                                  <span className={`text-[10px] font-mono ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRM Domain ID: {dom.crmDomainId}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 4. Services Tab */}
                      {clientActiveTab === "services" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Server className="w-3.5 h-3.5" />
                              Synced Services ({cv.crmCustomer?.services?.length || 0})
                            </h4>
                          </div>
                          {!cv.crmCustomer?.services || cv.crmCustomer.services.length === 0 ? (
                            <p className={`text-sm text-center py-8 border border-dashed rounded-xl ${isDark ? "text-slate-650 border-white/[0.06]" : "text-slate-400 border-slate-200"}`}>
                              No services registered for this customer in CRM.
                            </p>
                          ) : (
                            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-white/[0.05] divide-y divide-white/[0.04]" : "border-slate-200 divide-y divide-slate-100"}`}>
                              {cv.crmCustomer.services.map((srv: any) => (
                                <div key={srv.crmServiceId || srv.id} className="flex justify-between items-center px-4 py-3 text-xs">
                                  <div>
                                    <p className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{srv.name}</p>
                                    <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRM Service ID: {srv.crmServiceId}</p>
                                  </div>
                                  <span className={`admin-badge ${srv.status === "ACTIVE" ? "admin-badge-active" : "admin-badge-suspended"}`}>
                                    {srv.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. Subscriptions Tab */}
                      {clientActiveTab === "subscriptions" && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <CreditCard className="w-3.5 h-3.5" />
                              Synced Subscriptions ({cv.crmCustomer?.subscriptions?.length || 0})
                            </h4>
                          </div>
                          {!cv.crmCustomer?.subscriptions || cv.crmCustomer.subscriptions.length === 0 ? (
                            <p className={`text-sm text-center py-8 border border-dashed rounded-xl ${isDark ? "text-slate-650 border-white/[0.06]" : "text-slate-400 border-slate-200"}`}>
                              No subscriptions registered for this customer in CRM.
                            </p>
                          ) : (
                            <div className={`border rounded-xl overflow-hidden ${isDark ? "border-white/[0.05] divide-y divide-white/[0.04]" : "border-slate-200 divide-y divide-slate-100"}`}>
                              {cv.crmCustomer.subscriptions.map((sub: any) => (
                                <div key={sub.crmSubscriptionId || sub.id} className="px-4 py-3.5 space-y-2">
                                  <div className="flex justify-between items-start text-xs">
                                    <div>
                                      <p className={`font-bold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{sub.planName}</p>
                                      <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRM Subscription ID: {sub.crmSubscriptionId}</p>
                                    </div>
                                    <span className={`admin-badge ${sub.status === "ACTIVE" ? "admin-badge-active" : "admin-badge-suspended"}`}>
                                      {sub.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-1">
                                    <p>Start Date: <span className="font-semibold text-slate-600 dark:text-slate-355">{new Date(sub.startDate).toLocaleDateString()}</span></p>
                                    {sub.endDate && (
                                      <p>End Date: <span className="font-semibold text-slate-600 dark:text-slate-355">{new Date(sub.endDate).toLocaleDateString()}</span></p>
                                    )}
                                  </div>
                                  {sub.services && sub.services.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] space-y-1">
                                      <p className={`text-[9px] font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                        Included Services
                                      </p>
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {sub.services.map((svc: any) => (
                                          <span
                                            key={svc.serviceId}
                                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                                              isDark 
                                                ? "bg-slate-800 text-slate-300 border border-white/[0.05]" 
                                                : "bg-slate-100 text-slate-600 border border-slate-200"
                                            }`}
                                          >
                                            {svc.serviceName}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 6. Tickets Tab */}
                      {clientActiveTab === "tickets" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Ticket className="w-3.5 h-3.5" />
                              Support Tickets ({clientTickets.length} total)
                            </h4>
                          </div>

                          {clientTickets.length === 0 ? (
                            <p className={`text-sm text-center py-8 border border-dashed rounded-xl ${isDark ? "text-slate-650 border-white/[0.06]" : "text-slate-400 border-slate-200"}`}>
                              No support tickets submitted yet.
                            </p>
                          ) : (
                            <div className={`divide-y rounded-xl border overflow-hidden ${
                              isDark ? "border-white/[0.05] divide-white/[0.04]" : "border-slate-200 divide-slate-100"
                            }`}>
                              {clientTickets
                                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                                .map(t => (
                                  <div
                                    key={t.id}
                                    onClick={() => { setActiveTab("tickets"); selectTicket(t); setSelectedClientView(null); }}
                                    className={`flex items-center gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                                      isDark ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <StatusIcon status={t.status} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{t.title}</p>
                                      <p className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                        {new Date(t.createdAt).toLocaleDateString()} · {t.category.name}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={priorityBadgeClass(t.priority)}>
                                        <PriorityIconComponent priority={t.priority} />
                                        {t.priority}
                                      </span>
                                      <ArrowUpRight className={`w-3 h-3 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      )}

                      {/* 7. SLA & Credit Hours Tab */}
                      {clientActiveTab === "sla" && (
                        <div className="space-y-6">
                          <div className={`rounded-2xl border p-5 space-y-4 ${
                            isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"
                          }`}>
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                <Coins className="w-3.5 h-3.5" />
                                Support Credits ({supportPlan})
                              </h4>
                              {!credits && (
                                <span className={`text-[10px] ${isDark ? "text-slate-600" : "text-slate-450"}`}>No credit record</span>
                              )}
                            </div>

                            {credits ? (
                              <>
                                <div className="space-y-1.5">
                                  <div className="flex justify-between text-xs">
                                    <span className={isDark ? "text-slate-500" : "text-slate-400"}>{usedH}h used of {allocH}h allocated</span>
                                    <span className={`font-semibold ${
                                      utilPct >= 90 ? "text-red-500" : utilPct >= 70 ? "text-amber-500" : isDark ? "text-emerald-400" : "text-emerald-600"
                                    }`}>{utilPct}%</span>
                                  </div>
                                  <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-white/[0.06]" : "bg-slate-200"}`}>
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        utilPct >= 90 ? "bg-red-500" : utilPct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                                      }`}
                                      style={{ width: `${utilPct}%` }}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-2.5">
                                  {[
                                    { label: "Allocated", value: allocH, unit: "hrs", color: isDark ? "text-slate-200" : "text-slate-800" },
                                    { label: "Used", value: usedH, unit: "hrs", color: isDark ? "text-amber-400" : "text-amber-600" },
                                    { label: "Remaining", value: remH, unit: "hrs", color: remH <= 0 ? "text-red-500" : isDark ? "text-emerald-400" : "text-emerald-600" },
                                    { label: "Billable", value: billH, unit: "hrs", color: billH > 0 ? "text-red-500" : isDark ? "text-slate-500" : "text-slate-400" },
                                  ].map(stat => (
                                    <div key={stat.label} className={`rounded-xl p-3 text-center border ${
                                      isDark ? "bg-white/[0.03] border-white/[0.04]" : "bg-white border-slate-100 shadow-sm"
                                    }`}>
                                      <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                                      <p className={`text-[9px] uppercase tracking-wider font-medium mt-0.5 ${isDark ? "text-slate-600" : "text-slate-400"}`}>{stat.label}</p>
                                    </div>
                                  ))}
                                </div>
                              </>
                            ) : (
                              <p className={`text-sm text-center py-2 ${isDark ? "text-slate-650" : "text-slate-400"}`}>
                                No support credits allocated yet.
                              </p>
                            )}
                          </div>

                          {/* Service-wise Credit Allocation Card */}
                          <div className={`rounded-2xl border p-5 space-y-4 ${
                            isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"
                          }`}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Layers className="w-3.5 h-3.5" />
                              Service-wise Credit Allocation
                            </h4>
                            {serviceCredits.length === 0 ? (
                              <p className={`text-xs text-center py-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                No services currently allocating credits.
                              </p>
                            ) : (
                              <div className={`border rounded-xl overflow-hidden divide-y ${
                                isDark ? "border-white/[0.05] divide-white/[0.04]" : "border-slate-200 divide-slate-100"
                              }`}>
                                {serviceCredits.map(([svcName, hrs]) => (
                                  <div key={svcName} className="flex justify-between items-center px-4 py-2.5 text-xs">
                                    <span className={`font-medium ${isDark ? "text-slate-300" : "text-slate-705"}`}>{svcName}</span>
                                    <span className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{hrs} hrs</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Active Subscriptions Card */}
                          <div className={`rounded-2xl border p-5 space-y-4 ${
                            isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"
                          }`}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <CheckCircle className="w-3.5 h-3.5" />
                              Active Subscriptions ({activeSubsList.length})
                            </h4>
                            {activeSubsList.length === 0 ? (
                              <p className={`text-xs text-center py-4 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                                No active subscriptions.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {activeSubsList.map((sub: any) => (
                                  <div
                                    key={sub.crmSubscriptionId || sub.id}
                                    className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                                      isDark ? "bg-white/[0.01] border-white/[0.04]" : "bg-white border-slate-150"
                                    }`}
                                  >
                                    <div>
                                      <p className={`font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>{sub.planName}</p>
                                      <p className={`text-[10px] mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                                        ID: {sub.crmSubscriptionId}
                                      </p>
                                    </div>
                                    <span className="admin-badge admin-badge-active">ACTIVE</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className={`rounded-2xl border p-5 space-y-3.5 ${
                            isDark ? "border-white/[0.06] bg-white/[0.02]" : "border-slate-200 bg-slate-50/50"
                          }`}>
                            <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              <Shield className="w-3.5 h-3.5" />
                              SLA Performance
                            </h4>
                            {[
                              { label: "Priority Tickets Submitted", value: clientTickets.filter(t => t.priority === "HIGH" || t.priority === "URGENT").length.toString() },
                              { label: "SLA Breaches Active", value: clientTickets.filter(t => {
                                if (t.status === "RESOLVED" || t.status === "CLOSED") return false;
                                const elapsed = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 60 * 60);
                                const limit = t.priority === "URGENT" || t.priority === "HIGH" ? 8 : t.priority === "MEDIUM" ? 24 : 72;
                                return elapsed > limit;
                              }).length.toString() + " breach(es)" },
                            ].map(row => (
                              <div key={row.label} className={`flex items-center justify-between py-2 border-b text-xs last:border-0 ${
                                isDark ? "border-white/[0.05]" : "border-slate-100"
                              }`}>
                                <span className={isDark ? "text-slate-500" : "text-slate-400"}>{row.label}</span>
                                <span className={`font-semibold ${isDark ? "text-slate-250" : "text-slate-750"}`}>{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 8. Audit History Tab */}
                      {clientActiveTab === "audit" && (
                        <div className="space-y-3">
                          <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            <FileText className="w-3.5 h-3.5" />
                            Audit History ({cv.auditLogs?.length || 0})
                          </h4>
                          {!cv.auditLogs || cv.auditLogs.length === 0 ? (
                            <p className={`text-sm text-center py-8 border border-dashed rounded-xl ${isDark ? "text-slate-650 border-white/[0.06]" : "text-slate-400 border-slate-200"}`}>
                              No audit logs available for this customer.
                            </p>
                          ) : (
                            <div className="space-y-2.5 overflow-y-auto max-h-[350px] pr-1.5">
                              {cv.auditLogs.map((log: any) => (
                                <div key={log.id} className={`p-3 rounded-xl border text-xs space-y-1 ${isDark ? "bg-white/[0.01] border-white/[0.04]" : "bg-white border-slate-100 shadow-sm"}`}>
                                  <div className="flex justify-between font-semibold">
                                    <span className={isDark ? "text-[#5fc0f9]" : "text-blue-600"}>{log.action}</span>
                                    <span className={isDark ? "text-slate-500" : "text-slate-400"}>{new Date(log.createdAt).toLocaleString()}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex justify-between">
                                    <span>Actor: {log.actorEmail || "System"}</span>
                                    <span>Entity: {log.entity}</span>
                                  </div>
                                  {log.payload && (
                                    <pre className={`text-[10px] p-2 rounded font-mono overflow-x-auto ${isDark ? "bg-slate-900 text-slate-400" : "bg-slate-50 text-slate-600"}`}>
                                      {JSON.stringify(JSON.parse(log.payload), null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>
                );
              })() : (
                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                    isDark ? "bg-white/[0.04]" : "bg-slate-100"
                  }`}>
                    <User className={`w-7 h-7 ${isDark ? "text-slate-600" : "text-slate-400"}`} />
                  </div>
                  <h3 className={`text-sm font-semibold mb-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>Select a Client</h3>
                  <p className={`text-xs max-w-xs ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                    Click on any client from the list to view their detailed profile, credits, and support history.
                  </p>
                </div>
              )}
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
                formPhone={userFormPhone} setFormPhone={setUserFormPhone}
                formCrmId={userFormCrmId} setFormCrmId={setUserFormCrmId}
                teams={teams}
                users={users}
                onClose={() => setShowCreateUser(false)}
                onSubmit={handleCreateUser}
                submitLabel="Create Client"
                submitting={submittingUser}
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
                formPhone={userFormPhone} setFormPhone={setUserFormPhone}
                formCrmId={userFormCrmId} setFormCrmId={setUserFormCrmId}
                teams={teams}
                users={users}
                editingUserId={selectedUser.id}
                onClose={() => { setShowEditUser(false); setSelectedUser(null); }}
                onSubmit={handleSaveEditUser}
                submitLabel="Save Changes"
                submitting={submittingUser}
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
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                  <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search staff..." className={`admin-input ${isDark ? "admin-dark" : ""} w-50 text-sm`} style={{ height: 40, paddingLeft: "2.25rem" }} />
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
                    {users.filter(u => u.role !== "CUSTOMER").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8"><span className={isDark ? "text-slate-500" : "text-slate-400"}>No staff found.</span></td></tr>
                    ) : users.filter(u => u.role !== "CUSTOMER").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map(u => (
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
            {showCreateUser && userFormRole !== "CUSTOMER" && (
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
                formPhone={userFormPhone} setFormPhone={setUserFormPhone}
                formCrmId={userFormCrmId} setFormCrmId={setUserFormCrmId}
                teams={teams}
                users={users}
                onClose={() => setShowCreateUser(false)}
                onSubmit={handleCreateUser}
                submitLabel="Create Staff"
                roles={rolePermissions.map(rp => rp.role)}
                submitting={submittingUser}
              />
            )}

            {/* Edit Staff Modal */}
            {showEditUser && selectedUser && selectedUser.role !== "CUSTOMER" && (
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
                formPhone={userFormPhone} setFormPhone={setUserFormPhone}
                formCrmId={userFormCrmId} setFormCrmId={setUserFormCrmId}
                teams={teams}
                users={users}
                editingUserId={selectedUser.id}
                onClose={() => { setShowEditUser(false); setSelectedUser(null); }}
                onSubmit={handleSaveEditUser}
                submitLabel="Save Changes"
                roles={rolePermissions.map(rp => rp.role)}
                submitting={submittingUser}
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
                  <button disabled={submittingKB} onClick={() => setKbEditing(false)} className={`text-sm font-medium flex items-center gap-1.5 ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"} disabled:opacity-50 disabled:cursor-not-allowed`}>
                    ← Back to list
                  </button>
                </div>

                <form onSubmit={handleSaveKB}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className={`md:col-span-2 admin-card p-5 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Article Title <span className="text-red-500">*</span></label>
                        <input type="text" required disabled={submittingKB} value={kbTitle} onChange={e => setKbTitle(e.target.value)} placeholder="e.g. How to reset your password" className={`admin-input ${isDark ? "admin-dark" : ""}`} />
                      </div>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Content (Markdown) <span className="text-red-500">*</span></label>
                        <textarea required disabled={submittingKB} value={kbContent} onChange={e => setKbContent(e.target.value)} placeholder="Write your article content here..." className={`admin-textarea font-mono ${isDark ? "admin-dark" : ""}`} style={{ minHeight: 300 }} />
                      </div>
                    </div>

                    <div className={`admin-card p-5 space-y-4 h-fit ${isDark ? "admin-dark" : ""}`}>
                      <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h3>
                      <div className="admin-form-group">
                        <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Category</label>
                        <select disabled={submittingKB} value={kbCategoryId} onChange={e => setKbCategoryId(e.target.value)} className={`admin-select ${isDark ? "admin-dark" : ""}`}>
                          <option value="">Uncategorized</option>
                          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                        </select>
                      </div>

                      <div className="space-y-3 pt-1">
                        <label className={`flex items-center gap-3 text-sm cursor-pointer ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                          <input type="checkbox" disabled={submittingKB} checked={kbIsPublished} onChange={() => setKbIsPublished(!kbIsPublished)} className="w-4 h-4 rounded accent-[#38b1f7]" />
                          Publish immediately
                        </label>
                        <label className={`flex items-center gap-3 text-sm cursor-pointer ${isDark ? "text-amber-400" : "text-amber-700"}`}>
                          <input type="checkbox" disabled={submittingKB} checked={kbIsInternal} onChange={() => setKbIsInternal(!kbIsInternal)} className="w-4 h-4 rounded accent-amber-500" />
                          Internal only (agents only)
                        </label>
                      </div>

                      <div className="pt-2">
                        <button type="submit" disabled={submittingKB} className="admin-btn admin-btn-primary w-full">
                          {submittingKB ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            kbArticleId ? "Update Article" : "Save Article"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CATEGORIES & ROUTING
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "routing" && user.role === "ADMIN" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            
            {/* Categories Pane (Left, 2/5 columns) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Support Categories</h2>
                  <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>CRUD ticket categories for clients and team routing.</p>
                </div>
              </div>

              {/* Form card */}
              <div className={`admin-card p-4 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {editingCatId ? "Edit Support Category" : "Add Support Category"}
                </h3>
                <form onSubmit={handleSaveCategory} className="space-y-3">
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required 
                      disabled={submittingCategory}
                      value={catFormName} 
                      onChange={e => setCatFormName(e.target.value)} 
                      placeholder="e.g., Domain Hosting, Google Workspace" 
                      className={`admin-input ${isDark ? "admin-dark" : ""} text-xs`}
                      style={{ height: 34 }}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Parent Category</label>
                    <select 
                      value={catFormParentId} 
                      disabled={submittingCategory}
                      onChange={e => setCatFormParentId(e.target.value)} 
                      className={`admin-select ${isDark ? "admin-dark" : ""} text-xs`}
                      style={{ height: 34 }}
                    >
                      <option value="">None (Top Level)</option>
                      {categories.filter(c => c.id !== editingCatId).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Description</label>
                    <textarea 
                      value={catFormDesc} 
                      disabled={submittingCategory}
                      onChange={e => setCatFormDesc(e.target.value)} 
                      placeholder="Covered issues details..." 
                      rows={2} 
                      className={`admin-textarea ${isDark ? "admin-dark" : ""} text-xs`}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={submittingCategory} className="admin-btn admin-btn-primary flex-1 text-xs" style={{ height: 34 }}>
                      {submittingCategory ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        editingCatId ? "Save Changes" : "Create Category"
                      )}
                    </button>
                    {editingCatId && (
                      <button 
                        type="button" 
                        disabled={submittingCategory}
                        onClick={() => { setEditingCatId(null); setCatFormName(""); setCatFormDesc(""); setCatFormParentId(""); }} 
                        className="admin-btn admin-btn-ghost text-xs"
                        style={{ height: 34 }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories Tree/List */}
              <div className={`admin-card p-4 space-y-3 ${isDark ? "admin-dark" : ""}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Active Categories
                  </h3>
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCategoryIds.length === categories.length) {
                          setSelectedCategoryIds([]);
                        } else {
                          setSelectedCategoryIds(categories.map(c => c.id));
                        }
                      }}
                      className={`text-[10px] font-semibold hover:underline ${isDark ? "text-[#38b1f7]" : "text-blue-600"}`}
                    >
                      {selectedCategoryIds.length === categories.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {/* Bulk Action Alert Bar */}
                {selectedCategoryIds.length > 0 && (
                  <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                    isDark ? "bg-red-950/20 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-700"
                  }`}>
                    <span>Selected: {selectedCategoryIds.length}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setSelectedCategoryIds([])}
                        className="underline cursor-pointer font-medium hover:opacity-80"
                      >
                        Deselect
                      </button>
                      <button 
                        type="button" 
                        onClick={handleBulkDeleteCategories}
                        className="admin-btn bg-red-600 hover:bg-red-500 text-white font-semibold text-[10px] py-1 px-2.5 rounded-lg flex items-center gap-1.5"
                        style={{ height: 26 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Selected
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                  {categories.length === 0 ? (
                    <p className={`text-xs text-center py-6 ${isDark ? "text-slate-650" : "text-slate-400"}`}>No support categories.</p>
                  ) : categories.map(cat => {
                    const hasParent = cat.parentId ? categories.find(c => c.id === cat.parentId) : null;
                    return (
                      <div 
                        key={cat.id} 
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
                          editingCatId === cat.id
                            ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]/30" : "bg-blue-50 border-blue-200"
                            : isDark ? "bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]" : "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                          <input
                            type="checkbox"
                            checked={selectedCategoryIds.includes(cat.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCategoryIds(prev => [...prev, cat.id]);
                              } else {
                                setSelectedCategoryIds(prev => prev.filter(id => id !== cat.id));
                              }
                            }}
                            className="mr-1 rounded border-slate-350 dark:border-white/[0.08] accent-[#38b1f7] cursor-pointer"
                          />
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-800"}`}>{cat.name}</p>
                            {hasParent && (
                              <p className={`text-[10px] truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>Parent: {hasParent.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => handleEditCategory(cat)} 
                            className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"}`}
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteCategory(cat.id)} 
                            className={`p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors ${isDark ? "text-slate-400 hover:text-red-400" : "text-slate-500 hover:text-red-500"}`}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Routing Rules Pane (Right, 3/5 columns) */}
            <div className="lg:col-span-3 space-y-4">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Support Ticket Routing</h2>
                <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Configure primary assignees, teams, and L2 escalation paths.</p>
              </div>

              {/* Add rule card */}
              <div className={`admin-card p-4 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Create Custom Routing Rule
                </h3>
                <form onSubmit={handleCreateRoutingRule} className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Issue Category (e.g. Category Name)</label>
                    <SearchableSelect
                      value={newRuleCategory}
                      onChange={setNewRuleCategory}
                      options={Array.from(new Set([
                        "Billing / Renewals",
                        "Critical Issues",
                        "Technical Support",
                        ...categories.map(c => c.name)
                      ]))}
                      placeholder="Search or select category..."
                      isDark={isDark}
                      disabled={submittingRoutingRule}
                    />
                  </div>
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Primary Assignee</label>
                    <select 
                      value={newRuleAssignee} 
                      disabled={submittingRoutingRule}
                      onChange={e => setNewRuleAssignee(e.target.value)} 
                      className={`admin-select ${isDark ? "admin-dark" : ""} text-xs`}
                      style={{ height: 34 }}
                    >
                      <option value="">Unassigned</option>
                      {agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Primary Support Team</label>
                    <select 
                      value={newRuleTeam} 
                      disabled={submittingRoutingRule}
                      onChange={e => setNewRuleTeam(e.target.value)} 
                      className={`admin-select ${isDark ? "admin-dark" : ""} text-xs`}
                      style={{ height: 34 }}
                    >
                      <option value="">No Team</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Secondary Assignee (L2 Manager)</label>
                    <select 
                      value={newRuleSecondary} 
                      disabled={submittingRoutingRule}
                      onChange={e => setNewRuleSecondary(e.target.value)} 
                      className={`admin-select ${isDark ? "admin-dark" : ""} text-xs`}
                      style={{ height: 34 }}
                    >
                      <option value="">None</option>
                      {agents.filter(a => a.role === "SUPPORT_L2" || a.role === "ADMIN").map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button type="submit" disabled={submittingRoutingRule} className="admin-btn admin-btn-primary px-5 text-xs" style={{ height: 34 }}>
                      {submittingRoutingRule ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5 inline" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        "Add Rule"
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Rules table */}
              <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
                <div className="overflow-x-auto">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Issue Category</th>
                        <th>Primary Assignee</th>
                        <th>Support Team</th>
                        <th>L2 Escalation</th>
                        <th className="text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routingRules.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-8"><span className={isDark ? "text-slate-500" : "text-slate-400"}>No routing rules defined.</span></td></tr>
                      ) : routingRules.map(rule => {
                        return (
                          <tr key={rule.id}>
                            <td className="font-semibold text-xs whitespace-normal max-w-[140px] truncate" title={rule.issueCategory}>
                              {rule.issueCategory}
                            </td>
                            <td>
                              <select 
                                defaultValue={rule.assigneeId || ""} 
                                id={`rule-assignee-${rule.id}`}
                                className={`admin-select text-xs ${isDark ? "admin-dark" : ""}`}
                                style={{ height: 30, width: "100%", minWidth: 120 }}
                              >
                                <option value="">Unassigned</option>
                                {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <select 
                                defaultValue={rule.teamId || ""} 
                                id={`rule-team-${rule.id}`}
                                className={`admin-select text-xs ${isDark ? "admin-dark" : ""}`}
                                style={{ height: 30, width: "100%", minWidth: 120 }}
                              >
                                <option value="">No Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </td>
                            <td>
                              <select 
                                defaultValue={rule.secondaryAssigneeId || ""} 
                                id={`rule-secondary-${rule.id}`}
                                className={`admin-select text-xs ${isDark ? "admin-dark" : ""}`}
                                style={{ height: 30, width: "100%", minWidth: 120 }}
                              >
                                <option value="">None</option>
                                {agents.filter(a => a.role === "SUPPORT_L2" || a.role === "ADMIN").map(a => (
                                  <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="text-center">
                              <div className="flex gap-1 justify-center">
                                <button 
                                  onClick={async () => {
                                    const assigneeId = (document.getElementById(`rule-assignee-${rule.id}`) as HTMLSelectElement)?.value || null;
                                    const teamId = (document.getElementById(`rule-team-${rule.id}`) as HTMLSelectElement)?.value || null;
                                    const secondaryAssigneeId = (document.getElementById(`rule-secondary-${rule.id}`) as HTMLSelectElement)?.value || null;
                                    
                                    try {
                                      const res = await fetchWithAuth(`/users/routing-rules/${rule.id}`, {
                                        method: "PATCH",
                                        body: JSON.stringify({ teamId, assigneeId, secondaryAssigneeId }),
                                      });
                                      if (res.ok) {
                                        toast.success("Routing rule saved.");
                                        refreshAllData();
                                      } else {
                                        toast.error("Failed to update rule.");
                                      }
                                    } catch {
                                      toast.error("Failed to update rule.");
                                    }
                                  }}
                                  className="admin-btn admin-btn-primary admin-btn-sm text-[11px] px-2.5 py-1"
                                  style={{ height: 28 }}
                                >
                                  Save
                                </button>
                                <button 
                                  onClick={() => handleDeleteRoutingRule(rule.id)}
                                  className={`p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors`}
                                  title="Delete Routing Rule"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: ROLE PERMISSIONS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "permissions" && user.role === "ADMIN" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Role Permissions</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Configure access control matrix for system and custom roles. Changes are saved dynamically.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="New custom role..." 
                  id="new-role-input"
                  className={`admin-input ${isDark ? "admin-dark" : ""} w-48 text-sm`} 
                  style={{ height: 40 }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (!val) return;
                      await handleCreateCustomRole(val);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />
                <button
                  onClick={async () => {
                    const input = document.getElementById("new-role-input") as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      await handleCreateCustomRole(val);
                      input.value = "";
                    }
                  }}
                  className="admin-btn admin-btn-primary"
                  style={{ height: 40 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Role
                </button>
              </div>
            </div>

            <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th className="w-[280px]">Permission Action</th>
                      {rolePermissions.map(rp => {
                        const isSystemRole = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"].includes(rp.role);
                        return (
                          <th key={rp.role} className="text-center min-w-[120px] group">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`admin-badge uppercase ${
                                rp.role === "ADMIN" ? "admin-badge-admin" : "admin-badge-agent"
                              }`}>
                                {rp.role}
                              </span>
                              {!isSystemRole && (
                                <button
                                  onClick={() => handleDeleteCustomRole(rp.role)}
                                  className="text-red-500 hover:text-red-700 hover:scale-110 active:scale-95 transition-all p-0.5 rounded cursor-pointer"
                                  title={`Delete role ${rp.role}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: "view_tickets", name: "View Tickets", desc: "Allows viewing ticket queues and tickets" },
                      { key: "reply_tickets", name: "Reply to Tickets", desc: "Allows sending replies and messages in tickets" },
                      { key: "assign_tickets", name: "Assign Tickets", desc: "Allows assigning teams or agents to support tickets" },
                      { key: "manage_teams", name: "Manage Teams", desc: "Allows creating, updating and deleting agent groups" },
                      { key: "manage_kb", name: "Manage KB", desc: "Allows creating/editing knowledge base articles" },
                      { key: "adjust_credits", name: "Adjust Client Credits", desc: "Allows adjusting support credit hours" },
                      { key: "manage_categories_rules", name: "Manage Categories & Rules", desc: "Allows CRUD on ticket categories & routing rules" },
                      { key: "manage_permissions", name: "Manage Permissions", desc: "Allows configuring role permissions and staff" },
                    ].map(perm => (
                      <tr key={perm.key} className={isDark ? "hover:bg-white/[0.01]" : "hover:bg-slate-50"}>
                        <td>
                          <p className={`font-semibold text-sm ${isDark ? "text-slate-200" : "text-slate-800"}`}>{perm.name}</p>
                          <p className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{perm.desc}</p>
                        </td>
                        {rolePermissions.map(rp => {
                          const hasPerm = rp.permissions.includes(perm.key);
                          const isSaving = savingPermissionsRole === rp.role;
                          return (
                            <td key={rp.role} className="text-center">
                              <input 
                                type="checkbox"
                                checked={hasPerm}
                                disabled={isSaving || (rp.role === "ADMIN" && perm.key === "manage_permissions")}
                                onChange={(e) => handleTogglePermission(rp.role, perm.key, e.target.checked)}
                                className={`rounded w-4 h-4 cursor-pointer accent-[#38b1f7] disabled:opacity-40`}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: CLIENT CREDITS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "credits" && user.role === "ADMIN" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Service Credit Hours</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Manage support credits and billing hours for customer accounts.</p>
              </div>
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <input 
                  type="text" 
                  value={userSearch} 
                  onChange={e => setUserSearch(e.target.value)} 
                  placeholder="Search customer credits..." 
                  className={`admin-input ${isDark ? "admin-dark" : ""} w-64 text-sm`} 
                  style={{ height: 38, paddingLeft: "2.25rem" }} 
                />
              </div>
            </div>

            {(() => {
              const allCustomerUsers = users.filter(u => u.role === "CUSTOMER").filter(u => !userSearch.trim() || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()));
              const totalCreditsPages = Math.ceil(allCustomerUsers.length / creditsPageSize) || 1;
              const paginatedCreditUsers = allCustomerUsers.slice((creditsCurrentPage - 1) * creditsPageSize, creditsCurrentPage * creditsPageSize);

              return (
                <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Customer Name</th>
                          <th>Email</th>
                          <th>Allocated Credit</th>
                          <th>Used Credits</th>
                          <th>Remaining Credits</th>
                          <th>Billable Credits</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allCustomerUsers.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-8"><span className={isDark ? "text-slate-500" : "text-slate-400"}>No customers found.</span></td></tr>
                        ) : paginatedCreditUsers.map(u => (
                          <tr key={u.id}>
                            <td><span className={`font-semibold text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>{u.name}</span></td>
                            <td><span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>{u.email}</span></td>
                            <td><span className="font-semibold">{u.customerCredits?.allocatedHours ?? 20} hrs</span></td>
                            <td><span className="text-amber-500 font-semibold">{u.customerCredits?.usedHours ?? 0} hrs</span></td>
                            <td><span className="text-green-500 font-semibold">{u.customerCredits?.remainingHours ?? 20} hrs</span></td>
                            <td><span className="text-red-500 font-semibold">{u.customerCredits?.billableHours ?? 0} hrs</span></td>
                            <td className="text-center">
                              <button 
                                onClick={() => {
                                  setCreditsEditingUser(u);
                                  setCreditsAllocated(u.customerCredits?.allocatedHours ?? 20);
                                  setCreditsDescription("");
                                }}
                                className="admin-btn admin-btn-secondary admin-btn-sm"
                              >
                                Adjust Credits
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <PaginationControls
                    currentPage={creditsCurrentPage}
                    totalPages={totalCreditsPages}
                    totalItems={allCustomerUsers.length}
                    pageSize={creditsPageSize}
                    onPageChange={setCreditsCurrentPage}
                    onPageSizeChange={setCreditsPageSize}
                    isDark={isDark}
                    itemLabel="customer accounts"
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB: SLA MANAGEMENT & METRICS
        ══════════════════════════════════════════════════════════ */}
        {activeTab === "sla" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <h2 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>SLA Management & Analytics</h2>
                <p className={`text-sm mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Configure response/resolution policies and monitor compliance metrics.</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sub-tab navigation */}
                <div className={`flex items-center p-1 rounded-xl border ${isDark ? "bg-white/[0.04] border-white/[0.08]" : "bg-slate-100 border-slate-200"}`}>
                  <button
                    onClick={() => setSlaSubTab("policies")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      slaSubTab === "policies"
                        ? isDark ? "bg-[#38b1f7] text-white shadow-md" : "bg-white text-slate-900 shadow-sm"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    SLA Policies ({slaPolicies.length})
                  </button>
                  <button
                    onClick={() => setSlaSubTab("metrics")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      slaSubTab === "metrics"
                        ? isDark ? "bg-[#38b1f7] text-white shadow-md" : "bg-white text-slate-900 shadow-sm"
                        : isDark ? "text-slate-400 hover:text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Analytics & Compliance
                  </button>
                </div>

                {user.role === "ADMIN" && (
                  <button
                    onClick={openSlaModalForCreate}
                    className="admin-btn admin-btn-primary text-xs"
                    style={{ height: 36 }}
                  >
                    <Plus className="w-4 h-4" />
                    Create SLA Policy
                  </button>
                )}
              </div>
            </div>

            {/* Sub-Tab 1: SLA Policies CRUD Table */}
            {slaSubTab === "policies" && (
              <div className="space-y-4">
                <div className={`admin-card overflow-hidden ${isDark ? "admin-dark" : ""}`}>
                  <div className="overflow-x-auto">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Policy Name</th>
                          <th>Priority Tier</th>
                          <th>First Response Target</th>
                          <th>Resolution Target</th>
                          <th>Status</th>
                          <th className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {slaPolicies.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12">
                              <div className="flex flex-col items-center justify-center space-y-3">
                                <Clock className={`w-8 h-8 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                                <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>No SLA Policies defined yet.</p>
                                {user.role === "ADMIN" && (
                                  <button onClick={openSlaModalForCreate} className="admin-btn admin-btn-primary text-xs">
                                    <Plus className="w-3.5 h-3.5 mr-1 inline" />
                                    Create First Policy
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          slaPolicies.map((p) => {
                            const priorityBadge =
                              p.priority === "URGENT"
                                ? "admin-badge-urgent"
                                : p.priority === "HIGH"
                                ? "admin-badge-high"
                                : p.priority === "MEDIUM"
                                ? "admin-badge-medium"
                                : p.priority === "LOW"
                                ? "admin-badge-low"
                                : "admin-badge-open";

                            return (
                              <tr key={p.id} className={isDark ? "hover:bg-white/[0.01]" : "hover:bg-slate-50/50"}>
                                <td>
                                  <span className={`font-bold text-sm ${isDark ? "text-slate-100" : "text-slate-900"}`}>{p.name}</span>
                                </td>
                                <td>
                                  <span className={`admin-badge uppercase ${priorityBadge}`}>{p.priority}</span>
                                </td>
                                <td>
                                  <span className="font-medium text-xs">
                                    {p.firstResponseHours >= 1 ? `${p.firstResponseHours} hr${p.firstResponseHours > 1 ? "s" : ""}` : `${p.firstResponseHours * 60} mins`}
                                  </span>
                                </td>
                                <td>
                                  <span className="font-medium text-xs">
                                    {p.resolutionHours >= 1 ? `${p.resolutionHours} hr${p.resolutionHours > 1 ? "s" : ""}` : `${p.resolutionHours * 60} mins`}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    onClick={() => handleToggleSlaPolicy(p)}
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                      p.isActive
                                        ? isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                        : isDark ? "bg-slate-800 border-slate-700 text-slate-500" : "bg-slate-100 border-slate-200 text-slate-500"
                                    }`}
                                  >
                                    {p.isActive ? "● Active" : "○ Inactive"}
                                  </button>
                                </td>
                                <td className="text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => openSlaModalForEdit(p)}
                                      className={`p-1.5 rounded transition-all ${
                                        isDark ? "hover:bg-white/[0.08] text-slate-400 hover:text-white" : "hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                                      }`}
                                      title="Edit Policy"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    {user.role === "ADMIN" && (
                                      <button
                                        onClick={() => handleDeleteSlaPolicy(p.id, p.name)}
                                        className="p-1.5 rounded transition-all hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500"
                                        title="Delete Policy"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-Tab 2: SLA Analytics & Compliance */}
            {slaSubTab === "metrics" && (() => {
              const resolvedTickets = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED");
              const respondedTickets = tickets.filter(t => t.firstResponseAt);

              let avgFrt = 0;
              if (respondedTickets.length > 0) {
                const sum = respondedTickets.reduce((acc, t) => {
                  const created = new Date(t.createdAt).getTime();
                  const responded = new Date(t.firstResponseAt!).getTime();
                  return acc + (responded - created) / (1000 * 60 * 60);
                }, 0);
                avgFrt = Math.round((sum / respondedTickets.length) * 10) / 10;
              }

              let avgTtr = 0;
              const resolvedWithTtr = resolvedTickets.filter(t => t.ttrHours !== null && t.ttrHours !== undefined);
              if (resolvedWithTtr.length > 0) {
                const sum = resolvedWithTtr.reduce((acc, t) => acc + t.ttrHours!, 0);
                avgTtr = Math.round((sum / resolvedWithTtr.length) * 10) / 10;
              }

              let responseBreaches = 0;
              let resolutionBreaches = 0;
              tickets.forEach(t => {
                const created = new Date(t.createdAt).getTime();
                
                // Response breach
                if (t.firstResponseAt) {
                  const responded = new Date(t.firstResponseAt).getTime();
                  const responseDuration = (responded - created) / (1000 * 60 * 60);
                  if (t.priority === "HIGH" || t.priority === "URGENT") {
                    if (responseDuration > 2) responseBreaches++;
                  } else if (t.priority === "MEDIUM") {
                    if (responseDuration > 8) responseBreaches++;
                  } else if (t.priority === "LOW") {
                    if (responseDuration > 24) responseBreaches++;
                  }
                } else {
                  const duration = (Date.now() - created) / (1000 * 60 * 60);
                  if (t.priority === "HIGH" || t.priority === "URGENT") {
                    if (duration > 2) responseBreaches++;
                  } else if (t.priority === "MEDIUM") {
                    if (duration > 8) responseBreaches++;
                  } else if (t.priority === "LOW") {
                    if (duration > 24) responseBreaches++;
                  }
                }

                // Resolution breach
                if (t.ttrHours !== null && t.ttrHours !== undefined) {
                  if (t.priority === "HIGH" || t.priority === "URGENT") {
                    if (t.ttrHours > 8) resolutionBreaches++;
                  } else if (t.priority === "MEDIUM") {
                    if (t.ttrHours > 24) resolutionBreaches++;
                  } else if (t.priority === "LOW") {
                    if (t.ttrHours > 72) resolutionBreaches++;
                  }
                } else if (t.status !== "RESOLVED" && t.status !== "CLOSED") {
                  const duration = (Date.now() - created) / (1000 * 60 * 60);
                  if (t.priority === "HIGH" || t.priority === "URGENT") {
                    if (duration > 8) resolutionBreaches++;
                  } else if (t.priority === "MEDIUM") {
                    if (duration > 24) resolutionBreaches++;
                  } else if (t.priority === "LOW") {
                    if (duration > 72) resolutionBreaches++;
                  }
                }
              });

              const totalBreaches = responseBreaches + resolutionBreaches;
              const compliancePct = tickets.length > 0 ? Math.max(0, Math.round(((tickets.length - totalBreaches) / tickets.length) * 100)) : 100;

              return (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className={`admin-card p-5 ${isDark ? "admin-dark" : ""}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Overall Compliance</p>
                      <p className={`text-3xl font-extrabold ${compliancePct >= 90 ? "text-emerald-500" : compliancePct >= 75 ? "text-amber-500" : "text-red-500"}`}>
                        {compliancePct}%
                      </p>
                      <p className={`text-[10px] mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Target SLA compliance rate</p>
                    </div>
                    <div className={`admin-card p-5 ${isDark ? "admin-dark" : ""}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Avg Response Time</p>
                      <p className="text-3xl font-extrabold text-[#38b1f7]">{avgFrt} hrs</p>
                      <p className={`text-[10px] mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>First response target metric</p>
                    </div>
                    <div className={`admin-card p-5 ${isDark ? "admin-dark" : ""}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Avg Resolution (TTR)</p>
                      <p className="text-3xl font-extrabold text-emerald-500">{avgTtr} hrs</p>
                      <p className={`text-[10px] mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Based on {resolvedTickets.length} resolved tickets</p>
                    </div>
                    <div className={`admin-card p-5 ${isDark ? "admin-dark" : ""}`}>
                      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Total Breaches</p>
                      <p className="text-3xl font-extrabold text-red-500">{totalBreaches}</p>
                      <p className={`text-[10px] mt-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>{responseBreaches} response / {resolutionBreaches} resolution</p>
                    </div>
                  </div>

                  <div className={`admin-card p-6 space-y-4 ${isDark ? "admin-dark" : ""}`}>
                    <h3 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Active SLA Policy Targets</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {slaPolicies.filter(p => p.isActive).map(policy => (
                        <div key={policy.id} className={`p-4 border rounded-xl ${
                          policy.priority === "URGENT" || policy.priority === "HIGH"
                            ? isDark ? "bg-[#38b1f7]/5 border-[#38b1f7]/15" : "bg-blue-50 border-blue-100"
                            : policy.priority === "MEDIUM"
                            ? isDark ? "bg-amber-500/5 border-amber-500/15" : "bg-amber-50 border-amber-100"
                            : isDark ? "bg-slate-500/5 border-slate-500/15" : "bg-slate-50 border-slate-200"
                        }`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold">{policy.name}</p>
                            <span className="admin-badge uppercase text-[9px]">{policy.priority}</span>
                          </div>
                          <p className="mt-2 text-slate-500 dark:text-slate-400">First Response: <span className="font-bold text-slate-800 dark:text-slate-200">{policy.firstResponseHours}h</span></p>
                          <p className="text-slate-500 dark:text-slate-400">Resolution Target: <span className="font-bold text-slate-800 dark:text-slate-200">{policy.resolutionHours}h</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {showSlaModal && (
          <SlaPolicyModal
            isDark={isDark}
            editingPolicy={editingSlaPolicy}
            name={slaFormName}
            setName={setSlaFormName}
            priority={slaFormPriority}
            setPriority={setSlaFormPriority}
            firstResponseHours={slaFormFirstResponse}
            setFirstResponseHours={setSlaFormFirstResponse}
            resolutionHours={slaFormResolution}
            setResolutionHours={setSlaFormResolution}
            isActive={slaFormIsActive}
            setIsActive={setSlaFormIsActive}
            submitting={submittingSla}
            onClose={() => setShowSlaModal(false)}
            onSubmit={handleSaveSlaPolicy}
          />
        )}

        {creditsEditingUser && (
          <AdjustCreditsModal
            user={creditsEditingUser}
            allocated={creditsAllocated}
            description={creditsDescription}
            isDark={isDark}
            onClose={() => setCreditsEditingUser(null)}
            onAllocatedChange={setCreditsAllocated}
            onDescriptionChange={setCreditsDescription}
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetchWithAuth(`/users/${creditsEditingUser.id}/credits`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    allocatedHours: creditsAllocated,
                    description: creditsDescription || undefined
                  }),
                });
                if (res.ok) {
                  toast.success("Credits adjusted successfully.");
                  setCreditsEditingUser(null);
                  refreshAllData();
                } else {
                  toast.error("Failed to adjust credits.");
                }
              } catch {
                toast.error("Failed to adjust credits.");
              }
            }}
          />
        )}

        {showResolveModal && selectedTicket && (
          <ResolveTicketModal
            ticket={selectedTicket}
            customerUser={users.find(u => u.id === selectedTicket.customer.id)}
            hours={resolveTicketHours}
            notes={resolveTicketNotes}
            isDark={isDark}
            onClose={() => {
              setShowResolveModal(false);
              setPendingStatusChange(null);
            }}
            onHoursChange={setResolveTicketHours}
            onNotesChange={setResolveTicketNotes}
            onSubmit={handleResolveSubmit}
            submitting={submittingResolve}
          />
        )}

        {showEscalateModal && selectedTicket && (
          <EscalateTicketModal
            ticket={selectedTicket}
            isDark={isDark}
            onClose={() => setShowEscalateModal(false)}
            onSubmit={async (reason) => {
              await updateTicketDetails({ isEscalated: true, escalationReason: reason });
              setShowEscalateModal(false);
            }}
          />
        )}
      </div>
    </AdminShell>
  );
}

interface EscalateTicketModalProps {
  ticket: any;
  isDark: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

function EscalateTicketModal({ ticket, isDark, onClose, onSubmit }: EscalateTicketModalProps) {
  const [reason, setReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(reason);
  };

  return (
    <div className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal w-full max-w-[460px]">
        <div className="flex items-start justify-between mb-5 border-b pb-4 dark:border-white/[0.06] border-slate-100">
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Escalate Support Ticket</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ticket: #{ticket.id.slice(0, 8)} — {ticket.title}</p>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg mt-0.5 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Escalation Reason</label>
            <textarea
              required
              rows={4}
              placeholder="Provide a reason for escalating this ticket (e.g. Critical outage requiring L2 manager assistance)..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className={`admin-textarea ${isDark ? "admin-dark" : ""} w-full text-xs p-3 rounded-lg border`}
              style={{ minHeight: 100 }}
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t dark:border-white/[0.06] border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-xs font-semibold ${isDark ? "bg-slate-800 text-slate-350 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn-primary px-4 py-2 text-xs"
            >
              Confirm Escalation
            </button>
          </div>
        </form>
      </div>
    </div>
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

interface AdjustCreditsModalProps {
  user: UserProfile;
  allocated: number;
  description: string;
  isDark: boolean;
  onClose: () => void;
  onAllocatedChange: (v: number) => void;
  onDescriptionChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function AdjustCreditsModal({
  user, allocated, description, isDark, onClose, onAllocatedChange, onDescriptionChange, onSubmit
}: AdjustCreditsModalProps) {
  const currentAllocated = user.customerCredits?.allocatedHours ?? 20;
  const currentUsed = user.customerCredits?.usedHours ?? 0;
  const diff = allocated - currentAllocated;
  const previewRemaining = Math.max(0, allocated - currentUsed);
  const previewBillable = Math.max(0, currentUsed - allocated);

  return (
    <div className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal w-full max-w-[460px]">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Adjust Support Credits</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Account: {user.name} ({user.email})</p>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg mt-0.5 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border text-xs bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05]">
            <div>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>Current Allocation</p>
              <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{currentAllocated} hrs</p>
            </div>
            <div>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>Used to Date</p>
              <p className={`text-sm font-bold mt-0.5 ${isDark ? "text-slate-200" : "text-slate-800"}`}>{currentUsed} hrs</p>
            </div>
          </div>

          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>New Allocated Hours</label>
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                required 
                min={0}
                step={0.5}
                value={allocated} 
                onChange={e => onAllocatedChange(parseFloat(e.target.value) || 0)} 
                className={`admin-input ${isDark ? "admin-dark" : ""} flex-1`} 
                style={{ height: 38 }}
              />
              <span className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${
                diff > 0 
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-500/20" 
                  : diff < 0 
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-500/20" 
                    : isDark ? "bg-white/[0.05] text-slate-400 border-white/[0.06]" : "bg-slate-100 text-slate-600 border-slate-200"
              }`}>
                {diff > 0 ? `+${diff}` : diff} hrs
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border text-xs bg-blue-50/40 dark:bg-[#38b1f7]/5 border-blue-100 dark:border-[#38b1f7]/10">
            <div>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>New Remaining Balance</p>
              <p className="text-sm font-bold mt-0.5 text-green-500">{previewRemaining} hrs</p>
            </div>
            <div>
              <p className={isDark ? "text-slate-400" : "text-slate-500"}>New Billable Overage</p>
              <p className="text-sm font-bold mt-0.5 text-red-500">{previewBillable} hrs</p>
            </div>
          </div>

          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Adjustment Reason / Description <span className="text-red-500">*</span></label>
            <textarea 
              required
              value={description} 
              onChange={e => onDescriptionChange(e.target.value)} 
              placeholder="e.g. Added 10 hours for enterprise tier upgrade support..." 
              rows={2} 
              className={`admin-textarea ${isDark ? "admin-dark" : ""} text-xs`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost text-xs" style={{ height: 36 }}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary text-xs" style={{ height: 36 }}>Apply Adjustment</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const COUNTRIES = [
  { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
  { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
  { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
  { name: "India", code: "IN", dialCode: "+91", flag: "🇮🇳" },
  { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
  { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
  { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
  { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
  { name: "Saudi Arabia", code: "SA", dialCode: "+966", flag: "🇸🇦" },
  { name: "Singapore", code: "SG", dialCode: "+65", flag: "🇸🇬" },
  { name: "Qatar", code: "QA", dialCode: "+974", flag: "🇶🇦" },
  { name: "Kuwait", code: "KW", dialCode: "+965", flag: "🇰🇼" },
  { name: "Oman", code: "OM", dialCode: "+968", flag: "🇴🇲" },
  { name: "Bahrain", code: "BH", dialCode: "+973", flag: "🇧🇭" },
  { name: "New Zealand", code: "NZ", dialCode: "+64", flag: "🇳🇿" },
  { name: "Japan", code: "JP", dialCode: "+81", flag: "🇯🇵" },
  { name: "China", code: "CN", dialCode: "+86", flag: "🇨🇳" },
  { name: "Brazil", code: "BR", dialCode: "+55", flag: "🇧🇷" },
  { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
  { name: "Malaysia", code: "MY", dialCode: "+60", flag: "🇲🇾" },
  { name: "Indonesia", code: "ID", dialCode: "+62", flag: "🇮🇩" },
  { name: "Philippines", code: "PH", dialCode: "+63", flag: "🇵🇭" },
  { name: "Pakistan", code: "PK", dialCode: "+92", flag: "🇵🇰" },
  { name: "Bangladesh", code: "BD", dialCode: "+880", flag: "🇧🇩" },
  { name: "Sri Lanka", code: "LK", dialCode: "+94", flag: "🇱🇰" },
  { name: "Nepal", code: "NP", dialCode: "+977", flag: "🇳🇵" },
  { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
  { name: "Turkey", code: "TR", dialCode: "+90", flag: "🇹🇷" },
  { name: "Spain", code: "ES", dialCode: "+34", flag: "🇪🇸" },
  { name: "Italy", code: "IT", dialCode: "+39", flag: "🇮🇹" },
  { name: "Netherlands", code: "NL", dialCode: "+31", flag: "🇳🇱" },
  { name: "Switzerland", code: "CH", dialCode: "+41", flag: "🇨🇭" },
  { name: "Sweden", code: "SE", dialCode: "+46", flag: "🇸🇪" },
  { name: "Norway", code: "NO", dialCode: "+47", flag: "🇳🇴" },
  { name: "Ireland", code: "IE", dialCode: "+353", flag: "🇮🇪" },
];

// Shared User Create/Edit Modal
interface UserModalProps {
  title: string; subtitle: string; isDark: boolean;
  showRole: boolean; showTeams: boolean; showStatusToggle: boolean;
  formName: string; setFormName: (v: string) => void;
  formEmail: string; setFormEmail: (v: string) => void;
  formPassword: string; setFormPassword: (v: string) => void;
  formRole: string; setFormRole: (v: any) => void;
  formIsActive: boolean; setFormIsActive: (v: boolean) => void;
  formTeams: string[]; setFormTeams: (v: string[]) => void;
  formPhone: string; setFormPhone: (v: string) => void;
  formCrmId: string; setFormCrmId: (v: string) => void;
  teams: { id: string; name: string }[];
  users: UserProfile[];
  editingUserId?: string;
  onClose: () => void; onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  roles?: string[];
  submitting?: boolean;
}

function UserModal({
  title, subtitle, isDark, showRole, showTeams, showStatusToggle,
  formName, setFormName, formEmail, setFormEmail, formPassword, setFormPassword,
  formRole, setFormRole, formIsActive, setFormIsActive, formTeams, setFormTeams,
  formPhone, setFormPhone, formCrmId, setFormCrmId,
  teams, users = [], editingUserId, onClose, onSubmit, submitLabel,
  roles = [], submitting = false
}: UserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [crmSearch, setCrmSearch] = useState("");
  const [crmResults, setCrmResults] = useState<any[]>([]);
  const [searchingCrm, setSearchingCrm] = useState(false);
  const [showCrmDropdown, setShowCrmDropdown] = useState(false);
  const [linkedCompany, setLinkedCompany] = useState("");
  const [allCrmCustomers, setAllCrmCustomers] = useState<any[]>([]);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const fetchAllCrmCustomers = async () => {
    if (formRole !== "CUSTOMER" || showStatusToggle) return;
    setSearchingCrm(true);
    try {
      const res = await fetchWithAuth("/users/crm-customers?limit=1000");
      if (res.ok) {
        const payload = await res.json();
        const list = payload.data?.customers || [];
        setAllCrmCustomers(list);
        setCrmResults(list);
      }
    } catch (err) {
      console.error("Error fetching CRM customers:", err);
    } finally {
      setSearchingCrm(false);
    }
  };

  // Load all CRM customers once
  useEffect(() => {
    fetchAllCrmCustomers();
  }, [formRole, showStatusToggle]);

  // Client-side filtering of the CRM customers
  useEffect(() => {
    if (formRole !== "CUSTOMER" || showStatusToggle) return;
    if (!crmSearch.trim()) {
      setCrmResults(allCrmCustomers);
      return;
    }
    const query = crmSearch.toLowerCase();
    const filtered = allCrmCustomers.filter(cust => {
      return (
        (cust.displayName && cust.displayName.toLowerCase().includes(query)) ||
        (cust.primaryEmail && cust.primaryEmail.toLowerCase().includes(query)) ||
        (cust.companyName && cust.companyName.toLowerCase().includes(query)) ||
        (cust.primaryPhone && cust.primaryPhone.toLowerCase().includes(query)) ||
        (cust.customerId && cust.customerId.toLowerCase().includes(query))
      );
    });
    setCrmResults(filtered);
  }, [crmSearch, allCrmCustomers, formRole, showStatusToggle]);

  const existingUser = users.find(u => {
    if (editingUserId && u.id === editingUserId) return false;
    const crmMatch = u.crmCustomerId && formCrmId && u.crmCustomerId === formCrmId;
    const emailMatch = u.email && formEmail && u.email.toLowerCase() === formEmail.toLowerCase();
    return crmMatch || emailMatch;
  });
  const accountExists = !!existingUser;

  // Helper to parse phone number into dial code and national number
  const parsePhone = (phone: string) => {
    if (!phone) return { dialCode: "+91", nationalNumber: "" };
    const cleanPhone = phone.trim();
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (cleanPhone.startsWith(c.dialCode)) {
        return { dialCode: c.dialCode, nationalNumber: cleanPhone.slice(c.dialCode.length).trim() };
      }
      const cleanDial = c.dialCode.replace("+", "");
      if (cleanPhone.startsWith(cleanDial)) {
        return { dialCode: c.dialCode, nationalNumber: cleanPhone.slice(cleanDial.length).trim() };
      }
    }
    if (cleanPhone.startsWith("+")) {
      const spaceIdx = cleanPhone.indexOf(" ");
      if (spaceIdx > 0) {
        return { dialCode: cleanPhone.slice(0, spaceIdx), nationalNumber: cleanPhone.slice(spaceIdx).trim() };
      }
      return { dialCode: cleanPhone.slice(0, 4), nationalNumber: cleanPhone.slice(4).trim() };
    }
    return { dialCode: "+91", nationalNumber: cleanPhone };
  };

  const initialParsed = React.useMemo(() => parsePhone(formPhone), [formPhone]);

  const [dialPart, setDialPart] = useState(initialParsed.dialCode);
  const [localPart, setLocalPart] = useState(initialParsed.nationalNumber);

  useEffect(() => {
    const parsed = parsePhone(formPhone);
    const combined = (dialPart + localPart).replace(/\s+/g, "");
    const cleanFormPhone = formPhone.replace(/\s+/g, "");
    if (cleanFormPhone !== combined) {
      setDialPart(parsed.dialCode);
      setLocalPart(parsed.nationalNumber);
    }
  }, [formPhone]);

  const getCountryFromDialCode = (dial: string) => {
    if (!dial) return null;
    const cleanDial = dial.trim();
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (cleanDial === c.dialCode || cleanDial === c.dialCode.replace("+", "")) return c;
    }
    return null;
  };

  const selectedCountry = getCountryFromDialCode(dialPart) || { name: "", code: "", dialCode: dialPart, flag: "🌐" };

  const handleSelectCountry = (country: typeof COUNTRIES[0]) => {
    setDialPart(country.dialCode);
    setFormPhone(country.dialCode + " " + localPart.trim());
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  return (
    <div className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`admin-modal w-full ${formRole === "CUSTOMER" && !showStatusToggle ? "!max-w-[1000px] !p-8" : "!max-w-[560px]"} admin-fade-in ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-2xl overflow-hidden`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
            <p className={`text-xs mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className={`p-1.5 rounded-lg mt-0.5 transition-all hover:rotate-90 hover:scale-105 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
            {/* LEFT COLUMN: CRM LINK PANEL (Only for CUSTOMER creation) */}
            {formRole === "CUSTOMER" && !showStatusToggle && (
              <div className={`md:col-span-4 flex flex-col justify-between p-5 rounded-xl border min-h-[390px] transition-all duration-300 ${
                isDark 
                  ? "bg-slate-955/20 border-slate-800/80" 
                  : "bg-slate-50/50 border-slate-100"
              }`}>
                {!formCrmId ? (
                  /* SEARCH & LINK STATE */
                  <div className="space-y-4 flex-1 flex flex-col justify-start">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"} block`}>
                          CRM Integration
                        </label>
                        <button
                          type="button"
                          onClick={fetchAllCrmCustomers}
                          disabled={searchingCrm}
                          className={`p-1 rounded transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-white ${searchingCrm ? "animate-spin" : ""}`}
                          title="Refresh CRM Records"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal mb-3">
                        Search to link an external customer profile and auto-fill details.
                      </p>
                      <div className="relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                        <input
                          type="text"
                          value={crmSearch}
                          onChange={(e) => {
                            setCrmSearch(e.target.value);
                            setShowCrmDropdown(true);
                          }}
                          onFocus={() => setShowCrmDropdown(true)}
                          placeholder="Search by company, name, email..."
                          className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 h-11 text-sm border-slate-200 dark:border-slate-800 focus:border-[#38b1f7] rounded-lg w-full`}
                        />
                        {searchingCrm && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                            <span className="animate-pulse text-[10px] text-slate-400 font-medium">Searching...</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Inline Results List (Intuitive selection list inside the left panel) */}
                    <div className={`flex-1 min-h-[200px] overflow-y-auto max-h-[250px] scrollbar-hide border rounded-lg p-1 transition-all ${
                      isDark ? "border-slate-800/50 bg-slate-950/40" : "border-slate-200/55 bg-white/40"
                    }`}>
                      {crmResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-[11px] text-slate-400 text-center">
                          {searchingCrm ? "Searching records..." : "No CRM records found"}
                        </div>
                      ) : (
                        crmResults.map((cust) => {
                          const isAlreadyImported = users.some(u => 
                            (u.crmCustomerId && u.crmCustomerId === cust.customerId) || 
                            (u.email && cust.primaryEmail && u.email.toLowerCase() === cust.primaryEmail.toLowerCase())
                          );

                          return (
                            <div
                              key={cust.customerId}
                              onClick={() => {
                                if (isAlreadyImported) return;
                                setFormName(cust.displayName || "");
                                setFormEmail(cust.primaryEmail || "");
                                setFormPhone(cust.primaryPhone || "");
                                setFormCrmId(cust.customerId || "");
                                setCrmSearch(cust.displayName || "");
                                setLinkedCompany(cust.companyName || "");
                                setShowCrmDropdown(false);
                              }}
                              className={`p-2.5 text-xs border-b last:border-b-0 transition-all text-left flex items-start gap-2.5 rounded-lg ${
                                isAlreadyImported 
                                  ? "opacity-50 cursor-not-allowed select-none bg-slate-100/20 dark:bg-slate-950/20" 
                                  : "cursor-pointer"
                              } ${
                                isDark 
                                  ? "border-slate-900/60 hover:bg-slate-800/50" 
                                  : "border-slate-100 hover:bg-slate-100/60"
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                                isDark ? "bg-slate-800 text-[#38b1f7]" : "bg-sky-50 text-[#0d9fea]"
                              }`}>
                                {(cust.displayName || "C").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <div className={`font-semibold truncate ${isDark ? "text-slate-300" : "text-slate-700"}`}>{cust.displayName}</div>
                                  {isAlreadyImported && (
                                    <span className="text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-450 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/40 shrink-0">
                                      Imported
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-450 dark:text-slate-550 truncate">
                                  {cust.primaryEmail}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  /* LINKED PROFILE CARD STATE */
                  <div className="space-y-4 flex-1 flex flex-col justify-between animate-fade-in">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                          CRM Integration
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/55 text-[10px] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                          Connected
                        </div>
                      </div>

                      <div className={`p-5 rounded-xl border flex flex-col items-center text-center shadow-sm ${
                        isDark ? "bg-slate-955/60 border-slate-800" : "bg-white border-slate-200"
                      }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 text-xl font-black tracking-wide ${
                          isDark ? "bg-slate-800/80 text-[#38b1f7]" : "bg-sky-50 text-[#0d9fea]"
                        }`}>
                          {(formName || "C").charAt(0).toUpperCase()}
                        </div>
                        <h4 className={`text-sm font-bold truncate max-w-full ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                          {formName}
                        </h4>
                        <p className="text-[11px] text-slate-400 dark:text-slate-550 truncate max-w-full mt-0.5">
                          {formEmail}
                        </p>
                        {linkedCompany && (
                          <div className={`mt-2.5 px-2.5 py-0.5 text-[10px] rounded font-medium ${
                            isDark ? "bg-slate-800/60 text-slate-350" : "bg-slate-100 text-slate-600"
                          }`}>
                            {linkedCompany}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="text-[10px] text-slate-450 dark:text-slate-550 text-center leading-normal">
                        Linking auto-fills the primary fields. Click below to disconnect.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormName("");
                          setFormEmail("");
                          setFormPhone("");
                          setFormCrmId("");
                          setCrmSearch("");
                          setLinkedCompany("");
                        }}
                        className={`w-full py-2 text-xs font-semibold rounded-lg border transition-all ${
                          isDark 
                            ? "border-red-955/50 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300" 
                            : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                        }`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* RIGHT COLUMN: PRIMARY FORM FIELDS */}
            <div className={`${formRole === "CUSTOMER" && !showStatusToggle ? "md:col-span-8" : "md:col-span-12"} space-y-4`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="admin-form-group">
                  <label className={`admin-form-label flex items-center gap-1.5 ${isDark ? "admin-dark" : ""}`}>
                    Full Name <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="Alex Carter"
                      className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800/80 transition-all ${
                        formCrmId ? "border-sky-300 dark:border-sky-800/80 bg-sky-50/[0.02]" : ""
                      }`}
                    />
                    {formCrmId && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider pointer-events-none">CRM</span>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div className="admin-form-group">
                  <label className={`admin-form-label flex items-center gap-1.5 ${isDark ? "admin-dark" : ""}`}>
                    Email Address <span className="text-red-500 font-bold">*</span>
                  </label>
                  <div className="relative">
                    <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800/80 transition-all ${
                        formCrmId ? "border-sky-300 dark:border-sky-800/80 bg-sky-50/[0.02]" : ""
                      }`}
                    />
                    {formCrmId && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider pointer-events-none">CRM</span>
                    )}
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="admin-form-group">
                  <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Mobile Number</label>
                  <div className="flex gap-2">
                    {/* Country Selector Dropdown / Input Container */}
                    <div className="relative shrink-0">
                      <div className={`flex items-center gap-1.5 px-3 h-11 rounded-[10px] border transition-all ${
                        isDark 
                          ? "bg-[#0f172a] border-[#1e293b] text-[#f8fafc] hover:border-[#334155] focus-within:border-[#38b1f7] focus-within:ring-3 focus-within:ring-[#38b1f7]/12" 
                          : "bg-white border-[#e2e8f0] text-[#0f172a] hover:border-[#cbd5e1] focus-within:border-[#38b1f7] focus-within:ring-3 focus-within:ring-[#38b1f7]/15"
                      }`}>
                        {/* Flag Button */}
                        <button
                          type="button"
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                          className="text-base leading-none transition-transform hover:scale-110 active:scale-95 shrink-0"
                          title="Select Country"
                        >
                          {selectedCountry.flag || "🌐"}
                        </button>
                        
                        {/* Typable Dial Code Input */}
                        <input
                          type="text"
                          value={dialPart}
                          onChange={(e) => {
                            let val = e.target.value;
                            // Allow numbers and + symbol
                            val = val.replace(/[^\d+]/g, "");
                            // Ensure it starts with + if it's not empty and doesn't start with it
                            if (val && !val.startsWith("+")) {
                              val = "+" + val;
                            }
                            setDialPart(val);
                            setFormPhone(val + " " + localPart.trim());
                          }}
                          placeholder="+91"
                          className="w-12 bg-transparent border-0 p-0 text-sm font-semibold focus:ring-0 focus:outline-none placeholder-slate-400 dark:placeholder-slate-600"
                        />
                        
                        <ChevronDown 
                          className="w-3.5 h-3.5 opacity-60 cursor-pointer hover:opacity-100 shrink-0" 
                          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        />
                      </div>

                      {showCountryDropdown && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => {
                              setShowCountryDropdown(false);
                              setCountrySearch("");
                            }}
                          />
                          <div className={`absolute left-0 mt-1.5 w-64 rounded-xl border p-2 shadow-xl z-50 animate-fade-in ${
                            isDark 
                              ? "bg-slate-955 border-slate-800 text-slate-300" 
                              : "bg-white border-slate-200 text-slate-755"
                          }`}>
                            <div className="relative mb-2">
                              <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-slate-650" : "text-slate-400"}`} />
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={(e) => setCountrySearch(e.target.value)}
                                placeholder="Search country or code..."
                                className={`w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#38b1f7] transition-all ${
                                  isDark 
                                    ? "bg-slate-900 border-slate-800 text-white placeholder-slate-500" 
                                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-450"
                                }`}
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto scrollbar-hide space-y-0.5">
                              {COUNTRIES.filter(c => 
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dialCode.includes(countrySearch) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                              ).map((c) => (
                                <button
                                  key={`${c.code}-${c.dialCode}`}
                                  type="button"
                                  onClick={() => handleSelectCountry(c)}
                                  className={`w-full flex items-center justify-between p-2 text-xs rounded-lg text-left transition-all ${
                                    selectedCountry.code === c.code && selectedCountry.dialCode === c.dialCode
                                      ? (isDark ? "bg-[#38b1f7]/10 text-[#38b1f7] font-semibold" : "bg-sky-50 text-[#0d9fea] font-semibold")
                                      : (isDark ? "hover:bg-slate-900" : "hover:bg-slate-50")
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="text-base leading-none shrink-0">{c.flag}</span>
                                    <span className="truncate">{c.name}</span>
                                  </div>
                                  <span className="text-slate-400 font-medium shrink-0 ml-1.5">{c.dialCode}</span>
                                </button>
                              ))}
                              {COUNTRIES.filter(c => 
                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
                                c.dialCode.includes(countrySearch) ||
                                c.code.toLowerCase().includes(countrySearch.toLowerCase())
                              ).length === 0 && (
                                <div className="text-[11px] text-slate-450 dark:text-slate-550 text-center py-4">
                                  No countries found
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Main Phone Number Text Input */}
                    <div className="relative flex-1">
                      <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="text"
                        value={localPart}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLocalPart(val);
                          setFormPhone(dialPart + " " + val.trim());
                        }}
                        placeholder="555-0199"
                        className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800/80 transition-all ${
                          formCrmId ? "border-sky-300 dark:border-sky-800/80 bg-sky-50/[0.02]" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* CRM Customer ID or Role */}
                {formRole === "CUSTOMER" ? (
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>CRM Customer ID</label>
                    <div className="relative">
                      <FileText className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                      <input
                        type="text"
                        value={formCrmId}
                        onChange={(e) => setFormCrmId(e.target.value)}
                        placeholder="e.g. CID250825 (Optional)"
                        className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800/80 transition-all ${
                          formCrmId ? "border-sky-300 dark:border-sky-800/80 bg-sky-50/[0.02]" : ""
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  showRole && (
                    <div className="admin-form-group">
                      <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Role</label>
                      <select
                        value={formRole}
                        onChange={e => setFormRole(e.target.value)}
                        className={`admin-select ${isDark ? "admin-dark" : ""} h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800`}
                      >
                        {roles && roles.length > 0 ? (
                          roles.filter(r => r !== "CUSTOMER").map(r => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="AGENT">Agent — Support Representative</option>
                            <option value="ADMIN">Admin — Full Access</option>
                          </>
                        )}
                      </select>
                    </div>
                  )
                )}
              </div>

              {/* Password & Account Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password */}
                <div className={`admin-form-group ${showStatusToggle ? "sm:col-span-1" : "sm:col-span-2"}`}>
                  <label className={`admin-form-label flex items-center gap-1.5 ${isDark ? "admin-dark" : ""}`}>
                    Password {!showStatusToggle && <span className="text-red-500 font-bold">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!showStatusToggle}
                      value={formPassword}
                      onChange={e => setFormPassword(e.target.value)}
                      placeholder={showStatusToggle ? "Leave blank to keep current" : "••••••••"}
                      className={`admin-input ${isDark ? "admin-dark" : ""} !pl-10 !pr-10 h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        isDark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Account Status Toggle (Only on Edit) */}
                {showStatusToggle && (
                  <div className="admin-form-group">
                    <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Account Status</label>
                    <select
                      value={formIsActive ? "true" : "false"}
                      onChange={e => setFormIsActive(e.target.value === "true")}
                      className={`admin-select ${isDark ? "admin-dark" : ""} h-11 text-sm rounded-lg border-slate-200 dark:border-slate-800`}
                    >
                      <option value="true">Active</option>
                      <option value="false">Suspended</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Assign Teams (Only if enabled) */}
              {showTeams && teams.length > 0 && (
                <div className="admin-form-group">
                  <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Assign to Teams</label>
                  <div className={`border rounded-xl p-4 max-h-36 overflow-y-auto grid grid-cols-2 gap-3 ${
                    isDark 
                      ? "border-slate-800 bg-slate-955/40" 
                      : "border-slate-200 bg-slate-50/50"
                  }`}>
                    {teams.map(t => (
                      <label 
                        key={t.id} 
                        className={`flex items-center gap-2.5 text-sm cursor-pointer p-1.5 rounded-lg transition-all hover:bg-slate-100/50 dark:hover:bg-slate-800/40 ${
                          isDark ? "text-slate-350" : "text-slate-700"
                        }`}
                      >
                        <input 
                          type="checkbox" 
                          checked={formTeams.includes(t.id)} 
                          onChange={() => setFormTeams(formTeams.includes(t.id) ? formTeams.filter(id => id !== t.id) : [...formTeams, t.id])} 
                          className="rounded text-[#38b1f7] focus:ring-[#38b1f7] accent-[#38b1f7] w-4 h-4 cursor-pointer" 
                        />
                        <span className="truncate font-medium">{t.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning Banner for Duplicate Accounts */}
          {accountExists && (
            <div className="p-3.5 rounded-xl bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <div className="font-bold mb-0.5">Account Already Exists</div>
                <div className="leading-relaxed opacity-95">
                  An account for <span className="font-semibold">{existingUser?.name}</span> ({existingUser?.email}) is already registered in the Helpdesk with this Email or CRM Customer ID.
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={submitting}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${
                isDark 
                  ? "text-slate-300 hover:text-white hover:bg-slate-800" 
                  : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={accountExists || submitting}
              className={`px-5 py-2 text-sm font-semibold text-white transition-all rounded-lg shadow-lg flex items-center justify-center gap-1.5 ${
                (accountExists || submitting) 
                  ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed shadow-none border border-slate-200 dark:border-slate-700" 
                  : "bg-[#0d9fea] hover:bg-[#38b1f7] active:scale-[0.98] shadow-sky-500/10 hover:shadow-sky-500/20"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                accountExists ? "Account Exists" : submitLabel
              )}
            </button>
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
  submitting?: boolean;
}

function TeamModal({
  title, subtitle, isDark, name, onNameChange, description, onDescriptionChange,
  selectedMemberIds, onMembersChange, agents, onClose, onSubmit, submitLabel, submitting = false,
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
      className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="admin-modal w-full max-w-[520px]"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className={`flex items-start justify-between mb-6 pb-5 border-b ${isDark ? "border-white/[0.06]" : "border-slate-100"}`}>
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
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

// ── Searchable Select component for issue category ──────────────────
interface SearchableSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder: string;
  isDark: boolean;
  disabled?: boolean;
}

function SearchableSelect({ value, onChange, options, placeholder, isDark, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  const uniqueOptions = Array.from(new Set(options || []));
  const filteredOptions = uniqueOptions.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className={`relative w-full ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}>
      <div className="relative">
        <input
          type="text"
          value={search}
          disabled={disabled}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
            if (e.target.value === "") {
              onChange("");
            }
          }}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          placeholder={placeholder}
          className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs pr-8`}
          style={{ height: 34 }}
        />
        <div 
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400 cursor-pointer" 
          onClick={() => { if (!disabled) setIsOpen(!isOpen); }}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 max-h-56 overflow-y-auto rounded-xl border shadow-lg ${
          isDark 
            ? "bg-[#0b0f19] border-white/[0.08] text-slate-200" 
            : "bg-white border-slate-200 text-slate-800"
        }`}>
          {filteredOptions.length === 0 ? (
            <div className="p-2.5 text-xs text-slate-400 text-center">No categories found</div>
          ) : (
            filteredOptions.map((opt, idx) => (
              <div
                key={`${opt}-${idx}`}
                onClick={() => {
                  onChange(opt);
                  setSearch(opt);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                  value === opt
                    ? isDark 
                      ? "bg-white/[0.08] text-white" 
                      : "bg-blue-50 text-blue-600 font-semibold"
                    : isDark 
                      ? "hover:bg-white/[0.04]" 
                      : "hover:bg-slate-50"
                }`}
              >
                {opt}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Custom Resolve Ticket Modal ──────────────────────────────────────
interface ResolveTicketModalProps {
  ticket: TicketData;
  customerUser: UserProfile | undefined;
  hours: number;
  notes: string;
  isDark: boolean;
  onClose: () => void;
  onHoursChange: (v: number) => void;
  onNotesChange: (v: string) => void;
  onSubmit: (e: React.FormEvent, files: File[]) => void;
  submitting?: boolean;
}

function ResolveTicketModal({
  ticket, customerUser, hours, notes, isDark, onClose, onHoursChange, onNotesChange, onSubmit, submitting = false
}: ResolveTicketModalProps) {
  const [screenshots, setScreenshots] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (screenshots.length === 0) {
      setPreviewUrls([]);
      return;
    }
    const urls = screenshots.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [screenshots]);

  const removeScreenshot = (index: number) => {
    setScreenshots(prev => prev.filter((_, idx) => idx !== index));
  };

  const credits = customerUser?.customerCredits;
  const currentAllocated = credits?.allocatedHours ?? 20;
  const currentUsed = credits?.usedHours ?? 0;
  const currentRemaining = credits?.remainingHours ?? 20;
  const currentBillable = credits?.billableHours ?? 0;

  const newUsed = currentUsed + hours;
  const newRemaining = Math.max(0, currentRemaining - hours);
  const overage = hours > currentRemaining ? (hours - currentRemaining) : 0;
  const newBillable = currentBillable + overage;

  return (
    <div className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="admin-modal w-full max-w-[480px]">
        <div className="flex items-start justify-between mb-5 border-b pb-4 dark:border-white/[0.06] border-slate-100">
          <div>
            <h3 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Resolve Support Ticket</h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Ticket: #{ticket.id.slice(0, 8)} — {ticket.title}</p>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg mt-0.5 ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={e => onSubmit(e, screenshots)} className="space-y-4">
          <div className="space-y-2">
            <h4 className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>Client Credits Preview</h4>
            <div className="grid grid-cols-3 gap-2 p-3 rounded-xl border text-xs bg-slate-50 dark:bg-white/[0.01] border-slate-200 dark:border-white/[0.05]">
              <div className="text-center border-r dark:border-white/[0.04] border-slate-200 last:border-r-0">
                <p className={isDark ? "text-slate-550" : "text-slate-400"}>Remaining</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{currentRemaining} hrs</p>
                <p className={`text-[10px] mt-0.5 font-bold ${newRemaining === 0 ? "text-red-500" : "text-green-500"}`}>
                  → {newRemaining} hrs
                </p>
              </div>
              <div className="text-center border-r dark:border-white/[0.04] border-slate-200 last:border-r-0">
                <p className={isDark ? "text-slate-550" : "text-slate-400"}>Used</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{currentUsed} hrs</p>
                <p className="text-amber-500 text-[10px] mt-0.5 font-medium">
                  → {newUsed} hrs
                </p>
              </div>
              <div className="text-center">
                <p className={isDark ? "text-slate-550" : "text-slate-400"}>Billable Overage</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{currentBillable} hrs</p>
                <p className={`text-[10px] mt-0.5 font-medium ${overage > 0 ? "text-red-500 font-bold" : "text-slate-400"}`}>
                  → {newBillable} hrs {overage > 0 && `(+${overage})`}
                </p>
              </div>
            </div>
          </div>

          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Support Credit Hours to Consume</label>
            <input 
              type="number" 
              required 
              min={0}
              step={0.1}
              value={hours} 
              onChange={e => onHoursChange(parseFloat(e.target.value) || 0)} 
              className={`admin-input ${isDark ? "admin-dark" : ""}`} 
              style={{ height: 38 }}
            />
          </div>

          <div className="admin-form-group space-y-2">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""} font-semibold`}>
              Resolution Screenshot Proofs (Optional)
            </label>
            
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={e => {
                const selectedFiles = Array.from(e.target.files || []);
                setScreenshots(prev => [...prev, ...selectedFiles]);
              }} 
              className="hidden" 
            />

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                isDark 
                  ? 'border-slate-800 hover:border-sky-500/50 bg-slate-950/20 hover:bg-slate-900/10' 
                  : 'border-slate-200 hover:border-sky-500 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <Upload className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Upload resolution screenshots
              </span>
              <span className={`text-[10px] mt-1 ${isDark ? 'text-slate-550' : 'text-slate-400'}`}>
                Click to select screenshots (multiple images supported)
              </span>
            </div>

            {screenshots.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {screenshots.map((file, idx) => {
                  const previewUrl = previewUrls[idx];
                  return (
                    <div 
                      key={`${file.name}-${idx}`}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2.5 ${
                        isDark ? 'border-slate-800 bg-slate-950/20' : 'border-slate-200 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {previewUrl && (
                          <div 
                            onClick={() => setLightboxUrl(previewUrl)}
                            className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200/50 dark:border-white/[0.04] bg-slate-100 dark:bg-slate-950 shrink-0 cursor-pointer group/thumb hover:scale-105 transition-all"
                            title="Click to view full image"
                          >
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className={`text-[11px] font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                            {file.name}
                          </p>
                          <p className={`text-[9px] font-mono mt-0.5 ${isDark ? 'text-slate-550' : 'text-slate-455'}`}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeScreenshot(idx);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        title="Remove screenshot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            
            <p className={`text-[10px] ${isDark ? "text-slate-550" : "text-slate-400"}`}>
              Provide optional visual screenshot proofs showing that the issue has been successfully fixed and verified.
            </p>
          </div>

          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Resolution Summary / Notes (Optional)</label>
            <textarea 
              value={notes} 
              onChange={e => onNotesChange(e.target.value)} 
              placeholder="Explain how this issue was resolved. These notes will be saved and posted to the ticket." 
              rows={3} 
              className={`admin-textarea ${isDark ? "admin-dark" : ""} text-xs`}
            />
            <p className={`text-[10px] mt-1 ${isDark ? "text-slate-550" : "text-slate-400"}`}>
              If provided, this summary will automatically be posted as a message reply on this ticket.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t dark:border-white/[0.06] border-slate-100">
            <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost text-xs" style={{ height: 36 }}>Cancel</button>
            <button type="submit" className="admin-btn admin-btn-primary text-xs" style={{ height: 36 }}>Confirm Resolution</button>
          </div>
        </form>
      </div>

      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-full max-h-full">
            <button 
              type="button"
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 hover:scale-105 transition-transform"
              onClick={() => setLightboxUrl(null)}
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={lightboxUrl} 
              alt="Screenshot Preview" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg border border-white/[0.08]" 
              onClick={e => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pagination Controls Helper ────────────────────────────────────
function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isDark,
  itemLabel = "items",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isDark: boolean;
  itemLabel?: string;
}) {
  if (totalItems === 0) return null;
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-xs ${
      isDark ? "border-white/[0.06] bg-slate-900/40 text-slate-400" : "border-slate-200/80 bg-slate-50/50 text-slate-600"
    }`}>
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of{" "}
          <span className="font-semibold">{totalItems}</span> {itemLabel}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <span className="text-[11px]">Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={`admin-select text-xs py-0.5 px-2 rounded border ${
              isDark ? "bg-slate-800 border-white/[0.1] text-white" : "bg-white border-slate-200 text-slate-700"
            }`}
            style={{ height: 26 }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`px-2.5 py-1 rounded border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-slate-800 border-white/[0.1] text-slate-300 hover:bg-slate-700 hover:text-white"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Previous
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, idx, arr) => {
            const prev = arr[idx - 1];
            const showEllipsis = prev && page - prev > 1;
            return (
              <React.Fragment key={page}>
                {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                <button
                  onClick={() => onPageChange(page)}
                  className={`w-7 h-7 rounded border text-xs font-semibold transition-all ${
                    currentPage === page
                      ? isDark
                        ? "bg-[#38b1f7] border-[#38b1f7] text-white"
                        : "bg-blue-600 border-blue-600 text-white"
                      : isDark
                      ? "bg-slate-800 border-white/[0.1] text-slate-300 hover:bg-slate-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            );
          })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`px-2.5 py-1 rounded border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isDark
              ? "bg-slate-800 border-white/[0.1] text-slate-300 hover:bg-slate-700 hover:text-white"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ── SLA Policy Create/Edit Modal ──────────────────────────────────
function SlaPolicyModal({
  isDark,
  editingPolicy,
  name,
  setName,
  priority,
  setPriority,
  firstResponseHours,
  setFirstResponseHours,
  resolutionHours,
  setResolutionHours,
  isActive,
  setIsActive,
  submitting,
  onClose,
  onSubmit,
}: {
  isDark: boolean;
  editingPolicy: SlaPolicy | null;
  name: string;
  setName: (v: string) => void;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "ALL";
  setPriority: (v: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "ALL") => void;
  firstResponseHours: number | string;
  setFirstResponseHours: (v: number | string) => void;
  resolutionHours: number | string;
  setResolutionHours: (v: number | string) => void;
  isActive: boolean;
  setIsActive: (v: boolean) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className={`admin-modal-overlay ${isDark ? "admin-dark" : ""}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`admin-modal w-full max-w-[500px] ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
        <div className="flex items-start justify-between mb-5 pb-4 border-b dark:border-white/[0.06] border-slate-100">
          <div>
            <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              {editingPolicy ? "Edit SLA Policy" : "Create New SLA Policy"}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              Define response and resolution SLA targets per priority tier.
            </p>
          </div>
          <button type="button" onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? "text-slate-400 hover:text-white hover:bg-white/[0.05]" : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="admin-form-group">
            <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Policy Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              placeholder="e.g. Critical SLA Target, Standard Tier SLA"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs`}
              style={{ height: 38 }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Priority Tier <span className="text-red-500">*</span></label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={`admin-select ${isDark ? "admin-dark" : ""} w-full text-xs`}
                style={{ height: 38 }}
              >
                <option value="URGENT">URGENT</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
                <option value="ALL">ALL (Fallback)</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Status</label>
              <div className="flex items-center gap-2 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-[#38b1f7]"></div>
                  <span className={`ml-2 text-xs font-semibold ${isActive ? "text-green-500" : isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>First Response Target (Hours) <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={0.001}
                step="any"
                value={firstResponseHours}
                onChange={(e) => setFirstResponseHours(e.target.value)}
                className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs`}
                style={{ height: 38 }}
              />
            </div>

            <div className="admin-form-group">
              <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Resolution Target (Hours) <span className="text-red-500">*</span></label>
              <input
                type="number"
                required
                min={0.001}
                step="any"
                value={resolutionHours}
                onChange={(e) => setResolutionHours(e.target.value)}
                className={`admin-input ${isDark ? "admin-dark" : ""} w-full text-xs`}
                style={{ height: 38 }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-white/[0.06] border-slate-100">
            <button type="button" onClick={onClose} className="admin-btn admin-btn-ghost text-xs" style={{ height: 36 }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary text-xs" style={{ height: 36 }}>
              {submitting ? "Saving..." : editingPolicy ? "Update Policy" : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

