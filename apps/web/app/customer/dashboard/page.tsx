"use client";

import { useAuth } from "../../../context/AuthContext";
import Loader from "../../../components/Loader";
import { useToast } from "../../../context/ToastContext";
import React, { useState, useEffect, useCallback } from "react";

import { fetchWithAuth } from "../../../lib/api";
import { getCookie } from "../../../lib/cookie";
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
  ChevronLeft,
  RefreshCw,
  Sun,
  Moon,
  Search,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  Receipt,
  Cpu,
  ArrowRight,
  Paperclip,
  AlertTriangle,
  CheckCircle2,
  Globe,
  Server,
  FileText,
  Folder,
  LogOut,
  User,
  Building,
  Phone,
  History,
  Activity,
  Shield,
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

interface TicketAttachment {
  id: string;
  ticketId: string;
  filename: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
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
  createdBySecondaryEmail?: string | null;
  messages?: TicketMessage[];
  attachments?: TicketAttachment[];
}

interface KbArticle {
  id: string;
  title: string;
  content: string;
  totalReads: number;
  createdAt: string;
  author: { name: string };
  category?: { name: string } | null;
  tags?: string[];
}

interface KbCategory {
  id: string;
  name: string;
  article_count?: number;
  parentId?: string | null;
}

interface CustomerNavItemProps {
  label: string;
  icon: React.ElementType;
  active: boolean;
  collapsed: boolean;
  isDark: boolean;
  onClick: () => void;
  badge?: number;
}

function CustomerNavItem({ label, icon: Icon, active, collapsed, isDark, onClick, badge }: CustomerNavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className="relative flex items-center w-full"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        onClick={onClick}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        type="button"
        className={`
          admin-nav-item w-full flex items-center justify-between
          ${active ? "admin-nav-item-active" : ""}
          ${isDark ? "admin-dark" : ""}
          ${collapsed ? "justify-center px-0" : "px-3"}
        `}
      >
        <div className="flex items-center">
          <Icon
            className={`w-[18px] h-[18px] shrink-0 ${collapsed ? "" : "mr-2.5"} ${active ? "text-[#38b1f7]" : ""}`}
            strokeWidth={active ? 2.5 : 2}
            aria-hidden="true"
          />
          {!collapsed && (
            <span className="truncate">{label}</span>
          )}
        </div>
        {!collapsed && badge !== undefined && badge > 0 && (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold transition-all duration-300 ${
            isDark ? 'bg-[#38b1f7] text-[#020617]' : 'bg-[#38b1f7] text-white'
          }`}>
            {badge}
          </span>
        )}
        {collapsed && badge !== undefined && badge > 0 && (
          <div className="absolute top-1.5 right-2.5 w-2.5 h-2.5 rounded-full bg-[#38b1f7] ring-2 ring-[#020617] animate-pulse" />
        )}
      </button>

      {collapsed && showTooltip && (
        <div 
          className={`absolute left-[62px] z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-xl whitespace-nowrap pointer-events-none tooltip-premium-animate ${
            isDark 
              ? "bg-[#0c1525]/95 border-white/[0.08] text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.6)]" 
              : "bg-white/95 border-slate-200/80 text-slate-800 shadow-[0_4px_16px_rgba(148,163,184,0.15)]"
          }`}
          style={{
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Arrow Pointer */}
          <div 
            className={`absolute right-full top-1/2 -translate-y-1/2 border-y-[5px] border-y-transparent border-r-[5px] ${
              isDark ? "border-r-[#0c1525]/95" : "border-r-white/95"
            }`}
            style={{ marginRight: "-1px" }}
          />
          {/* Accent Color Bar */}
          <div className="w-1 h-3 rounded-full bg-[#38b1f7] shrink-0" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

export default function CustomerDashboard() {
  const { user, logout, loading, refreshUser } = useAuth();
  const toast = useToast();

  // Sidebar collapsible state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("customer_sidebar_collapsed");
      return saved === "true";
    }
    return false;
  });

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed;
    setIsSidebarCollapsed(next);
    localStorage.setItem("customer_sidebar_collapsed", String(next));
  };
  
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
    toast.info(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`);
  };

  const isDark = theme === 'dark';
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"dashboard" | "profile" | "tickets" | "kb" | "settings">("dashboard");

  // Customer Knowledge Base States
  const [kbArticles, setKbArticles] = useState<KbArticle[]>([]);
  const [kbCategories, setKbCategories] = useState<KbCategory[]>([]);
  const [loadingKb, setLoadingKb] = useState<boolean>(false);
  const [searchKb, setSearchKb] = useState<string>("");
  const [selectedKbCategory, setSelectedKbCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<KbArticle | null>(null);

  // Customer Profile Settings States
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    password: "",
    confirmPassword: "",
  });
  const [submittingSettings, setSubmittingSettings] = useState(false);

  useEffect(() => {
    if (user) {
      setSettingsForm(prev => ({ ...prev, name: user.name }));
    }
  }, [user]);

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

  const [credits, setCredits] = useState<{
    allocatedHours: number;
    usedHours: number;
    remainingHours: number;
    billableHours: number;
    transactions: any[];
  } | null>(null);

  // CRM domain/service states
  interface SubscriptionService {
    serviceId: string;
    serviceName: string;
    SKU: string;
  }

  interface Subscription {
    id: string;
    crmSubscriptionId: string;
    planName: string;
    status: string;
    startDate: string;
    endDate?: string | null;
    services?: SubscriptionService[];
  }

  const [crmDetails, setCrmDetails] = useState<{
    customer: {
      crmCustomerId: string;
      companyName: string | null;
      displayName: string;
      primaryEmail: string;
      secondaryEmail: string | null;
      primaryPhone: string | null;
      secondaryPhone: string | null;
      customerStatus: string;
      lastSyncedAt: string;
    } | null;
    domains: Array<{ id: string; crmDomainId: string; domainName: string; registeredWith?: string }>;
    subscriptions: Subscription[];
    services: Array<{ id: string; crmServiceId: string; name: string; status: string; domainName?: string | null }>;
  }>({ customer: null, domains: [], subscriptions: [], services: [] });
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [selectedServiceName, setSelectedServiceName] = useState<string>("");
  const [customDomainInput, setCustomDomainInput] = useState<string>("");
  const [useCustomDomain, setUseCustomDomain] = useState<boolean>(false);

  // Modal / Creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    affectedDomain: "",
    issueType: "" as "" | "billing" | "technical" | "critical" | "other",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [wizardStep, setWizardStep] = useState<"select-domain" | "select-subscription" | "select-service" | "self-help" | "intake" | "routing">("select-domain");
  const [suggestedArticles, setSuggestedArticles] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState<boolean>(false);
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Option 1 Self-Help states
  const [modalKbSearch, setModalKbSearch] = useState("");
  const [modalKbArticles, setModalKbArticles] = useState<KbArticle[]>([]);
  const [loadingModalKb, setLoadingModalKb] = useState(false);
  const [modalSelectedArticle, setModalSelectedArticle] = useState<KbArticle | null>(null);

  const searchModalKb = async (query: string) => {
    try {
      setLoadingModalKb(true);
      const params = new URLSearchParams();
      if (query.trim()) {
        params.append("search", query);
      }
      params.append("isPublished", "true");
      params.append("isInternal", "false");
      const res = await fetchWithAuth(`/kb?${params.toString()}`);
      if (res.ok) {
        const body = await res.json();
        setModalKbArticles(body.data.articles || []);
      }
    } catch (err) {
      console.error("Failed to search modal KB:", err);
    } finally {
      setLoadingModalKb(false);
    }
  };

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

  const loadCredits = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/users/me/credits");
      if (res.ok) {
        const body = await res.json();
        setCredits(body.data.credits);
      }
    } catch (err) {
      console.error("Failed to load customer credits:", err);
    }
  }, []);

  const loadCrmDetails = useCallback(async () => {
    try {
      setLoadingCrm(true);
      const res = await fetchWithAuth("/users/me/crm-details");
      if (res.ok) {
        const body = await res.json();
        setCrmDetails(body.data || { customer: null, domains: [], subscriptions: [], services: [] });
      }
    } catch (err) {
      console.error("Failed to load CRM details:", err);
    } finally {
      setLoadingCrm(false);
    }
  }, []);

  // Sync initial load
  useEffect(() => {
    if (user) {
      loadTickets();
      loadCategories();
      loadCredits();
      loadCrmDetails();

      // Check for redirect ticketId query parameter
      if (typeof window !== "undefined") {
        const ticketIdParam = new URLSearchParams(window.location.search).get("ticketId");
        if (ticketIdParam) {
          setSelectedTicketId(ticketIdParam);
        }
      }
    }
  }, [user, loadTickets, loadCategories, loadCredits, loadCrmDetails]);

  // Sync details when selection changes
  useEffect(() => {
    if (selectedTicketId) {
      loadTicketDetails(selectedTicketId);
    } else {
      setDetailedTicket(null);
      setMessages([]);
    }
  }, [selectedTicketId, loadTicketDetails]);

  // ── Real-time CRM sync via Server-Sent Events ─────────────────────────────
  // Establishes a persistent SSE connection to /api/users/me/events.
  // When the CRM processes a domain event (domain.created, subscription.updated, etc.),
  // the server pushes a 'crm.sync' notification which triggers a targeted data refresh.
  useEffect(() => {
    if (!user) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const token = getCookie("accessToken");
    if (!token) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      // Pass token as query parameter (EventSource doesn't support custom headers)
      const url = `${API_URL}/users/me/events?t=${encodeURIComponent(token)}`;
      eventSource = new EventSource(url);

      eventSource.addEventListener("connected", () => {
        console.log("[SSE] Real-time CRM sync connected.");
      });

      // Main CRM sync event handler
      eventSource.addEventListener("crm.sync", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data) as {
            entityType: string;
            operation: string;
            crmCustomerId?: string;
          };

          console.log(`[SSE] Received crm.sync: ${payload.entityType}.${payload.operation}`);

          // Refresh only the affected data slice
          switch (payload.entityType) {
            case "domain":
            case "subscription":
              // Reload CRM details which includes domains, subscriptions, and services
              loadCrmDetails();
              break;
            case "customer":
              // Refresh user profile (name, email, isActive, etc.)
              refreshUser();
              loadCrmDetails();
              break;
            case "service":
              // Service catalog change — reload CRM details for updated service list
              loadCrmDetails();
              break;
          }
        } catch (err) {
          console.error("[SSE] Failed to parse crm.sync event:", err);
        }
      });

      eventSource.addEventListener("shutdown", () => {
        console.log("[SSE] Server shutting down. Reconnecting in 5s...");
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 5000);
      });

      eventSource.onerror = () => {
        // EventSource will auto-retry after close, but we explicitly control reconnection
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };
  }, [user, loadCrmDetails, refreshUser]);

  // Perform the actual ticket save & file attachment upload
  const executeTicketCreation = async () => {
    try {
      setSubmittingCreate(true);
      setCreateError(null);

      // Determine routing category string
      let issueCategory = "Technical Support";
      if (createForm.issueType === "billing") {
        issueCategory = "Billing / Renewals";
      } else if (createForm.issueType === "critical") {
        issueCategory = "Critical Issues";
      } else if (createForm.issueType === "technical") {
        issueCategory = "Technical Support";
      }

      // 1. Create the Ticket
      const res = await fetchWithAuth("/tickets", {
        method: "POST",
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          categoryId: createForm.categoryId || null,
          priority: createForm.priority,
          affectedDomain: createForm.affectedDomain.trim() || null,
          issueCategory,
          domainId: selectedDomainId || null,
          subscriptionId: selectedSubscriptionId || null,
          serviceId: selectedServiceId || null,
        }),
      });

      const resBody = await res.json();
      if (!res.ok) {
        // Handle field-level validation errors (422 Zod)
        if (res.status === 422 && resBody.error?.details?.length > 0) {
          const fields: Record<string, string> = {};
          resBody.error.details.forEach((d: { field: string; message: string }) => {
            fields[d.field] = d.message;
          });
          setFieldErrors(fields);
          // Build a readable summary for the banner
          const summary = resBody.error.details.map((d: { field: string; message: string }) => d.message).join(" · ");
          setCreateError(summary);
          // Navigate back to Step intake so user can fix the fields
          setWizardStep("intake");
          toast.error("Please fix the highlighted fields.");
        } else {
          setCreateError(resBody.error?.message || "Failed to create support ticket.");
          toast.error(resBody.error?.message || "Failed to create ticket.");
        }
        setSubmittingCreate(false);
        return;
      }

      const createdTicket = resBody.data.ticket;

      // 2. If a file is selected, upload it as an attachment
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadRes = await fetchWithAuth(`/tickets/${createdTicket.id}/attachments`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          try {
            const errData = await uploadRes.json();
            toast.warning(`Ticket created, but attachment upload failed: ${errData.error?.message || "Unknown validation error"}`);
          } catch {
            toast.warning("Ticket created, but attachment upload failed.");
          }
        }
      }

      // Success
      await loadTickets(false);
      await loadCredits();
      setCreateForm({
        title: "",
        description: "",
        categoryId: categories.length > 0 ? categories[0].id : "",
        priority: "MEDIUM",
        affectedDomain: "",
        issueType: "",
      });
      setSelectedFile(null);
      setSelectedDomainId("");
      setSelectedServiceId("");
      setSelectedSubscriptionId("");
      setSelectedServiceName("");
      setCustomDomainInput("");
      setUseCustomDomain(false);
      setWizardStep("select-domain");
      setSuggestedArticles([]);
      setShowCreateModal(false);
      setFieldErrors({});
      toast.success("Support ticket created successfully!");
    } catch (err) {
      console.error("Ticket creation error:", err);
      setCreateError("Unable to connect to the server.");
      toast.error("Unable to connect to the server.");
    } finally {
      setSubmittingCreate(false);
    }
  };

  // Step 1 → Step 2/3: fetch KB suggestions, then route to self-help or routing preview
  const handleIntakeNext = async (e: React.FormEvent) => {
    e.preventDefault();

    // ── Client-side validation (mirrors API Zod schema) ───────────────────────
    const newFieldErrors: Record<string, string> = {};
    if (!createForm.issueType) {
      setCreateError("Please select an issue type.");
      return;
    }
    if (!createForm.title.trim()) {
      newFieldErrors["title"] = "Title is required.";
    } else if (createForm.title.trim().length < 3) {
      newFieldErrors["title"] = "Title must be at least 3 characters.";
    } else if (createForm.title.trim().length > 100) {
      newFieldErrors["title"] = "Title must be at most 100 characters.";
    }
    if (!createForm.description.trim()) {
      newFieldErrors["description"] = "Description is required.";
    } else if (createForm.description.trim().length < 10) {
      newFieldErrors["description"] = `Description must be at least 10 characters (${createForm.description.trim().length}/10).`;
    }
    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setCreateError("Please fix the highlighted fields before continuing.");
      return;
    }

    setFieldErrors({});
    setCreateError(null);

    // Go straight to routing preview since self-help suggestions were already shown
    setWizardStep("routing");
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
        toast.success("Reply message sent successfully!");
      } else {
        toast.error("Failed to send message reply.");
      }
    } catch (err) {
      console.error("Message send error:", err);
      toast.error("Failed to send message.");
    } finally {
      setSubmittingMessage(false);
    }
  };



  // Load KB articles and categories
  const loadKbData = useCallback(async () => {
    try {
      setLoadingKb(true);
      const params = new URLSearchParams();
      if (searchKb) params.append("search", searchKb);
      if (selectedKbCategory) params.append("categoryId", selectedKbCategory);
      params.append("isPublished", "true");
      params.append("isInternal", "false");

      const [artRes, catRes] = await Promise.all([
        fetchWithAuth(`/kb?${params.toString()}`),
        fetchWithAuth("/kb/categories"),
      ]);

      if (artRes.ok) {
        const artBody = await artRes.json();
        setKbArticles(artBody.data.articles || []);
      }
      if (catRes.ok) {
        const catBody = await catRes.json();
        setKbCategories(catBody.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load KB data:", err);
    } finally {
      setLoadingKb(false);
    }
  }, [searchKb, selectedKbCategory]);

  useEffect(() => {
    if (activeTab === "kb") {
      loadKbData();
    }
  }, [activeTab, loadKbData]);

  // Click handler to view KB article details and record reads
  const handleReadArticle = async (article: KbArticle) => {
    setSelectedArticle(article);
    try {
      await fetchWithAuth(`/kb/public/articles/${article.id}/read`, {
        method: "POST",
        body: JSON.stringify({
          utmSource: "customer_portal",
        }),
      });
    } catch (err) {
      console.error("Failed to record read:", err);
    }
  };

  // Handle Profile settings save
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsForm.password && settingsForm.password !== settingsForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setSubmittingSettings(true);
      const res = await fetchWithAuth("/users/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          name: settingsForm.name,
          password: settingsForm.password || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Profile settings saved successfully!");
        setSettingsForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
        await refreshUser();
      } else {
        const body = await res.json();
        toast.error(body.error?.message || "Failed to update profile settings.");
      }
    } catch (err) {
      console.error("Profile settings save error:", err);
      toast.error("Failed to update profile settings.");
    } finally {
      setSubmittingSettings(false);
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
    return (
      <div className={`flex items-center justify-center min-h-screen transition-colors duration-300 ${
        isDarkTheme ? 'bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
      }`}>
        <Loader size="xl" theme={isDarkTheme ? "dark" : "light"} label="Loading secure customer console..." />
      </div>
    );
  }

  const activeTicketsCount = tickets.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS").length;
  const resolvedTicketsCount = tickets.filter(t => t.status === "RESOLVED" || t.status === "CLOSED").length;
  const resolutionRate = tickets.length > 0 ? Math.round((resolvedTicketsCount / tickets.length) * 100) : 100;

  return (
    <div className={`min-h-screen flex font-body selection:bg-[#38b1f7]/30 relative overflow-hidden transition-colors duration-300 ${
      isDark ? 'admin-dark bg-[#020617] text-[#F8FAFC]' : 'bg-[#F8FAFC] text-[#0F172A]'
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

      {/* 1. Sidebar Navigation */}
      <aside className={`admin-sidebar border-r flex flex-col justify-between hidden md:flex shrink-0 z-40 relative ${
        isSidebarCollapsed ? "w-[68px]" : "w-[240px]"
      } ${
        isDark 
          ? 'bg-[#0F172A]/70 backdrop-blur-md border-[#1E293B] text-[#F8FAFC]' 
          : 'bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-800'
      }`}>
        {/* Brand Logo Header */}
        <div className={`flex items-center border-b border-inherit h-[64px] shrink-0 transition-all duration-300 ${
          isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4 py-4"
        }`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#38b1f7] flex items-center justify-center shadow-[0_0_15px_rgba(56,177,247,0.4)] shrink-0">
                  <span className="font-extrabold text-[#020617] text-md">Ω</span>
                </div>
                <div className="overflow-hidden">
                  <h2 className={`font-bold text-sm leading-tight truncate whitespace-nowrap ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>OCS Helpdesk</h2>
                  <p className={`text-[9px] font-mono tracking-wider uppercase whitespace-nowrap truncate ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Portal Client</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                type="button"
                className={`p-1.5 rounded-lg border transition-all duration-200 active:scale-95 shrink-0 ${
                  isDark 
                    ? 'border-white/10 text-slate-500 hover:text-white hover:bg-white/[0.06]' 
                    : 'border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={toggleSidebar}
              type="button"
              className={`p-1.5 rounded-lg border transition-all duration-200 active:scale-95 shrink-0 flex items-center justify-center ${
                isDark 
                  ? 'border-white/10 text-[#38b1f7] hover:text-white hover:bg-white/[0.06]' 
                  : 'border-slate-200 text-[#0d7fc0] hover:text-[#38b1f7] hover:bg-slate-100'
              }`}
              title="Expand Sidebar"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Nav List */}
        <nav className={`flex-1 px-3 py-3 space-y-0.5 ${isSidebarCollapsed ? "overflow-y-visible" : "overflow-y-auto overflow-x-hidden"}`}>
          <CustomerNavItem
            label="Dashboard"
            icon={BarChart2}
            active={activeTab === "dashboard"}
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onClick={() => { setActiveTab("dashboard"); setSelectedTicketId(null); setSelectedArticle(null); }}
          />

          <CustomerNavItem
            label="My Profile"
            icon={User}
            active={activeTab === "profile"}
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onClick={() => { setActiveTab("profile"); setSelectedTicketId(null); setSelectedArticle(null); }}
          />
          
          <CustomerNavItem
            label="My Tickets"
            icon={MessageSquare}
            active={activeTab === "tickets"}
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onClick={() => { setActiveTab("tickets"); setSelectedTicketId(null); setSelectedArticle(null); }}
            badge={activeTicketsCount}
          />

          <CustomerNavItem
            label="Knowledge Base"
            icon={BookOpen}
            active={activeTab === "kb"}
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onClick={() => { setActiveTab("kb"); setSelectedTicketId(null); setSelectedArticle(null); }}
          />

          <CustomerNavItem
            label="Settings"
            icon={Settings}
            active={activeTab === "settings"}
            collapsed={isSidebarCollapsed}
            isDark={isDark}
            onClick={() => { setActiveTab("settings"); setSelectedTicketId(null); setSelectedArticle(null); }}
          />
        </nav>

        {/* Sidebar Bottom Profile Section */}
        <div className={`
          px-3 py-3 border-t shrink-0
          ${isDark ? "border-white/[0.06]" : "border-slate-100"}
        `}>
          <div className={`
            flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300
            ${isDark ? "bg-white/[0.03]" : "bg-slate-50"}
            ${isSidebarCollapsed ? "justify-center" : ""}
          `}>
            {/* Avatar */}
            <div
              className={`
                w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 border
                ${isDark
                  ? "bg-[#38b1f7]/15 text-[#5fc0f9] border-[#38b1f7]/20"
                  : "bg-[#38b1f7]/10 text-[#0d7fc0] border-[#38b1f7]/15"}
              `}
              title={isSidebarCollapsed ? user.name : undefined}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>

            {!isSidebarCollapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                    {user.name}
                  </p>
                  <p className={`text-[11px] truncate leading-tight uppercase font-mono tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                    {user.role}
                  </p>
                </div>

                <button
                  onClick={() => logout()}
                  className={`
                    p-1.5 rounded-lg border transition-all shrink-0
                    ${isDark
                      ? "border-red-500/20 text-red-400 hover:bg-red-950/30 hover:text-red-300 hover:border-red-500/30"
                      : "border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"}
                  `}
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {isSidebarCollapsed && (
            <button
              onClick={() => logout()}
              className={`
                mt-2 w-full p-2 rounded-lg border transition-all flex items-center justify-center
                ${isDark
                  ? "border-red-500/20 text-red-400 hover:bg-red-950/30 hover:border-red-500/30"
                  : "border-red-200 text-red-500 hover:bg-red-50"}
              `}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
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
              {activeTab === "dashboard" 
                ? "Dashboard Overview" 
                : activeTab === "tickets"
                ? "My Support Tickets"
                : activeTab === "kb"
                ? "Knowledge Base"
                : "Profile Settings"}
            </h1>
            <p className={`text-[10px] ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>
              {activeTab === "dashboard" 
                ? "Metrics and active support overview" 
                : activeTab === "tickets"
                ? "View, manage, and discuss your submitted issues"
                : activeTab === "kb"
                ? "Search and read troubleshooting guidelines and articles"
                : "Manage your personal profile and account credentials"}
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
                    className="btn-cyber flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Ticket</span>
                  </button>
                </section>

                {/* Cards metrics system */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                  {/* Service Credit Hours Summary Card — enhanced with progress bar */}
                  <div className={`p-6 flex flex-col justify-between min-h-[160px] border transition-colors duration-300 rounded-2xl ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.03]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>Support Credits</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          credits && credits.remainingHours > 0
                            ? isDark ? "bg-emerald-950/40 text-[#12B76A] border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isDark ? "bg-red-950/40 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {credits ? `${credits.remainingHours} hrs left` : "0 hrs left"}
                        </span>
                      </div>
                      {/* Visual credit bar */}
                      {credits && credits.allocatedHours > 0 && (
                        <div className="mb-3">
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#38b1f7] to-emerald-400 transition-all duration-700"
                              style={{ width: `${Math.min(100, (credits.usedHours / credits.allocatedHours) * 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>0 hrs</span>
                            <span className={`text-[9px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{credits.allocatedHours} hrs total</span>
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
                        <div className="flex flex-col">
                          <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-400'}>Allocated</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{credits?.allocatedHours ?? 0} hrs</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-400'}>Used</span>
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{credits?.usedHours ?? 0} hrs</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-400'}>Remaining</span>
                          <span className="font-bold text-emerald-500">{credits?.remainingHours ?? 0} hrs</span>
                        </div>
                        <div className="flex flex-col">
                          <span className={isDark ? 'text-[#94A3B8]' : 'text-slate-400'}>Billable</span>
                          <span className="font-bold text-amber-500">{credits?.billableHours ?? 0} hrs</span>
                        </div>
                      </div>
                    </div>
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
                      <div className="p-8 flex items-center justify-center">
                        <Loader size="md" theme={theme} label="Retrieving support tickets..." />
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

            {activeTab === "profile" && (
              <div className="space-y-8 animate-fade-in">
                {/* 1. Header Overview Card */}
                <div className={`p-6 border rounded-2xl relative overflow-hidden transition-all duration-300 ${
                  isDark ? 'glass-card bg-[#0F172A]/45 border-white/[0.06] shadow-2xl shadow-slate-950/20' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  {/* Decorative background blur shapes in dark mode */}
                  {isDark && (
                    <>
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#38b1f7]/5 rounded-full blur-[80px] pointer-events-none" />
                      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none" />
                    </>
                  )}
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-start md:items-center gap-5">
                      {/* Avatar */}
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border shrink-0 transition-transform hover:scale-105 duration-300 ${
                        isDark 
                          ? 'bg-[#38b1f7]/10 text-[#5fc0f9] border-[#38b1f7]/20 shadow-[0_0_20px_rgba(56,177,247,0.15)]' 
                          : 'bg-sky-50 text-[#0d7fc0] border-sky-100 shadow-sm'
                      }`}>
                        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h2 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                            {user.name}
                          </h2>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                            crmDetails.customer?.customerStatus === "ACTIVE" || !crmDetails.customer
                              ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              crmDetails.customer?.customerStatus === "ACTIVE" || !crmDetails.customer ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                            }`} />
                            {crmDetails.customer?.customerStatus || "ACTIVE"}
                          </span>
                        </div>
                        {crmDetails.customer?.companyName && (
                          <div className={`flex items-center gap-1.5 text-xs font-semibold ${isDark ? 'text-[#38b1f7]' : 'text-[#0d7fc0]'}`}>
                            <Building className="w-3.5 h-3.5" />
                            <span>{crmDetails.customer.companyName}</span>
                          </div>
                        )}
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Role: <span className="font-bold text-slate-300 capitalize">{user.role.toLowerCase().replace('_', ' ')}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left md:text-right text-xs space-y-1 font-mono text-slate-400">
                      <div>Account ID: <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{user.id}</span></div>
                      {crmDetails.customer && (
                        <div>CRM ID: <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{crmDetails.customer.crmCustomerId}</span></div>
                      )}
                      <div>Member Since: <span className={isDark ? 'text-slate-200' : 'text-slate-700'}>{formatJoinedDate(user.createdAt)}</span></div>
                    </div>
                  </div>

                  <hr className={`my-6 ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`} />

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs relative z-10">
                    <div className="space-y-1">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Primary Email</span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{user.email}</span>
                    </div>

                    <div className="space-y-1">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Secondary Email</span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {crmDetails.customer?.secondaryEmail || <span className="text-slate-500 italic">None Provided</span>}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Primary Phone</span>
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {crmDetails.customer?.primaryPhone ? (
                          <>
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{crmDetails.customer.primaryPhone}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">None Provided</span>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className={`block text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Secondary Phone</span>
                      <span className={`font-semibold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {crmDetails.customer?.secondaryPhone ? (
                          <>
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{crmDetails.customer.secondaryPhone}</span>
                          </>
                        ) : (
                          <span className="text-slate-500 italic">None Provided</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {crmDetails.customer && (
                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/[0.03] flex justify-between items-center text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" /> Live Synchronized from CRM
                      </span>
                      <span>Last sync: {new Date(crmDetails.customer.lastSyncedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 2. KPIs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1: Support Plan SLA */}
                  <div className={`p-5 border rounded-2xl flex flex-col justify-between min-h-[160px] transition-all duration-300 ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Subscription</h3>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                          crmDetails.subscriptions.length > 0
                            ? isDark ? "bg-emerald-950/40 text-[#12B76A] border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isDark ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-50 text-slate-400 border-slate-200"
                        }`}>
                          {crmDetails.subscriptions.length > 0 ? "Subscribed" : "No Plan"}
                        </span>
                      </div>
                      
                      {crmDetails.subscriptions.length > 0 ? (
                        <div className="space-y-1">
                          <p className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {crmDetails.subscriptions[0].planName}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Status: <span className="capitalize font-semibold text-emerald-500">{crmDetails.subscriptions[0].status.toLowerCase()}</span>
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No subscriptions registered in CRM database.</p>
                      )}
                    </div>
                    
                    {crmDetails.subscriptions.length > 0 && (
                      <div className={`text-[10px] font-mono pt-3 border-t text-slate-400 flex justify-between ${
                        isDark ? 'border-white/[0.03]' : 'border-slate-100'
                      }`}>
                        <span>Start: {new Date(crmDetails.subscriptions[0].startDate).toLocaleDateString()}</span>
                        {crmDetails.subscriptions[0].endDate && (
                          <span>End: {new Date(crmDetails.subscriptions[0].endDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card 2: Support Credits */}
                  <div className={`p-5 border rounded-2xl flex flex-col justify-between min-h-[160px] transition-all duration-300 ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Support Credits Balance</h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          credits && credits.remainingHours > 0
                            ? isDark ? "bg-emerald-950/40 text-[#12B76A] border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isDark ? "bg-red-950/40 text-red-400 border-red-500/20" : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {credits ? `${credits.remainingHours} hrs left` : "0 hrs left"}
                        </span>
                      </div>
                      
                      {credits && credits.allocatedHours > 0 ? (
                        <div>
                          <div className={`w-full h-2 rounded-full overflow-hidden mb-1.5 ${
                            isDark ? 'bg-slate-800' : 'bg-slate-100'
                          }`}>
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#38b1f7] to-emerald-400 transition-all duration-700"
                              style={{ width: `${Math.max(0, Math.min(100, (credits.remainingHours / credits.allocatedHours) * 100))}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-mono mb-2">
                            <span>Used: {credits.usedHours} hrs</span>
                            <span>Total: {credits.allocatedHours} hrs</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No credits allocated yet.</p>
                      )}
                    </div>
                    
                    <div className={`grid grid-cols-2 gap-x-2 text-[10px] pt-3 border-t text-slate-400 ${
                      isDark ? 'border-white/[0.03]' : 'border-slate-100'
                    }`}>
                      <div>Remaining: <span className="font-bold text-emerald-500">{credits?.remainingHours ?? 0} hrs</span></div>
                      <div>Billable: <span className="font-bold text-amber-500">{credits?.billableHours ?? 0} hrs</span></div>
                    </div>
                    {(!crmDetails?.domains || crmDetails.domains.length === 0) && (
                      <div className={`mt-2.5 pt-2.5 border-t text-[9px] flex items-center gap-1.5 ${
                        isDark ? 'border-white/[0.03] text-amber-400/90' : 'border-slate-100 text-amber-600'
                      }`}>
                        <AlertTriangle className="w-3 h-3 shrink-0 text-amber-500" />
                        <span className="font-medium">Min billing 1/2 hour applies for external domains</span>
                      </div>
                    )}
                  </div>

                  {/* Card 3: Ticket Metrics */}
                  <div className={`p-5 border rounded-2xl flex flex-col justify-between min-h-[160px] transition-all duration-300 ${
                    isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                  }`}>
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Ticket Statistics</h3>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                          isDark ? "bg-[#38b1f7]/15 text-[#5fc0f9] border-[#38b1f7]/20" : "bg-sky-50 text-[#0d7fc0] border-sky-200"
                        }`}>
                          Resolution {resolutionRate}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-1 text-center">
                        <div className="p-1 rounded bg-slate-100/50 dark:bg-white/[0.02]">
                          <span className="block text-lg font-extrabold text-slate-800 dark:text-slate-200">{tickets.length}</span>
                          <span className="text-[9px] text-slate-400 uppercase">Total</span>
                        </div>
                        <div className="p-1 rounded bg-amber-100/30 dark:bg-amber-950/15">
                          <span className="block text-lg font-extrabold text-amber-500">{activeTicketsCount}</span>
                          <span className="text-[9px] text-slate-400 uppercase font-medium">Open</span>
                        </div>
                        <div className="p-1 rounded bg-green-100/30 dark:bg-green-950/15">
                          <span className="block text-lg font-extrabold text-green-500">{resolvedTicketsCount}</span>
                          <span className="text-[9px] text-slate-400 uppercase">Resolved</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className={`text-[9.5px] leading-relaxed pt-2.5 border-t text-slate-400 ${
                      isDark ? 'border-white/[0.03]' : 'border-slate-100'
                    }`}>
                      A total of {resolvedTicketsCount} solved issues out of {tickets.length} queued help requests.
                    </p>
                  </div>
                </div>

                {/* 3. Detailed Data Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Left Column: Subscriptions, Services, Domains (2 cols) */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Subscriptions detail section */}
                    <div className={`p-6 border rounded-2xl transition-all duration-300 ${
                      isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <Shield className="w-4 h-4" />
                        </div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Registered Subscriptions</h3>
                      </div>
                      
                      {crmDetails.subscriptions.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className={`border-b text-[10px] font-bold uppercase tracking-wider ${
                                isDark ? 'border-white/[0.05] text-slate-400' : 'border-slate-100 text-slate-500'
                              }`}>
                                <th className="pb-3 pr-4">Plan Name</th>
                                <th className="pb-3 pr-4">CRM ID</th>
                                <th className="pb-3 pr-4">Status</th>
                                <th className="pb-3 pr-4">Start Date</th>
                                <th className="pb-3 text-right">End Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
                              {crmDetails.subscriptions.map((sub) => (
                                <tr key={sub.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors`}>
                                  <td className={`py-3.5 pr-4 font-bold ${isDark ? 'text-slate-250' : 'text-slate-800'}`}>
                                    {sub.planName}
                                  </td>
                                  <td className="py-3.5 pr-4 text-slate-400 font-mono text-[10px]">
                                    {sub.crmSubscriptionId}
                                  </td>
                                  <td className="py-3.5 pr-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      sub.status.toUpperCase() === "ACTIVE"
                                        ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/15" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : isDark ? "bg-rose-950/40 text-rose-450 border-rose-500/15" : "bg-rose-50 text-rose-700 border-rose-200"
                                    }`}>
                                      <span className={`w-1 h-1 rounded-full ${sub.status.toUpperCase() === "ACTIVE" ? "bg-emerald-400" : "bg-rose-450"}`} />
                                      {sub.status}
                                    </span>
                                  </td>
                                  <td className="py-3.5 pr-4 text-slate-400 font-mono">
                                    {new Date(sub.startDate).toLocaleDateString()}
                                  </td>
                                  <td className="py-3.5 text-right text-slate-400 font-mono">
                                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "Lifetime / Ongoing"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed dark:border-white/[0.04]">
                          No subscriptions associated with this account.
                        </div>
                      )}
                    </div>

                    {/* Services and Domains dual grids */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Services Card */}
                      <div className={`p-6 border rounded-2xl transition-all duration-300 ${
                        isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                            <Server className="w-4 h-4" />
                          </div>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Purchased Services</h3>
                        </div>

                        {crmDetails.services.length > 0 ? (
                          <div className="space-y-3">
                            {crmDetails.services.map((svc) => (
                              <div key={svc.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors hover:border-[#38b1f7]/30 ${
                                isDark ? 'bg-white/[0.01] border-white/[0.05]' : 'bg-slate-50/50 border-slate-100'
                              }`}>
                                <div className="space-y-1 min-w-0 pr-2">
                                  <span className={`block text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {svc.name}
                                  </span>
                                  <span className="block text-[9.5px] font-mono text-slate-455 truncate">
                                    ID: {svc.crmServiceId}
                                  </span>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-extrabold border ${
                                  svc.status.toUpperCase() === "ACTIVE"
                                    ? isDark ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border-emerald-150"
                                    : isDark ? "bg-amber-950/40 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-700 border-amber-150"
                                }`}>
                                  {svc.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed dark:border-white/[0.04]">
                            No services registered for this account.
                          </div>
                        )}
                      </div>

                      {/* Domains Card */}
                      <div className={`p-6 border rounded-2xl transition-all duration-300 ${
                        isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Globe className="w-4 h-4" />
                          </div>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Associated Domains</h3>
                        </div>

                        {crmDetails.domains.length > 0 ? (
                          <div className="space-y-3">
                            {crmDetails.domains.map((dom) => (
                              <div key={dom.id} className={`p-3 rounded-xl border flex items-center justify-between transition-colors hover:border-[#38b1f7]/30 ${
                                isDark ? 'bg-white/[0.01] border-white/[0.05]' : 'bg-slate-50/50 border-slate-100'
                              }`}>
                                <div className="space-y-1 min-w-0 pr-2">
                                  <span className={`block text-xs font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {dom.domainName}
                                  </span>
                                  <span className="block text-[9.5px] font-mono text-slate-455 truncate">
                                    ID: {dom.crmDomainId}
                                  </span>
                                </div>
                                <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-mono text-slate-455 border border-slate-250 dark:border-white/5`}>
                                  Verified
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed dark:border-white/[0.04]">
                            No domains linked to this profile.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Billing Transactions Log (1 col) */}
                  <div className="space-y-6">
                    <div className={`p-6 border rounded-2xl transition-all duration-300 ${
                      isDark ? 'bg-[#0F172A]/45 border-white/[0.04]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                          <History className="w-4 h-4" />
                        </div>
                        <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Credit Logs</h3>
                      </div>

                      {credits?.transactions && credits.transactions.length > 0 ? (
                        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                          {credits.transactions.map((tx: any) => {
                            const isAddition = tx.hours > 0;
                            return (
                              <div key={tx.id} className="relative pl-5 border-l-2 border-slate-100 dark:border-white/[0.05] pb-1">
                                {/* Bullet indicator */}
                                <div className={`absolute -left-[6px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                                  isDark ? 'border-[#020617]' : 'border-white'
                                } ${isAddition ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-450'}`} />

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className={`font-semibold ${isDark ? 'text-slate-355' : 'text-slate-500'}`}>
                                      {new Date(tx.createdAt).toLocaleDateString()}
                                    </span>
                                    <span className={`font-bold font-mono text-xs ${isAddition ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {isAddition ? "+" : ""}{tx.hours.toFixed(1)} hrs
                                    </span>
                                  </div>
                                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {tx.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-white/[0.01] rounded-xl border border-dashed dark:border-white/[0.04]">
                          No credit transactions found.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {activeTab === "tickets" && (
              <div className="grid lg:grid-cols-12 gap-8 items-start h-full">
                {/* Tickets list panel (7 cols if drawer is active, 12 if not) */}
                <div className={`${selectedTicketId ? "lg:col-span-5" : "lg:col-span-12"} space-y-4 transition-all duration-300`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#94A3B8]' : 'text-slate-500'}`}>My Tickets </h3>
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
                      <div className="p-8 flex items-center justify-center">
                        <Loader size="md" theme={theme} label="Loading ticket queue..." />
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
                      <div className="p-8 flex-grow flex items-center justify-center">
                        <Loader size="md" theme={theme} label="Retrieving ticket conversation..." />
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
                            {detailedTicket.createdBySecondaryEmail && (
                              <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[#38b1f7] bg-[#38b1f7]/10 border border-[#38b1f7]/25 px-2.5 py-1 rounded-lg w-fit font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#38b1f7] animate-pulse" />
                                <span>Created via secondary email: {detailedTicket.createdBySecondaryEmail}</span>
                              </div>
                            )}
                            {detailedTicket.attachments && detailedTicket.attachments.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.04] space-y-2">
                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Attachments / Screenshot Proofs
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                  {detailedTicket.attachments.map((att: any) => {
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
                                <Send className="w-4 h-4" />
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

            {activeTab === "kb" && (
              <div className="space-y-6">
                {selectedArticle ? (
                  /* KB Article Reader View */
                  <div className={`p-6 md:p-8 border rounded-2xl transition-all duration-300 ${
                    isDark ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-md'
                  }`}>
                    <div className="flex items-center justify-between border-b pb-4 mb-6">
                      <button
                        onClick={() => setSelectedArticle(null)}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Back to Articles</span>
                      </button>
                      <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                        <span>Reads: {selectedArticle.totalReads}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        {selectedArticle.category?.name && (
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full">
                            {selectedArticle.category.name}
                          </span>
                        )}
                        {selectedArticle.tags?.map((tag: string, index: number) => (
                          <span key={index} className="text-[10px] font-bold text-slate-650 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700/55">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {selectedArticle.title}
                      </h2>

                      <p className="text-xs text-slate-400 font-mono">
                        Published by {selectedArticle.author?.name || "Support"} on {new Date(selectedArticle.createdAt).toLocaleDateString()}
                      </p>

                      <div 
                        className={`prose prose-sm dark:prose-invert max-w-none pt-4 border-t whitespace-pre-wrap leading-relaxed text-sm ${
                          isDark ? 'text-slate-200 border-white/[0.05]' : 'text-slate-700 border-slate-100'
                        }`}
                        dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                      />
                    </div>
                  </div>
                ) : (
                  /* KB Browse View */
                  <div className="grid lg:grid-cols-4 gap-6 items-start">
                    {/* Left Column: Categories List */}
                    <div className={`p-5 border rounded-2xl space-y-4 lg:col-span-1 transition-all ${
                      isDark ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                    }`}>
                      <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Categories
                      </h3>
                      <div className="space-y-1">
                        <button
                          onClick={() => setSelectedKbCategory(null)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            selectedKbCategory === null
                              ? isDark
                                ? "bg-[#38b1f7]/15 text-[#38b1f7] border border-[#38b1f7]/25"
                                : "bg-[#38b1f7]/8 text-[#0d7fc0] border border-[#38b1f7]/20"
                              : isDark 
                                ? "text-slate-300 hover:bg-white/[0.03]" 
                                : "text-slate-655 hover:bg-slate-50"
                          }`}
                        >
                          All Categories
                        </button>
                        {(() => {
                          const map: Record<string, any> = {};
                          const roots: any[] = [];
                          kbCategories.forEach(c => {
                            map[c.id] = { ...c, children: [] };
                          });
                          kbCategories.forEach(c => {
                            const node = map[c.id];
                            if (c.parentId && map[c.parentId]) {
                              map[c.parentId].children.push(node);
                            } else {
                              roots.push(node);
                            }
                          });

                          const renderNode = (node: any, depth = 0): React.ReactNode => {
                            const hasChildren = node.children.length > 0;
                            const isSelected = selectedKbCategory === node.id;
                            return (
                              <React.Fragment key={node.id}>
                                <button
                                  onClick={() => setSelectedKbCategory(node.id)}
                                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between mt-1 ${
                                    isSelected
                                      ? isDark
                                        ? "bg-[#38b1f7]/15 text-[#38b1f7] border border-[#38b1f7]/25"
                                        : "bg-[#38b1f7]/8 text-[#0d7fc0] border border-[#38b1f7]/20"
                                      : isDark 
                                        ? "text-slate-300 hover:bg-white/[0.03]" 
                                        : "text-slate-655 hover:bg-slate-50"
                                  }`}
                                  style={{ paddingLeft: `${12 + depth * 12}px` }}
                                >
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="opacity-60 text-[10px] shrink-0">
                                      {depth > 0 ? "└─" : ""}
                                    </span>
                                    <Folder className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-sky-400/80' : 'text-[#0d7fc0]/80'}`} />
                                    <span className="truncate">{node.name}</span>
                                  </div>
                                  <span className="text-[10px] opacity-60 font-mono shrink-0">({node.article_count || 0})</span>
                                </button>
                                {hasChildren && node.children.map((c: any) => renderNode(c, depth + 1))}
                              </React.Fragment>
                            );
                          };

                          return roots.map(root => renderNode(root, 0));
                        })()}
                      </div>
                    </div>

                    {/* Right Column: Search & Articles Grid */}
                    <div className="lg:col-span-3 space-y-4">
                      {/* Search Bar */}
                      <div className="relative">
                        <input
                          type="text"
                          value={searchKb}
                          onChange={(e) => setSearchKb(e.target.value)}
                          placeholder="Search for articles, topics, or error codes..."
                          className={`w-full text-xs h-[48px] rounded-xl pl-10 pr-4 outline-none focus:ring-1 transition-all duration-200 ${
                            isDark
                              ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                              : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                          }`}
                        />
                        <Search className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                      </div>

                      {/* Articles Grid */}
                      {loadingKb ? (
                        <div className="p-8 flex items-center justify-center">
                          <Loader size="md" theme={theme} label="Loading knowledge base articles..." />
                        </div>
                      ) : kbArticles.length === 0 ? (
                        <div className={`p-8 text-center text-sm border rounded-2xl ${
                          isDark ? 'glass-card border-white/[0.06] text-slate-500' : 'bg-white border-slate-200 shadow-sm text-slate-400'
                        }`}>
                          No articles found matching search criteria.
                        </div>
                      ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                          {kbArticles.map((art) => (
                            <div
                              key={art.id}
                              onClick={() => handleReadArticle(art)}
                              className={`p-5 cursor-pointer text-left transition-all duration-200 border rounded-2xl flex flex-col justify-between h-[160px] ${
                                isDark
                                  ? "bg-[#0F172A]/45 border-white/[0.06] hover:border-[#38b1f7]/25 hover:bg-slate-900/20"
                                  : "bg-white border-slate-200/80 shadow-sm hover:border-[#38b1f7]/30 hover:bg-slate-50/50 hover:shadow-md"
                              }`}
                            >
                              <div>
                                <div className="flex items-center space-x-1.5 mb-2">
                                  {art.category?.name && (
                                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full">
                                      {art.category.name}
                                    </span>
                                  )}
                                </div>
                                <h4 className={`font-bold text-sm line-clamp-2 transition-colors ${
                                  isDark ? "text-slate-100 hover:text-[#38b1f7]" : "text-slate-800 hover:text-[#0d7fc0]"
                                }`}>{art.title}</h4>
                              </div>
                              
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-white/[0.03]">
                                <span>By {art.author?.name}</span>
                                <span>{art.totalReads || 0} reads</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "settings" && (
              <div className="grid md:grid-cols-3 gap-6 items-start">
                {/* Edit Form */}
                <div className={`p-6 border rounded-2xl md:col-span-2 transition-all ${
                  isDark ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <h3 className={`text-md font-bold tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Account Profile Settings
                  </h3>
                  
                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                      <input
                        type="text"
                        required
                        className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full ${
                          isDark
                            ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                            : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                        }`}
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, name: e.target.value }))}
                        disabled={submittingSettings}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address (Read Only)</label>
                      <input
                        type="email"
                        disabled
                        className={`text-sm h-[44px] rounded-xl outline-none px-4 w-full opacity-65 cursor-not-allowed ${
                          isDark
                            ? "bg-slate-950/40 border border-white/5 text-[#CBD5E1]"
                            : "bg-slate-100 border border-slate-200 text-slate-500"
                        }`}
                        value={user?.email || ""}
                      />
                    </div>

                    {/* New Password */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>New Password (Optional)</label>
                      <input
                        type="password"
                        placeholder="Leave blank to keep current password"
                        className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full ${
                          isDark
                            ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                            : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                        }`}
                        value={settingsForm.password}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, password: e.target.value }))}
                        disabled={submittingSettings}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Confirm Password</label>
                      <input
                        type="password"
                        placeholder="Verify your new password"
                        className={`text-sm h-[44px] rounded-xl outline-none focus:ring-1 transition-all duration-200 px-4 w-full ${
                          isDark
                            ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                            : "bg-white border border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                        }`}
                        value={settingsForm.confirmPassword}
                        onChange={(e) => setSettingsForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        disabled={submittingSettings}
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingSettings}
                        className="btn-cyber flex items-center space-x-2"
                      >
                        <span>{submittingSettings ? "Saving Settings..." : "Save Settings"}</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Metadata Details panel */}
                <div className={`p-6 border rounded-2xl md:col-span-1 space-y-6 transition-all ${
                  isDark ? 'glass-card bg-[#0F172A]/45 border-white/[0.06]' : 'bg-white border-slate-200/80 shadow-sm'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Profile Metadata
                    </h4>
                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between border-b pb-2 dark:border-white/[0.03] border-slate-150">
                        <span className="text-slate-400">User Role:</span>
                        <span className="text-emerald-500 font-bold">{user?.role}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 dark:border-white/[0.03] border-slate-150">
                        <span className="text-slate-400">Joined On:</span>
                        <span className={isDark ? "text-slate-200" : "text-slate-700"}>{user ? new Date(user.createdAt).toLocaleDateString() : ""}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 dark:border-white/[0.03] border-slate-150">
                        <span className="text-slate-400">Verified:</span>
                        <span className={user?.emailVerified ? "text-emerald-500 font-bold" : "text-amber-500 font-bold"}>
                          {user?.emailVerified ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex justify-between flex-wrap gap-2 pt-1">
                        <span className="text-slate-400">Account ID:</span>
                        <span className="text-[9px] text-slate-500 break-all">{user?.id}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Preferences
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Dark Theme:</span>
                      <button
                        onClick={toggleTheme}
                        className={`text-xs font-semibold px-3 py-1 border rounded-lg transition-all ${
                          isDark 
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        }`}
                      >
                        {isDark ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 4. Ticket Creation Modal — 3-Step Wizard */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className={`w-full overflow-hidden shadow-2xl border transition-all duration-500 rounded-2xl my-8 ${
            ["select-domain", "select-subscription", "select-service", "self-help"].includes(wizardStep) ? "max-w-2xl" : "max-w-xl"
          } ${
            isDark ? 'glass-card border-white/[0.08]' : 'bg-white border-slate-200 shadow-2xl'
          }`}>
            {/* ── Modal Header with Step Progress ───────────────────────────── */}
            <div className={`px-6 pt-5 pb-0 border-b transition-colors ${
              isDark ? 'border-[#1E293B]' : 'border-slate-100'
            }`}>
              {/* Title row */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`font-bold text-base tracking-tight ${
                    isDark ? 'text-[#F8FAFC]' : 'text-slate-900'
                  }`}>
                    {wizardStep === "select-domain" && "Select Affected Domain"}
                    {wizardStep === "select-subscription" && "Select Affected Subscription"}
                    {wizardStep === "select-service" && "Select Affected Service"}
                    {wizardStep === "self-help" && "💡 Search & Read Help Articles"}
                    {wizardStep === "intake" && "New Support Request"}
                    {wizardStep === "routing" && "Review & Submit"}
                  </h3>
                  <p className={`text-[11px] mt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-550'
                  }`}>
                    {wizardStep === "select-domain" && "Choose which domain is experiencing issues"}
                    {wizardStep === "select-subscription" && "Select the subscription plan linked to this domain"}
                    {wizardStep === "select-service" && "Select the subscribed service under that domain"}
                    {wizardStep === "self-help" && "Search for solutions instantly or read suggested articles"}
                    {wizardStep === "intake" && "Tell us what's happening and we'll route it to the right team"}
                    {wizardStep === "routing" && "Confirm your ticket details before sending"}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setWizardStep("select-domain");
                    setSelectedDomainId("");
                    setSelectedServiceId("");
                    setSelectedSubscriptionId("");
                    setSelectedServiceName("");
                    setCustomDomainInput("");
                    setUseCustomDomain(false);
                    setSelectedFile(null);
                    setSuggestedArticles([]);
                    setCreateError(null);
                    setFieldErrors({});
                    setModalKbSearch("");
                    setModalSelectedArticle(null);
                  }}
                  className={`p-1.5 rounded-lg transition-colors border shrink-0 ml-4 ${
                    isDark 
                      ? 'bg-slate-800/60 hover:bg-slate-700 border-slate-700/50 text-slate-400 hover:text-white' 
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step progress bar */}
              <div className="flex items-center gap-1 pb-4">
                {(() => {
                  const reg = (() => {
                    if (useCustomDomain) return "";
                    const selectedDomain = crmDetails.domains.find(d => d.crmDomainId === selectedDomainId);
                    return (selectedDomain?.registeredWith || "").trim().toUpperCase();
                  })();
                  const isOcs = reg === "OCS" || reg === "OCS (RC)" || reg === "WINS" || reg === "WINDS";

                  const steps = isOcs
                    ? (["select-domain", "select-subscription", "select-service", "self-help", "intake", "routing"] as const)
                    : (["select-domain", "intake", "routing"] as const);

                  const stepIndex = steps.indexOf(wizardStep as any);

                  return steps.map((step, idx) => {
                    const isActive = step === wizardStep;
                    const isDone = idx < stepIndex;
                    return (
                      <div key={step} className="flex items-center gap-1 flex-1">
                        <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                          isDone
                            ? 'bg-[#38b1f7]'
                            : isActive
                              ? 'bg-[#38b1f7]/50'
                              : isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`} />
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* ── STEP 1: SELECT DOMAIN ────────────────────────────────────────── */}
            {wizardStep === "select-domain" && (() => {
              const ocsDomains = crmDetails.domains.filter(d => {
                const reg = (d.registeredWith || "").trim().toUpperCase();
                return reg === "OCS" || reg === "OCS (RC)" || reg === "WINS" || reg === "WINDS";
              });
              const otherDomains = crmDetails.domains.filter(d => {
                const reg = (d.registeredWith || "").trim().toUpperCase();
                return reg !== "OCS" && reg !== "OCS (RC)" && reg !== "WINS" && reg !== "WINDS";
              });

              return (
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <h4 className={`text-sm font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
                      Select Affected Domain
                    </h4>
                    {loadingCrm ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-3">
                        <RefreshCw className="w-8 h-8 text-[#38b1f7] animate-spin" />
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                          Loading subscriptions and domains...
                        </p>
                      </div>
                    ) : crmDetails.domains.length > 0 ? (
                      <div className="space-y-6 max-h-[350px] overflow-y-auto pr-1">
                        
                        {/* Group 1: Registered with OCS */}
                        <div className="space-y-2.5">
                          <h5 className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-[#38b1f7]' : 'text-sky-700'}`}>
                            Registered with OCS
                          </h5>
                          {ocsDomains.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2.5">
                              {ocsDomains.map((d) => {
                                const isSelected = selectedDomainId === d.crmDomainId && !useCustomDomain;
                                return (
                                  <div
                                    key={d.crmDomainId || d.id}
                                    onClick={() => {
                                      setSelectedDomainId(d.crmDomainId);
                                      setUseCustomDomain(false);
                                      setCreateForm(prev => ({ ...prev, affectedDomain: d.domainName }));
                                      const sub = crmDetails.subscriptions.find(
                                        s => s.planName.trim().toLowerCase() === d.domainName.trim().toLowerCase()
                                      );
                                      setSelectedSubscriptionId(sub ? sub.crmSubscriptionId : "");
                                    }}
                                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                                      isSelected
                                        ? isDark
                                          ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]"
                                          : "bg-sky-50 border-[#38b1f7] shadow-sm"
                                        : isDark
                                          ? "bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50 hover:border-white/[0.08]"
                                          : "bg-white border-slate-200 hover:bg-slate-55 hover:border-slate-350"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        isSelected ? "bg-[#38b1f7]/20 text-[#38b1f7]" : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                                      }`}>
                                        <Globe className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                          {d.domainName}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#38b1f7] translate-x-0.5' : 'text-slate-500'}`} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={`text-[11px] italic pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              No domains registered with OCS found.
                            </p>
                          )}
                        </div>

                        {/* Group 2: Other Domains */}
                        <div className="space-y-2.5 pt-4 border-t border-slate-150 dark:border-white/[0.05]">
                          <div>
                            <h5 className={`text-[10px] font-extrabold uppercase tracking-wider ${isDark ? 'text-amber-400/90' : 'text-amber-700'}`}>
                              Domains not registered through OCS
                            </h5>
                            <div className={`mt-2 p-3 rounded-xl border text-[11px] leading-relaxed flex gap-2 ${
                              isDark 
                                ? 'bg-amber-950/20 border-amber-500/20 text-amber-400/90' 
                                : 'bg-amber-50/60 border-amber-200 text-amber-800'
                            }`}>
                              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                              <p>Support is available for these domains; however, the total time spent resolving tickets for these domains will be billed according to our support rates.</p>
                            </div>
                          </div>
                          {otherDomains.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2.5">
                              {otherDomains.map((d) => {
                                const isSelected = selectedDomainId === d.crmDomainId && !useCustomDomain;
                                return (
                                  <div
                                    key={d.crmDomainId || d.id}
                                    onClick={() => {
                                      setSelectedDomainId(d.crmDomainId);
                                      setUseCustomDomain(false);
                                      setCreateForm(prev => ({ ...prev, affectedDomain: d.domainName }));
                                      setSelectedSubscriptionId("");
                                      setSelectedServiceId("");
                                    }}
                                    className={`p-3 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                                      isSelected
                                        ? isDark
                                          ? "bg-amber-950/20 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.06)]"
                                          : "bg-amber-50/50 border-amber-300 shadow-sm"
                                        : isDark
                                          ? "bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50 hover:border-white/[0.08]"
                                          : "bg-white border-slate-200 hover:bg-slate-55 hover:border-slate-350"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                        isSelected ? "bg-amber-500/20 text-amber-500" : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                                      }`}>
                                        <Globe className="w-4 h-4" />
                                      </div>
                                      <div>
                                        <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                          {d.domainName}
                                        </p>
                                      </div>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-amber-500 translate-x-0.5' : 'text-slate-500'}`} />
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={`text-[11px] italic pl-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              No other domains found.
                            </p>
                          )}
                        </div>

                        {/* Custom / Enter manual domain option */}
                        <div className={`pt-4 border-t ${isDark ? 'border-white/[0.05]' : 'border-slate-100'}`}>
                          <div
                            onClick={() => {
                              setUseCustomDomain(true);
                              setSelectedDomainId("");
                              setSelectedSubscriptionId("");
                              setSelectedServiceId("");
                            }}
                            className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                              useCustomDomain
                                ? isDark
                                  ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]"
                                  : "bg-sky-50 border-[#38b1f7] shadow-sm"
                                : isDark
                                  ? "bg-slate-900/40 border-white/[0.04]"
                                  : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-2.5">
                              <input
                                type="radio"
                                checked={useCustomDomain}
                                onChange={() => {}}
                                className="w-3.5 h-3.5 accent-[#38b1f7]"
                              />
                              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-850'}`}>
                                Use a custom or different domain
                              </span>
                            </div>
                            {useCustomDomain && (
                              <input
                                type="text"
                                value={customDomainInput}
                                onChange={(e) => {
                                  setCustomDomainInput(e.target.value);
                                  setCreateForm(prev => ({ ...prev, affectedDomain: e.target.value }));
                                }}
                                placeholder="Enter domain (e.g. example.com)"
                                className={`w-full px-3 py-2 text-xs rounded-lg outline-none border transition-all ${
                                  isDark
                                    ? "bg-slate-950/60 border-white/[0.06] focus:border-[#38b1f7] text-white"
                                    : "bg-white border-slate-200 focus:border-[#38b1f7] text-slate-800"
                                }`}
                              />
                            )}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                          No domains found in your subscriptions. Please enter your domain name manually:
                        </p>
                        <input
                          type="text"
                          value={customDomainInput}
                          onChange={(e) => {
                            setCustomDomainInput(e.target.value);
                            setCreateForm(prev => ({ ...prev, affectedDomain: e.target.value }));
                            setUseCustomDomain(true);
                          }}
                          placeholder="Enter domain (e.g. example.com)"
                          className={`w-full px-3 py-2.5 text-xs rounded-xl outline-none border transition-all ${
                            isDark
                              ? "bg-slate-950/60 border-white/[0.06] focus:border-[#38b1f7] text-white"
                              : "bg-white border-slate-200 focus:border-[#38b1f7] text-slate-850"
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  <div className={`px-6 py-4 border-t flex items-center justify-between -mx-6 -mb-6 ${
                    isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!createForm.affectedDomain.trim()}
                      onClick={() => {
                        if (useCustomDomain) {
                          setWizardStep("intake");
                        } else {
                          const selectedDomain = crmDetails.domains.find(d => d.crmDomainId === selectedDomainId);
                          const reg = (selectedDomain?.registeredWith || "").trim().toUpperCase();
                          const isOcs = reg === "OCS" || reg === "OCS (RC)" || reg === "WINS" || reg === "WINDS";
                          if (isOcs) {
                            setWizardStep("select-subscription");
                          } else {
                            setWizardStep("intake");
                          }
                        }
                      }}
                      className="btn-cyber h-9 px-5 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <span>{(() => {
                        if (!createForm.affectedDomain.trim()) return "Next";
                        if (useCustomDomain) return "Next: Ticket Details";
                        const selectedDomain = crmDetails.domains.find(d => d.crmDomainId === selectedDomainId);
                        const reg = (selectedDomain?.registeredWith || "").trim().toUpperCase();
                        const isOcs = reg === "OCS" || reg === "OCS (RC)" || reg === "WINS" || reg === "WINDS";
                        return isOcs ? "Next: Select Subscription" : "Next: Ticket Details";
                      })()}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 1.5: SELECT SUBSCRIPTION ───────────────────────────────────── */}
            {wizardStep === "select-subscription" && (() => {
              const domainName = createForm.affectedDomain.trim().toLowerCase();
              const activeSubsForDomain = crmDetails.subscriptions.filter(s => 
                s.planName.trim().toLowerCase() === domainName && 
                (s.status.toUpperCase() === 'ACTIVE' || s.status.toUpperCase() === 'active')
              );

              return (
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
                        Select Subscription
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded bg-[#38b1f7]/10 text-[#38b1f7] font-semibold`}>
                        {createForm.affectedDomain}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {activeSubsForDomain.length > 0 ? (
                          activeSubsForDomain.map((sub) => {
                            const isSelected = selectedSubscriptionId === sub.crmSubscriptionId;
                            return (
                              <div
                                key={sub.id || sub.crmSubscriptionId}
                                onClick={() => {
                                  setSelectedSubscriptionId(sub.crmSubscriptionId);
                                }}
                                className={`p-4 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                                  isSelected
                                    ? isDark
                                      ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]"
                                      : "bg-sky-50 border-[#38b1f7] shadow-sm"
                                    : isDark
                                      ? "bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50 hover:border-white/[0.08]"
                                      : "bg-white border-slate-200 hover:bg-slate-55 hover:border-slate-350"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isSelected ? "bg-[#38b1f7]/20 text-[#38b1f7]" : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                                  }`}>
                                    <CreditCard className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {sub.planName}
                                    </p>
                                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      Started: {new Date(sub.startDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected ? 'border-[#38b1f7] bg-[#38b1f7]/10' : 'border-slate-400'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#38b1f7]" />}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`p-6 text-center rounded-xl border ${isDark ? 'bg-slate-900/40 border-white/[0.04]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              No active subscriptions found for this OCS domain.
                            </p>
                            <p className={`text-[11px] mb-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              You can proceed to ticket creation directly without a subscription.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSubscriptionId("");
                                setSelectedServiceId("");
                                setWizardStep("intake");
                              }}
                              className="btn-cyber h-8 px-4 text-[10px] inline-flex items-center gap-1.5"
                            >
                              <span>Proceed to Ticket Creation</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={`px-6 py-4 border-t flex items-center justify-between -mx-6 -mb-6 ${
                    isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setWizardStep("select-domain")}
                      className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!selectedSubscriptionId}
                      onClick={() => {
                        setSelectedServiceId("");
                        setWizardStep("select-service");
                      }}
                      className="btn-cyber h-9 px-5 text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      <span>Next: Select Service</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 2: SELECT SERVICE ───────────────────────────────────────── */}
            {wizardStep === "select-service" && (() => {
              const selectedSub = crmDetails.subscriptions.find(s => s.crmSubscriptionId === selectedSubscriptionId);
              const filteredServices = (selectedSub?.services || []).map((s: any) => ({
                id: s.serviceId,
                crmServiceId: s.serviceId,
                name: s.serviceName,
                status: "ACTIVE"
              }));

              return (
                <div className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isDark ? 'text-[#F8FAFC]' : 'text-slate-900'}`}>
                        Select Affected Service
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded bg-[#38b1f7]/10 text-[#38b1f7] font-semibold`}>
                        {createForm.affectedDomain}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-1">
                        {filteredServices.length > 0 ? (
                          filteredServices.map((s) => {
                            const isSelected = selectedServiceId === s.crmServiceId;
                            return (
                              <div
                                key={s.id || s.crmServiceId}
                                onClick={() => {
                                  setSelectedServiceId(s.crmServiceId);
                                  setSelectedServiceName(s.name);
                                }}
                                className={`p-4 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                                  isSelected
                                    ? isDark
                                      ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]"
                                      : "bg-sky-50 border-[#38b1f7] shadow-sm"
                                    : isDark
                                      ? "bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50 hover:border-white/[0.08]"
                                      : "bg-white border-slate-200 hover:bg-slate-55 hover:border-slate-350"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                    isSelected ? "bg-[#38b1f7]/20 text-[#38b1f7]" : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                                  }`}>
                                    <Server className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                      {s.name}
                                    </p>
                                    <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      Status: {s.status}
                                    </p>
                                  </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  isSelected ? 'border-[#38b1f7] bg-[#38b1f7]/10' : 'border-slate-400'
                                }`}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#38b1f7]" />}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={`p-4 text-center rounded-xl border ${isDark ? 'bg-slate-900/40 border-white/[0.04]' : 'bg-slate-50 border-slate-200'}`}>
                            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                              No active services found under this subscription. Proceeding with General Support.
                            </p>
                          </div>
                        )}

                        {/* General Query Fallback Option */}
                        <div
                          onClick={() => {
                            setSelectedServiceId("");
                            setSelectedServiceName("General Support");
                          }}
                          className={`p-4 rounded-xl border cursor-pointer text-left transition-all flex items-center justify-between ${
                            selectedServiceId === ""
                              ? isDark
                                ? "bg-sky-950/40 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.1)]"
                                : "bg-sky-50 border-[#38b1f7] shadow-sm"
                              : isDark
                                ? "bg-slate-900/40 border-white/[0.04] hover:bg-slate-800/50 hover:border-white/[0.08]"
                                : "bg-white border-slate-200 hover:bg-slate-55 hover:border-slate-350"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              selectedServiceId === "" ? "bg-[#38b1f7]/20 text-[#38b1f7]" : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500"
                            }`}>
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div>
                              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                General Support / Other Issues
                              </p>
                              <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                Choose this if your issue is not related to a specific active subscription package
                              </p>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                            selectedServiceId === "" ? 'border-[#38b1f7] bg-[#38b1f7]/10' : 'border-slate-400'
                          }`}>
                            {selectedServiceId === "" && <div className="w-2 h-2 rounded-full bg-[#38b1f7]" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`px-6 py-4 border-t flex items-center justify-between -mx-6 -mb-6 ${
                    isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setWizardStep("select-subscription")}
                      className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const q = selectedServiceId === "" ? "general" : selectedServiceName;
                        setModalKbSearch(q);
                        searchModalKb(q);
                        setWizardStep("self-help");
                      }}
                      className="btn-cyber h-9 px-5 text-xs flex items-center gap-1.5"
                    >
                      <span>Next: Suggested Solutions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 1: INTAKE FORM ─────────────────────────────────────────── */}
            {wizardStep === "intake" && (
              <form onSubmit={handleIntakeNext} className="overflow-y-auto max-h-[75vh]">
                <div className="p-6 space-y-5">

                  {/* Credit Balance Banner */}
                  {credits && (
                    <div className={`p-4 rounded-xl border flex items-center gap-4 ${
                      isDark
                        ? 'bg-gradient-to-r from-[#38b1f7]/8 to-emerald-500/5 border-[#38b1f7]/15'
                        : 'bg-gradient-to-r from-sky-50 to-emerald-50/60 border-sky-200/70'
                    }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-[#38b1f7]/15' : 'bg-[#38b1f7]/10'
                      }`}>
                        <CreditCard className="w-4 h-4 text-[#38b1f7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>Support Credit Balance</span>
                          <span className={`text-[11px] font-mono font-bold ${
                            credits.remainingHours > 0 ? 'text-emerald-500' : 'text-red-400'
                          }`}>{credits.remainingHours} hrs remaining</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                          isDark ? 'bg-slate-800' : 'bg-slate-200'
                        }`}>
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              credits.remainingHours > credits.allocatedHours * 0.3
                                ? 'bg-gradient-to-r from-[#38b1f7] to-emerald-400'
                                : credits.remainingHours > 0
                                  ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${credits.allocatedHours > 0 ? Math.min(100, (credits.remainingHours / credits.allocatedHours) * 100) : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className={`text-[9px] ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>{credits.usedHours} hrs used</span>
                          <span className={`text-[9px] ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>{credits.allocatedHours} hrs allocated</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {createError && (
                    <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                      isDark 
                        ? 'bg-red-950/40 border-red-500/20 text-red-400' 
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      {createError}
                    </div>
                  )}

                  {/* Selected Domain and Service Summary */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 justify-between ${
                    isDark ? 'bg-slate-900/45 border-white/[0.06] shadow-sm' : 'bg-slate-50/50 border-slate-200/80'
                  }`}>
                    <div className="flex-1 min-w-0">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>Selected Domain</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Globe className="w-3.5 h-3.5 text-[#38b1f7]" />
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {createForm.affectedDomain || "None"}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-slate-250 dark:border-white/[0.06]">
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>Selected Service</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {selectedServiceName || "General Support"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Issue Type Selector */}
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>Issue Type <span className="text-red-400">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          key: "billing" as const,
                          icon: Receipt,
                          label: "Billing / Renewals",
                          desc: "Invoices, subscriptions, renewals",
                          color: "text-violet-400",
                          bg: isDark ? "bg-violet-950/30 border-violet-500/20 hover:border-violet-500/40" : "bg-violet-50 border-violet-200 hover:border-violet-400",
                          activeBg: isDark ? "bg-violet-950/50 border-violet-400/60 shadow-[0_0_12px_rgba(167,139,250,0.12)]" : "bg-violet-100 border-violet-500",
                        },
                        {
                          key: "technical" as const,
                          icon: Cpu,
                          label: "Technical Support",
                          desc: "Config, connectivity, software issues",
                          color: "text-[#38b1f7]",
                          bg: isDark ? "bg-sky-950/30 border-sky-500/20 hover:border-sky-500/40" : "bg-sky-50 border-sky-200 hover:border-sky-400",
                          activeBg: isDark ? "bg-sky-950/50 border-[#38b1f7]/60 shadow-[0_0_12px_rgba(56,177,247,0.12)]" : "bg-sky-100 border-sky-500",
                        },
                        {
                          key: "critical" as const,
                          icon: ShieldAlert,
                          label: "Critical / Outage",
                          desc: "Service down, business blocked",
                          color: "text-red-400",
                          bg: isDark ? "bg-red-950/30 border-red-500/20 hover:border-red-500/40" : "bg-red-50 border-red-200 hover:border-red-400",
                          activeBg: isDark ? "bg-red-950/50 border-red-400/60 shadow-[0_0_12px_rgba(248,113,113,0.15)]" : "bg-red-100 border-red-500",
                        },
                        {
                          key: "other" as const,
                          icon: HelpCircle,
                          label: "General / Other",
                          desc: "Account queries, other requests",
                          color: isDark ? "text-slate-400" : "text-slate-500",
                          bg: isDark ? "bg-slate-800/40 border-slate-700/30 hover:border-slate-600" : "bg-slate-50 border-slate-200 hover:border-slate-400",
                          activeBg: isDark ? "bg-slate-800 border-slate-500 shadow-sm" : "bg-slate-200 border-slate-600",
                        },
                      ].map(({ key, icon: Icon, label, desc, color, bg, activeBg }) => {
                        const isSelected = createForm.issueType === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              // Auto-set priority for critical
                              const newPriority = key === "critical" ? "HIGH" : createForm.priority;
                              // Auto-set category for billing
                              let catId = createForm.categoryId;
                              if (key === "billing") {
                                const billingCat = categories.find(
                                  c => c.name.toLowerCase().includes("billing") || c.name.toLowerCase().includes("renew")
                                );
                                if (billingCat) catId = billingCat.id;
                              }
                              setCreateForm(prev => ({
                                ...prev,
                                issueType: key,
                                priority: newPriority,
                                categoryId: catId,
                              }));
                              setCreateError(null);
                            }}
                            className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                              isSelected ? activeBg : bg
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                              <span className={`text-xs font-bold ${
                                isSelected
                                  ? isDark ? 'text-white' : 'text-slate-900'
                                  : isDark ? 'text-slate-200' : 'text-slate-700'
                              }`}>{label}</span>
                            </div>
                            <p className={`text-[10px] leading-snug pl-5 ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}>{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>Ticket Title <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      placeholder="Brief summary of the issue"
                      className={`text-sm h-[42px] rounded-xl outline-none transition-all duration-200 px-4 w-full border ${
                        fieldErrors['title']
                          ? isDark
                            ? 'bg-slate-950/60 border-red-500/60 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] text-[#F8FAFC] placeholder:text-slate-600'
                            : 'bg-white border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] text-slate-900 placeholder:text-slate-400'
                          : isDark
                            ? 'bg-slate-950/60 border-white/[0.06] focus:border-[#38b1f7] focus:shadow-[0_0_0_3px_rgba(56,177,247,0.12)] text-[#F8FAFC] placeholder:text-slate-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:shadow-[0_0_0_3px_rgba(56,177,247,0.12)] text-slate-900 placeholder:text-slate-400'
                      }`}
                      value={createForm.title}
                      onChange={(e) => {
                        setCreateForm(prev => ({ ...prev, title: e.target.value }));
                        if (fieldErrors['title']) setFieldErrors(prev => { const n = {...prev}; delete n['title']; return n; });
                      }}
                      disabled={submittingCreate || loadingSuggestions}
                    />
                    {fieldErrors['title'] && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {fieldErrors['title']}
                      </p>
                    )}
                  </div>

                  {/* Affected Domain + Category — side by side */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <Globe className="w-3 h-3 inline-block mr-1 opacity-60" />
                        Affected Domain
                      </label>
                      <input
                        type="text"
                        disabled
                        placeholder="e.g. mycompany.com"
                        className={`text-sm h-[42px] rounded-xl outline-none px-4 w-full border ${
                          isDark
                            ? "bg-slate-950/20 border-white/[0.04] text-slate-500 cursor-not-allowed"
                            : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                        }`}
                        value={createForm.affectedDomain}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>Service Category</label>
                      <select
                        value={createForm.categoryId}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, categoryId: e.target.value }))}
                        className={`text-sm h-[42px] rounded-xl outline-none transition-all duration-200 px-3 w-full border appearance-none ${
                          isDark
                            ? "bg-[#0a0f1e] border-white/[0.06] focus:border-[#38b1f7] text-[#F8FAFC]"
                            : "bg-white border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] text-slate-900"
                        }`}
                        disabled={submittingCreate || loadingSuggestions || loadingCategories}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>Business Impact / Priority</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { val: "LOW", label: "Low", sub: "Usable, no impact", color: "text-slate-400", activeCls: isDark ? "border-slate-500 bg-slate-800" : "border-slate-500 bg-slate-100" },
                        { val: "MEDIUM", label: "Medium", sub: "Impact, workaround exists", color: "text-amber-400", activeCls: isDark ? "border-amber-500/60 bg-amber-950/30" : "border-amber-400 bg-amber-50" },
                        { val: "HIGH", label: "High / Urgent", sub: "Down, no workaround", color: "text-red-400", activeCls: isDark ? "border-red-500/60 bg-red-950/30" : "border-red-400 bg-red-50" },
                      ] as const).map(({ val, label, sub, color, activeCls }) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setCreateForm(prev => ({ ...prev, priority: val }))}
                          className={`p-2.5 rounded-xl border text-left transition-all duration-200 ${
                            createForm.priority === val
                              ? activeCls
                              : isDark ? 'bg-slate-900/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <span className={`text-[11px] font-bold block ${
                            createForm.priority === val ? color : isDark ? 'text-slate-300' : 'text-slate-700'
                          }`}>{label}</span>
                          <span className={`text-[9px] leading-snug ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`}>{sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>Problem Description <span className="text-red-400">*</span></label>
                      <span className={`text-[10px] font-mono ${
                        createForm.description.trim().length < 10
                          ? createForm.description.length > 0
                            ? 'text-amber-400'
                            : isDark ? 'text-slate-600' : 'text-slate-400'
                          : 'text-emerald-500'
                      }`}>
                        {createForm.description.trim().length}/10 min
                      </span>
                    </div>
                    <textarea
                      required
                      placeholder="Describe the issue in detail — what happened, when it started, steps to reproduce..."
                      rows={4}
                      className={`w-full p-3.5 text-sm rounded-xl outline-none transition-all duration-200 resize-none border ${
                        fieldErrors['description']
                          ? isDark
                            ? 'bg-slate-950/60 border-red-500/60 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)] text-[#F8FAFC] placeholder:text-slate-600'
                            : 'bg-white border-red-400 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)] text-slate-900 placeholder:text-slate-400'
                          : isDark
                            ? 'bg-slate-950/60 border-white/[0.06] focus:border-[#38b1f7] focus:shadow-[0_0_0_3px_rgba(56,177,247,0.12)] text-[#F8FAFC] placeholder:text-slate-600'
                            : 'bg-white border-slate-200 hover:border-slate-300 focus:border-[#38b1f7] focus:shadow-[0_0_0_3px_rgba(56,177,247,0.12)] text-slate-900 placeholder:text-slate-400'
                      }`}
                      value={createForm.description}
                      onChange={(e) => {
                        setCreateForm(prev => ({ ...prev, description: e.target.value }));
                        if (fieldErrors['description']) setFieldErrors(prev => { const n = {...prev}; delete n['description']; return n; });
                      }}
                      disabled={submittingCreate || loadingSuggestions}
                    />
                    {fieldErrors['description'] && (
                      <p className="text-[11px] text-red-400 flex items-center gap-1 mt-0.5">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        {fieldErrors['description']}
                      </p>
                    )}
                  </div>

                  {/* File Attachment */}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}>Attachment / Screenshot <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>(Optional)</span></label>
                    <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedFile
                        ? isDark ? 'border-[#38b1f7]/30 bg-[#38b1f7]/5' : 'border-[#38b1f7]/30 bg-sky-50'
                        : isDark ? 'border-white/[0.06] bg-slate-950/40 hover:border-white/10' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isDark ? 'bg-slate-800' : 'bg-slate-200'
                      }`}>
                        <Paperclip className={`w-3.5 h-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${
                          isDark ? 'text-slate-300' : 'text-slate-700'
                        }`}>
                          {selectedFile ? selectedFile.name : "Click to attach a file"}
                        </p>
                        <p className={`text-[10px] ${
                          isDark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : "PNG, JPG, PDF, ZIP — max 20 MB"}
                        </p>
                      </div>
                      {selectedFile && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}
                          className="text-red-400 hover:text-red-300 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className={`px-6 py-4 border-t flex items-center justify-between ${
                  isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                }`}>
                   <button
                    type="button"
                    onClick={() => {
                      setWizardStep("self-help");
                    }}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                      isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    disabled={loadingSuggestions}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="btn-cyber h-10 px-5 text-sm flex items-center gap-2"
                    disabled={loadingSuggestions}
                  >
                    {loadingSuggestions ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Checking KB...</span></>
                    ) : (
                      <><span>Continue</span><ArrowRight className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 2: SELF-HELP KB ARTICLES & SEARCH ────────────────────── */}
            {wizardStep === "self-help" && (
              <div className="overflow-y-auto max-h-[75vh]">
                {modalSelectedArticle ? (
                  /* Article Reader View inside Modal */
                  <div className="p-6 space-y-4">
                    <button
                      type="button"
                      onClick={() => setModalSelectedArticle(null)}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-all ${
                        isDark 
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/50' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Back to Search</span>
                    </button>
                    
                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {modalSelectedArticle.title}
                    </h3>
                    
                    <div 
                      className={`prose prose-sm dark:prose-invert max-w-none pt-4 border-t whitespace-pre-wrap leading-relaxed text-xs ${
                        isDark ? 'text-slate-200 border-white/[0.05]' : 'text-slate-700 border-slate-100'
                      }`}
                      dangerouslySetInnerHTML={{ __html: modalSelectedArticle.content }}
                    />
                    
                    <div className={`mt-6 pt-4 border-t flex flex-col items-center justify-between gap-4 ${
                      isDark ? 'border-white/[0.05]' : 'border-slate-150'
                    }`}>
                      <p className={`text-xs text-center font-semibold ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                        Did this self-help guide resolve your support issue?
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateModal(false);
                            setWizardStep("select-domain");
                            setModalSelectedArticle(null);
                            setModalKbSearch("");
                            toast.success("Awesome! We are glad this article solved your issue.");
                          }}
                          className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-emerald-500/20 text-emerald-450 bg-emerald-950/20 hover:bg-emerald-950/40 text-center animate-pulse"
                        >
                          ✅ Yes, this resolved my issue
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalSelectedArticle(null);
                            setWizardStep("intake");
                            setCreateForm(prev => ({
                              ...prev,
                              title: modalSelectedArticle.title.startsWith("How to ") ? modalSelectedArticle.title.replace("How to ", "") : modalSelectedArticle.title,
                              description: "I reviewed the self-help guide \"" + modalSelectedArticle.title + "\" but still need support because: ",
                            }));
                          }}
                          className="flex-1 btn-cyber h-9 text-xs flex items-center justify-center text-center shadow-none"
                        >
                          ❌ No, I need to raise a ticket
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* KB Search/List View inside Modal */
                  <div className="p-6 space-y-4">
                    {/* Search bar input */}
                    <div className="relative mb-2">
                      <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={modalKbSearch}
                        onChange={(e) => {
                          setModalKbSearch(e.target.value);
                          searchModalKb(e.target.value);
                        }}
                        placeholder="Search for password, Outlook, billing, domain, etc..."
                        className={`w-full pl-10 pr-4 py-2.5 text-xs h-[42px] rounded-xl outline-none focus:ring-1 transition-all ${
                          isDark
                            ? "bg-slate-950/60 border border-white/5 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-[#F8FAFC]"
                            : "bg-white border border-slate-200 focus:border-[#38b1f7] focus:ring-[#38b1f7] text-slate-900"
                        }`}
                      />
                    </div>

                    {/* Quick shortcuts row */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-450'} mr-1`}>
                        Shortcuts:
                      </span>
                      <button
                        type="button"
                        onClick={() => { setModalKbSearch("password"); searchModalKb("password"); }}
                        className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                          isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-850' : 'bg-slate-55 border-slate-200 text-slate-655 hover:bg-slate-100'
                        }`}
                      >
                        🔑 Password Reset
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalKbSearch("outlook"); searchModalKb("outlook"); }}
                        className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                          isDark ? 'bg-slate-800/40 border-slate-700 text-slate-300 hover:bg-slate-850' : 'bg-slate-55 border-slate-200 text-slate-655 hover:bg-slate-100'
                        }`}
                      >
                        📧 Outlook Config
                      </button>
                    </div>

                    {/* Results list */}
                    <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                      {loadingModalKb ? (
                        <div className="p-8 flex items-center justify-center">
                          <Loader size="sm" theme={theme} label="Searching knowledge base..." />
                        </div>
                      ) : modalKbArticles.length === 0 ? (
                        <div className={`p-8 text-center text-xs ${isDark ? 'text-slate-550' : 'text-slate-450'} border border-dashed rounded-xl dark:border-white/[0.03] border-slate-100`}>
                          No articles found for &quot;{modalKbSearch}&quot;. Search custom keywords or click shortcuts above.
                        </div>
                      ) : (
                        modalKbArticles.map((art) => (
                          <div
                            key={art.id}
                            onClick={() => setModalSelectedArticle(art)}
                            className={`p-4 rounded-xl border cursor-pointer text-left transition-all group ${
                              isDark
                                ? 'bg-slate-900/50 border-white/[0.05] hover:border-[#38b1f7]/25 hover:bg-slate-900'
                                : 'bg-white border-slate-200 hover:border-[#38b1f7]/30 hover:shadow-sm'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h4 className={`text-xs font-bold mb-1 transition-colors truncate ${
                                  isDark ? 'text-slate-100 group-hover:text-[#38b1f7]' : 'text-slate-850 group-hover:text-[#0d7fc0]'
                                }`}>{art.title}</h4>
                                <p className={`text-[10px] line-clamp-2 leading-relaxed ${
                                  isDark ? 'text-slate-400' : 'text-slate-550'
                                }`}>{art.content.replace(/<[^>]*>/g, '').substring(0, 140)}...</p>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform mt-0.5 shrink-0" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Footer Nav inside Search view */}
                    <div className={`px-6 py-4 -mx-6 -mb-6 border-t flex items-center justify-between ${
                      isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                    }`}>
                      <button
                        type="button"
                        onClick={() => {
                          setWizardStep("select-service");
                          setModalKbSearch("");
                          setModalKbArticles([]);
                        }}
                        className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                          isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setWizardStep("intake");
                          setCreateForm(prev => ({
                            ...prev,
                            issueType: prev.issueType || "technical",
                          }));
                        }}
                        className="btn-cyber h-10 px-5 text-xs flex items-center gap-2"
                      >
                        <span>Still need help — raise ticket</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: ROUTING PREVIEW + FINAL SUBMIT ───────────────────── */}
            {wizardStep === "routing" && (() => {
              // Determine routing destination for display
              const isBilling = createForm.issueType === "billing" ||
                categories.find(c => c.id === createForm.categoryId)?.name?.toLowerCase().includes("billing") ||
                categories.find(c => c.id === createForm.categoryId)?.name?.toLowerCase().includes("renew");
              const isCritical = createForm.issueType === "critical" || createForm.priority === "HIGH" || createForm.priority === "URGENT";

              type RoutingDest = { dept: string; who: string; icon: React.ElementType; color: string; bg: string; escalated?: boolean };

              const routing: RoutingDest = isCritical
                ? {
                    dept: "Critical Escalation",
                    who: "Support Level 1 + Manager L2",
                    icon: ShieldAlert,
                    color: "text-red-400",
                    bg: isDark ? "bg-red-950/30 border-red-500/25" : "bg-red-50 border-red-200",
                    escalated: true,
                  }
                : isBilling
                ? {
                    dept: "Billing & Renewals",
                    who: "Manjula",
                    icon: Receipt,
                    color: "text-violet-400",
                    bg: isDark ? "bg-violet-950/30 border-violet-500/25" : "bg-violet-50 border-violet-200",
                  }
                : {
                    dept: "Technical Support",
                    who: "Support Team",
                    icon: Cpu,
                    color: "text-[#38b1f7]",
                    bg: isDark ? "bg-sky-950/30 border-sky-500/25" : "bg-sky-50 border-sky-200",
                  };

              const RoutingIcon = routing.icon;

              return (
                <div className="overflow-y-auto max-h-[75vh]">
                  <div className="p-6 space-y-4">

                    {/* Ticket summary recap */}
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      isDark ? 'bg-slate-900/40 border-white/[0.05]' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <h4 className={`text-[10px] font-bold uppercase tracking-wider ${
                        isDark ? 'text-slate-500' : 'text-slate-400'
                      }`}>Ticket Summary</h4>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <FileText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isDark ? 'text-slate-500' : 'text-slate-400'
                          }`} />
                          <div>
                            <p className={`text-[10px] ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`}>Title</p>
                            <p className={`text-sm font-semibold ${
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>{createForm.title}</p>
                          </div>
                        </div>
                        {createForm.affectedDomain && (
                          <div className="flex items-start gap-2">
                            <Globe className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                              isDark ? 'text-slate-500' : 'text-slate-400'
                            }`} />
                            <div>
                              <p className={`text-[10px] ${
                                isDark ? 'text-slate-500' : 'text-slate-400'
                              }`}>Affected Domain</p>
                              <p className={`text-sm font-mono font-semibold ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}>{createForm.affectedDomain}</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4 pt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                            createForm.priority === "HIGH" || createForm.priority === "URGENT"
                              ? isDark ? 'text-red-400 border-red-500/25 bg-red-950/30' : 'text-red-700 border-red-200 bg-red-50'
                              : createForm.priority === "MEDIUM"
                                ? isDark ? 'text-amber-400 border-amber-500/25 bg-amber-950/30' : 'text-amber-700 border-amber-200 bg-amber-50'
                                : isDark ? 'text-slate-400 border-slate-700 bg-slate-800/40' : 'text-slate-600 border-slate-200 bg-slate-100'
                          }`}>
                            {createForm.priority} Priority
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                            isDark ? 'text-slate-300 border-slate-700 bg-slate-800/40' : 'text-slate-700 border-slate-200 bg-slate-100'
                          }`}>
                            {categories.find(c => c.id === createForm.categoryId)?.name || "General"}
                          </span>
                          {selectedFile && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-md border font-semibold ${
                              isDark ? 'text-sky-400 border-sky-500/25 bg-sky-950/30' : 'text-sky-700 border-sky-200 bg-sky-50'
                            }`}>
                              1 attachment
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Routing Destination Card */}
                    <div className={`p-4 rounded-xl border ${routing.bg}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <RoutingIcon className={`w-4 h-4 ${routing.color}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}>Routing Destination</span>
                        {routing.escalated && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/25">
                            ESCALATED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                          isDark ? 'bg-slate-900/60 border-white/[0.05]' : 'bg-white border-slate-200'
                        }`}>
                          <RoutingIcon className={`w-5 h-5 ${routing.color}`} />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}>{routing.dept}</p>
                          <p className={`text-xs ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            {routing.escalated
                              ? 'Routed to Support L1 with Manager L2 copied'
                              : `Assigned to: ${routing.who}`
                            }
                          </p>
                        </div>
                      </div>
                      {routing.escalated && (
                        <div className={`mt-3 pt-3 border-t flex items-center gap-2 ${
                          isDark ? 'border-red-500/15' : 'border-red-200'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <p className={`text-[11px] ${
                            isDark ? 'text-red-300/80' : 'text-red-600'
                          }`}>
                            High/critical priority tickets are escalated to both Support Level 1 and Manager L2 simultaneously.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Credit impact note */}
                    {credits && (
                      <div className={`p-3 rounded-xl border flex flex-col gap-2 ${
                        isDark ? 'bg-slate-900/40 border-white/[0.05]' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center gap-3">
                          <CreditCard className={`w-4 h-4 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                          <p className={`text-[11px] leading-relaxed ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            You have <strong className={credits.remainingHours > 0 ? 'text-emerald-500' : 'text-red-400'}>{credits.remainingHours} credit hours</strong> remaining. Support hours are deducted when the ticket is resolved.
                            {credits.remainingHours === 0 && " Overage hours will be billed."}
                          </p>
                        </div>
                        {(!crmDetails?.domains || crmDetails.domains.length === 0) && (
                          <div className={`mt-1.5 pt-1.5 border-t flex items-center gap-2 ${
                            isDark ? 'border-amber-500/15 text-amber-400' : 'border-amber-200 text-amber-600'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                            <span className="text-[10px] font-semibold">Min billing 1/2 hour (for domains outside of OCS)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {createError && (
                      <div className={`p-3 rounded-lg text-xs font-medium border flex items-center gap-2 ${
                        isDark
                          ? 'bg-red-950/40 border-red-500/20 text-red-400'
                          : 'bg-red-50 border-red-200 text-red-700'
                      }`}>
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {createError}
                      </div>
                    )}
                  </div>

                  <div className={`px-6 py-4 border-t flex items-center justify-between gap-3 ${
                    isDark ? 'border-[#1E293B] bg-slate-900/20' : 'border-slate-100 bg-slate-50/50'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setWizardStep("intake")}
                      className={`flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
                        isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                      }`}
                      disabled={submittingCreate}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => executeTicketCreation()}
                      className="btn-cyber h-10 px-6 text-sm flex items-center gap-2"
                      disabled={submittingCreate}
                    >
                      {submittingCreate ? (
                        <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Submitting...</span></>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /><span>Submit Ticket</span></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
