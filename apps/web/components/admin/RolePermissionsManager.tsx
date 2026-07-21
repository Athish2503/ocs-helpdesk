"use client";

import React, { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Search,
  X,
  Grid,
  Layers,
  Ticket,
  BookOpen,
  BarChart2,
  Settings,
  Coins,
  RefreshCw,
  Sparkles,
  UserCheck,
  Filter,
  Eye,
  Sliders,
  ChevronRight,
  ChevronDown,
  AlertCircle
} from "lucide-react";

export interface RolePermissionRecord {
  role: string;
  permissions: string[];
}

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface RolePermissionsManagerProps {
  rolePermissions: RolePermissionRecord[];
  users: UserSummary[];
  isDark: boolean;
  savingPermissionsRole: string | null;
  onTogglePermission: (role: string, permissionKey: string, enabled: boolean) => Promise<void> | void;
  onCreateCustomRole: (roleName: string, initialPermissions?: string[]) => Promise<void> | void;
  onDeleteCustomRole: (roleName: string) => Promise<void> | void;
}

// ── Permission Definition & Category System ──────────────────────────────────
export interface PermissionDef {
  key: string;
  name: string;
  desc: string;
  categoryId: string;
  icon: React.ElementType;
}

export interface PermissionCategory {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  badgeBgLight: string;
  badgeBgDark: string;
  badgeTextLight: string;
  badgeTextDark: string;
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: "tickets",
    name: "Ticket Operations",
    desc: "Queue access, responding, and assignment",
    icon: Ticket,
    badgeBgLight: "bg-blue-50 border-blue-200",
    badgeBgDark: "bg-blue-500/10 border-blue-500/20",
    badgeTextLight: "text-blue-700",
    badgeTextDark: "text-blue-400",
  },
  {
    id: "kb",
    name: "Knowledge Base",
    desc: "Documentation and article publishing",
    icon: BookOpen,
    badgeBgLight: "bg-purple-50 border-purple-200",
    badgeBgDark: "bg-purple-500/10 border-purple-500/20",
    badgeTextLight: "text-purple-700",
    badgeTextDark: "text-purple-400",
  },
  {
    id: "sla",
    name: "SLA & Metrics",
    desc: "Service level targets and analytics",
    icon: BarChart2,
    badgeBgLight: "bg-amber-50 border-amber-200",
    badgeBgDark: "bg-amber-500/10 border-amber-500/20",
    badgeTextLight: "text-amber-700",
    badgeTextDark: "text-amber-400",
  },
  {
    id: "routing",
    name: "Categories & Rules",
    desc: "Classification and routing automation",
    icon: Settings,
    badgeBgLight: "bg-emerald-50 border-emerald-200",
    badgeBgDark: "bg-emerald-500/10 border-emerald-500/20",
    badgeTextLight: "text-emerald-700",
    badgeTextDark: "text-emerald-400",
  },
  {
    id: "credits",
    name: "Credits & Billing",
    desc: "Client support balance management",
    icon: Coins,
    badgeBgLight: "bg-cyan-50 border-cyan-200",
    badgeBgDark: "bg-cyan-500/10 border-cyan-500/20",
    badgeTextLight: "text-cyan-700",
    badgeTextDark: "text-cyan-400",
  },
  {
    id: "admin",
    name: "Staff & Governance",
    desc: "Teams, permissions, and security",
    icon: ShieldCheck,
    badgeBgLight: "bg-rose-50 border-rose-200",
    badgeBgDark: "bg-rose-500/10 border-rose-500/20",
    badgeTextLight: "text-rose-700",
    badgeTextDark: "text-rose-400",
  },
];

export const PERMISSIONS_LIST: PermissionDef[] = [
  {
    key: "view_tickets",
    name: "View Tickets",
    desc: "Allows viewing ticket queues and reading customer ticket communications",
    categoryId: "tickets",
    icon: Eye,
  },
  {
    key: "reply_tickets",
    name: "Reply to Tickets",
    desc: "Allows posting agent responses and private notes on tickets",
    categoryId: "tickets",
    icon: Ticket,
  },
  {
    key: "assign_tickets",
    name: "Assign Tickets",
    desc: "Allows changing ticket assignees, escalation levels, and team dispatch",
    categoryId: "tickets",
    icon: UserCheck,
  },
  {
    key: "manage_kb",
    name: "Manage KB",
    desc: "Allows creating, editing, categorizing, and publishing articles",
    categoryId: "kb",
    icon: BookOpen,
  },
  {
    key: "view_sla",
    name: "View SLA Metrics",
    desc: "Allows inspecting SLA performance, breach rates, and response metrics",
    categoryId: "sla",
    icon: BarChart2,
  },
  {
    key: "manage_sla",
    name: "Manage SLA Policies",
    desc: "Allows creating and editing SLA target response & resolution hours",
    categoryId: "sla",
    icon: Sliders,
  },
  {
    key: "manage_categories_rules",
    name: "Manage Categories & Rules",
    desc: "Allows CRUD operations on ticket categories and automated routing rules",
    categoryId: "routing",
    icon: Settings,
  },
  {
    key: "adjust_credits",
    name: "Adjust Client Credits",
    desc: "Allows granting, deducting, or editing service credit hours for accounts",
    categoryId: "credits",
    icon: Coins,
  },
  {
    key: "manage_teams",
    name: "Manage Teams",
    desc: "Allows creating agent teams, modifying team membership and assignment",
    categoryId: "admin",
    icon: Layers,
  },
  {
    key: "manage_permissions",
    name: "Manage Permissions",
    desc: "Allows configuring role permission matrix, staff directory, and custom roles",
    categoryId: "admin",
    icon: ShieldCheck,
  },
];

const SYSTEM_ROLES = ["ADMIN", "CUSTOMER", "AGENT", "SUPERVISOR", "SUPPORT_L1", "SUPPORT_L2", "BILLING"];

const ROLE_PRESETS: { id: string; name: string; desc: string; perms: string[] }[] = [
  {
    id: "full",
    name: "Full Admin",
    desc: "Grants all 10 system permissions",
    perms: PERMISSIONS_LIST.map((p) => p.key),
  },
  {
    id: "agent",
    name: "Standard Support Agent",
    desc: "View, reply, assign tickets, view SLA & KB access",
    perms: ["view_tickets", "reply_tickets", "assign_tickets", "view_sla", "manage_kb"],
  },
  {
    id: "lead",
    name: "Team Lead / Supervisor",
    desc: "Full ticket ops, teams, SLAs, KB & routing rules",
    perms: ["view_tickets", "reply_tickets", "assign_tickets", "manage_teams", "manage_kb", "view_sla", "manage_sla", "manage_categories_rules"],
  },
  {
    id: "billing",
    name: "Billing Specialist",
    desc: "View tickets and adjust customer credit balances",
    perms: ["view_tickets", "adjust_credits"],
  },
  {
    id: "read_only",
    name: "Read-Only Auditor",
    desc: "View tickets and view SLA analytics without modification rights",
    perms: ["view_tickets", "view_sla"],
  },
  {
    id: "none",
    name: "Clear All",
    desc: "Revokes all permissions",
    perms: [],
  },
];

export default function RolePermissionsManager({
  rolePermissions,
  users,
  isDark,
  savingPermissionsRole,
  onTogglePermission,
  onCreateCustomRole,
  onDeleteCustomRole,
}: RolePermissionsManagerProps) {
  const [viewMode, setViewMode] = useState<"matrix" | "inspector">("matrix");
  const [selectedRole, setSelectedRole] = useState<string>("ADMIN");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>("");
  const [newRolePreset, setNewRolePreset] = useState<string>("agent");
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Filtered list of permissions based on search and category filter
  const filteredPermissions = useMemo(() => {
    return PERMISSIONS_LIST.filter((perm) => {
      const matchesCategory = categoryFilter === "all" || perm.categoryId === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || perm.name.toLowerCase().includes(q) || perm.desc.toLowerCase().includes(q) || perm.key.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, categoryFilter]);

  // Group filtered permissions by category
  const permissionsByCategory = useMemo(() => {
    const map: Record<string, PermissionDef[]> = {};
    PERMISSION_CATEGORIES.forEach((cat) => {
      map[cat.id] = filteredPermissions.filter((p) => p.categoryId === cat.id);
    });
    return map;
  }, [filteredPermissions]);

  // Count active staff members per role
  const roleUserCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    rolePermissions.forEach((rp) => {
      counts[rp.role] = users.filter((u) => u.role === rp.role).length;
    });
    return counts;
  }, [rolePermissions, users]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const activeRoleRecord = rolePermissions.find((rp) => rp.role === selectedRole) || rolePermissions[0];

  // Helper to handle bulk preset application for a role
  const applyPresetToRole = async (roleName: string, permKeys: string[]) => {
    const currentPerms = rolePermissions.find((r) => r.role === roleName)?.permissions || [];
    const toEnable = permKeys.filter((k) => !currentPerms.includes(k));
    const toDisable = currentPerms.filter((k) => !permKeys.includes(k));

    for (const key of toEnable) {
      await onTogglePermission(roleName, key, true);
    }
    for (const key of toDisable) {
      if (roleName === "ADMIN" && key === "manage_permissions") continue;
      await onTogglePermission(roleName, key, false);
    }
  };

  // Helper for category-level bulk select
  const toggleCategoryForRole = async (roleName: string, categoryId: string, enable: boolean) => {
    const catPerms = PERMISSIONS_LIST.filter((p) => p.categoryId === categoryId).map((p) => p.key);
    for (const key of catPerms) {
      if (roleName === "ADMIN" && key === "manage_permissions" && !enable) continue;
      await onTogglePermission(roleName, key, enable);
    }
  };

  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRoleName.trim().toUpperCase().replace(/\s+/g, "_");
    if (!cleanName) return;

    const presetObj = ROLE_PRESETS.find((p) => p.id === newRolePreset);
    const initialPerms = presetObj ? presetObj.perms : [];

    await onCreateCustomRole(cleanName, initialPerms);
    setNewRoleName("");
    setIsAddRoleModalOpen(false);
    setSelectedRole(cleanName);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Controls ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${isDark ? "bg-[#38b1f7]/10 border-[#38b1f7]/20 text-[#38b1f7]" : "bg-sky-50 border-sky-100 text-sky-600"}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                Role Access Control & Permissions
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                Manage system role permissions, staff security boundaries, and custom role matrix dynamically.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle Switch */}
          <div className={`flex items-center p-1 rounded-xl border ${isDark ? "bg-[#0c1525] border-white/10" : "bg-slate-100 border-slate-200"}`}>
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "matrix"
                  ? isDark
                    ? "bg-[#38b1f7] text-white shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              Matrix View
            </button>
            <button
              onClick={() => setViewMode("inspector")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === "inspector"
                  ? isDark
                    ? "bg-[#38b1f7] text-white shadow-sm"
                    : "bg-white text-slate-900 shadow-sm"
                  : isDark
                  ? "text-slate-400 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Role Inspector
            </button>
          </div>

          {/* Add Custom Role Button */}
          <button
            onClick={() => setIsAddRoleModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#38b1f7] to-[#0284c7] hover:opacity-95 active:scale-[0.98] transition-all shadow-md shadow-[#38b1f7]/20"
          >
            <Plus className="w-4 h-4" />
            New Custom Role
          </button>
        </div>
      </div>

      {/* ── Search & Filtering Bar ─────────────────────────────────────────── */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        isDark ? "bg-[#0c1525]/90 border-white/[0.08]" : "bg-white border-slate-200/80 shadow-sm"
      }`}>
        <div className="relative flex-1">
          <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by name, key, or description..."
            className={`w-full pl-10 pr-9 py-2 text-xs rounded-xl border transition-all outline-none ${
              isDark
                ? "bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-[#38b1f7]"
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-[#38b1f7] focus:bg-white"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full ${
                isDark ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills / Filter Dropdown */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className={`text-[11px] font-medium mr-1 flex items-center gap-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <Filter className="w-3 h-3" /> Category:
          </span>
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              categoryFilter === "all"
                ? isDark
                  ? "bg-[#38b1f7]/20 text-[#38b1f7] border border-[#38b1f7]/30 font-semibold"
                  : "bg-sky-100 text-sky-800 border border-sky-200 font-semibold"
                : isDark
                ? "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            All ({PERMISSIONS_LIST.length})
          </button>
          {PERMISSION_CATEGORIES.map((cat) => {
            const count = PERMISSIONS_LIST.filter((p) => p.categoryId === cat.id).length;
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                  active
                    ? isDark
                      ? `${cat.badgeBgDark} ${cat.badgeTextDark} border font-semibold`
                      : `${cat.badgeBgLight} ${cat.badgeTextLight} border font-semibold`
                    : isDark
                    ? "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 1: MATRIX GRID VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "matrix" && (
        <div className={`rounded-2xl border overflow-hidden transition-all ${
          isDark ? "bg-[#0c1525]/90 border-white/[0.08]" : "bg-white border-slate-200/80 shadow-sm"
        }`}>
          <div className="overflow-x-auto relative max-h-[680px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 backdrop-blur-md">
                <tr className={`border-b ${isDark ? "bg-[#0c1525]/95 border-white/[0.08]" : "bg-slate-50/95 border-slate-200"}`}>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider min-w-[280px]">
                    <span className={isDark ? "text-slate-300" : "text-slate-700"}>Permission Action</span>
                  </th>
                  {rolePermissions.map((rp) => {
                    const isSystemRole = SYSTEM_ROLES.includes(rp.role);
                    const userCount = roleUserCounts[rp.role] || 0;
                    const isSaving = savingPermissionsRole === rp.role;

                    return (
                      <th key={rp.role} className="p-3 text-center min-w-[130px] group border-l border-inherit">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${
                                rp.role === "ADMIN"
                                  ? isDark
                                    ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                  : isSystemRole
                                  ? isDark
                                    ? "bg-[#38b1f7]/15 border-[#38b1f7]/30 text-[#38b1f7]"
                                    : "bg-sky-50 border-sky-200 text-sky-700"
                                  : isDark
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                                  : "bg-emerald-50 border-emerald-200 text-emerald-700"
                              }`}
                            >
                              {rp.role}
                            </span>
                            {!isSystemRole && (
                              <button
                                onClick={() => setRoleToDelete(rp.role)}
                                className="text-rose-500 hover:text-rose-600 hover:scale-110 active:scale-95 transition-all p-0.5 rounded cursor-pointer"
                                title={`Delete role ${rp.role}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                              {userCount} {userCount === 1 ? "user" : "users"}
                            </span>
                            {isSaving && (
                              <RefreshCw className="w-3 h-3 text-[#38b1f7] animate-spin" />
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td colSpan={rolePermissions.length + 1} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle className={`w-8 h-8 ${isDark ? "text-slate-600" : "text-slate-300"}`} />
                        <p className={`text-sm font-semibold ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                          No permissions match your filter query.
                        </p>
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setCategoryFilter("all");
                          }}
                          className="text-xs text-[#38b1f7] hover:underline"
                        >
                          Reset Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  PERMISSION_CATEGORIES.map((cat) => {
                    const catPerms = permissionsByCategory[cat.id] || [];
                    if (catPerms.length === 0) return null;
                    const isCollapsed = collapsedCategories[cat.id];

                    return (
                      <React.Fragment key={cat.id}>
                        {/* Category Section Header Row */}
                        <tr className={`border-y ${isDark ? "bg-slate-900/80 border-white/[0.06]" : "bg-slate-100/70 border-slate-200"}`}>
                          <td colSpan={rolePermissions.length + 1} className="py-2.5 px-4">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => toggleCategoryCollapse(cat.id)}
                                className="flex items-center gap-2 text-xs font-bold hover:opacity-80 transition-all cursor-pointer"
                              >
                                {isCollapsed ? (
                                  <ChevronRight className="w-4 h-4 text-[#38b1f7]" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-[#38b1f7]" />
                                )}
                                <cat.icon className="w-4 h-4 text-[#38b1f7]" />
                                <span className={isDark ? "text-white" : "text-slate-900"}>{cat.name}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isDark ? cat.badgeBgDark + " " + cat.badgeTextDark : cat.badgeBgLight + " " + cat.badgeTextLight
                                }`}>
                                  {catPerms.length} {catPerms.length === 1 ? "item" : "items"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Permission Rows inside Category */}
                        {!isCollapsed &&
                          catPerms.map((perm) => (
                            <tr
                              key={perm.key}
                              className={`border-b transition-colors ${
                                isDark ? "border-white/[0.04] hover:bg-white/[0.02]" : "border-slate-100 hover:bg-slate-50/80"
                              }`}
                            >
                              <td className="p-3.5 pr-4">
                                <div className="flex items-start gap-2.5">
                                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                                    isDark ? "bg-slate-900 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
                                  }`}>
                                    <perm.icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className={`text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                                        {perm.name}
                                      </p>
                                      <code className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                        isDark ? "bg-slate-900 text-slate-500 border border-white/5" : "bg-slate-100 text-slate-500 border border-slate-200"
                                      }`}>
                                        {perm.key}
                                      </code>
                                    </div>
                                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                      {perm.desc}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              {rolePermissions.map((rp) => {
                                const hasPerm = rp.permissions.includes(perm.key);
                                const isSaving = savingPermissionsRole === rp.role;
                                const isProtectedAdmin = rp.role === "ADMIN" && perm.key === "manage_permissions";

                                return (
                                  <td key={rp.role} className="p-3 text-center border-l border-inherit">
                                    <div className="flex justify-center items-center">
                                      <label
                                        className={`relative inline-flex items-center justify-center p-1 rounded-lg transition-all cursor-pointer ${
                                          isProtectedAdmin
                                            ? "opacity-60 cursor-not-allowed"
                                            : isSaving
                                            ? "opacity-50 cursor-wait"
                                            : "hover:scale-110 active:scale-95"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={hasPerm}
                                          disabled={isSaving || isProtectedAdmin}
                                          onChange={(e) => onTogglePermission(rp.role, perm.key, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className={`w-9 h-5 rounded-full peer transition-colors duration-200 ease-in-out ${
                                          hasPerm
                                            ? "bg-[#38b1f7]"
                                            : isDark
                                            ? "bg-slate-800 border border-white/10"
                                            : "bg-slate-200 border border-slate-300"
                                        } peer-disabled:opacity-50`}>
                                          <div className={`w-3.5 h-3.5 mt-0.75 ml-0.75 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm ${
                                            hasPerm ? "translate-x-4" : "translate-x-0"
                                          }`} />
                                        </div>
                                      </label>
                                    </div>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW 2: ROLE INSPECTOR CARD VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {viewMode === "inspector" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Role Sidebar Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className={`p-4 rounded-2xl border ${
              isDark ? "bg-[#0c1525]/90 border-white/[0.08]" : "bg-white border-slate-200/80 shadow-sm"
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Roles Directory ({rolePermissions.length})
                </h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isDark ? "bg-white/[0.06] text-slate-400" : "bg-slate-100 text-slate-600"
                }`}>
                  Select to Inspect
                </span>
              </div>

              <div className="space-y-1.5">
                {rolePermissions.map((rp) => {
                  const isSelected = rp.role === selectedRole;
                  const isSystemRole = SYSTEM_ROLES.includes(rp.role);
                  const activePermsCount = rp.permissions.length;
                  const userCount = roleUserCounts[rp.role] || 0;

                  return (
                    <button
                      key={rp.role}
                      onClick={() => setSelectedRole(rp.role)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                        isSelected
                          ? isDark
                            ? "bg-[#38b1f7]/15 border-[#38b1f7]/40 shadow-sm"
                            : "bg-sky-50 border-sky-300 shadow-sm"
                          : isDark
                          ? "bg-slate-900/40 border-white/[0.05] hover:bg-white/[0.03] hover:border-white/10"
                          : "bg-slate-50 border-slate-200/60 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          isSelected
                            ? "bg-[#38b1f7] text-white"
                            : isDark
                            ? "bg-slate-800 text-slate-400"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold truncate ${
                              isSelected
                                ? isDark
                                  ? "text-white"
                                  : "text-sky-950"
                                : isDark
                                ? "text-slate-200"
                                : "text-slate-800"
                            }`}>
                              {rp.role}
                            </span>
                            {!isSystemRole && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Custom
                              </span>
                            )}
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                            {activePermsCount} of {PERMISSIONS_LIST.length} permissions active • {userCount} staff
                          </p>
                        </div>
                      </div>

                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? "text-[#38b1f7] translate-x-0.5" : isDark ? "text-slate-600" : "text-slate-400"
                      }`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Role Inspector Panel */}
          <div className="lg:col-span-8 space-y-4">
            {activeRoleRecord && (
              <div className={`p-6 rounded-2xl border space-y-6 ${
                isDark ? "bg-[#0c1525]/90 border-white/[0.08]" : "bg-white border-slate-200/80 shadow-sm"
              }`}>
                {/* Role Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border tracking-wide ${
                        activeRoleRecord.role === "ADMIN"
                          ? isDark
                            ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                            : "bg-rose-50 border-rose-200 text-rose-700"
                          : SYSTEM_ROLES.includes(activeRoleRecord.role)
                          ? isDark
                            ? "bg-[#38b1f7]/15 border-[#38b1f7]/30 text-[#38b1f7]"
                            : "bg-sky-50 border-sky-200 text-sky-700"
                          : isDark
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-emerald-50 border-emerald-200 text-emerald-700"
                      }`}>
                        {activeRoleRecord.role}
                      </span>
                      <span className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                        {roleUserCounts[activeRoleRecord.role] || 0} active members assigned
                      </span>
                    </div>
                    <p className={`text-xs mt-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Configure individual permission toggles or apply quick permission presets for this role.
                    </p>
                  </div>

                  {/* Preset Shortcuts Menu */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-bold mr-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Presets:
                    </span>
                    {ROLE_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPresetToRole(activeRoleRecord.role, preset.perms)}
                        title={preset.desc}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          isDark
                            ? "bg-slate-900 border-white/10 text-slate-300 hover:bg-[#38b1f7]/20 hover:border-[#38b1f7]/40 hover:text-[#38b1f7]"
                            : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-700"
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Permission Categories Accordion / Grid */}
                <div className="space-y-4">
                  {PERMISSION_CATEGORIES.map((cat) => {
                    const catPerms = permissionsByCategory[cat.id] || [];
                    if (catPerms.length === 0) return null;

                    const enabledInCat = catPerms.filter((p) => activeRoleRecord.permissions.includes(p.key)).length;
                    const isAllCatEnabled = enabledInCat === catPerms.length;

                    return (
                      <div
                        key={cat.id}
                        className={`rounded-xl border overflow-hidden ${
                          isDark ? "bg-slate-900/50 border-white/[0.06]" : "bg-slate-50/80 border-slate-200/80"
                        }`}
                      >
                        <div className="p-3 px-4 flex items-center justify-between border-b border-inherit">
                          <div className="flex items-center gap-2">
                            <cat.icon className="w-4 h-4 text-[#38b1f7]" />
                            <h4 className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                              {cat.name}
                            </h4>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              enabledInCat === catPerms.length
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                : enabledInCat > 0
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                : isDark
                                ? "bg-slate-800 text-slate-500"
                                : "bg-slate-200 text-slate-500"
                            }`}>
                              {enabledInCat}/{catPerms.length} Enabled
                            </span>
                          </div>

                          <button
                            onClick={() => toggleCategoryForRole(activeRoleRecord.role, cat.id, !isAllCatEnabled)}
                            className="text-[11px] font-semibold text-[#38b1f7] hover:underline cursor-pointer"
                          >
                            {isAllCatEnabled ? "Deselect Category" : "Select Category"}
                          </button>
                        </div>

                        <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {catPerms.map((perm) => {
                            const isEnabled = activeRoleRecord.permissions.includes(perm.key);
                            const isProtectedAdmin = activeRoleRecord.role === "ADMIN" && perm.key === "manage_permissions";

                            return (
                              <div
                                key={perm.key}
                                onClick={() => {
                                  if (!isProtectedAdmin) {
                                    onTogglePermission(activeRoleRecord.role, perm.key, !isEnabled);
                                  }
                                }}
                                className={`p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                  isEnabled
                                    ? isDark
                                      ? "bg-[#38b1f7]/10 border-[#38b1f7]/30"
                                      : "bg-sky-50/80 border-sky-200"
                                    : isDark
                                    ? "bg-slate-900/80 border-white/[0.04] opacity-70 hover:opacity-100"
                                    : "bg-white border-slate-200/60 opacity-80 hover:opacity-100"
                                }`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${
                                    isEnabled
                                      ? "bg-[#38b1f7] text-white border-transparent"
                                      : isDark
                                      ? "bg-slate-800 text-slate-500 border-white/10"
                                      : "bg-slate-100 text-slate-400 border-slate-200"
                                  }`}>
                                    <perm.icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <p className={`text-xs font-bold ${isDark ? "text-slate-100" : "text-slate-900"}`}>
                                      {perm.name}
                                    </p>
                                    <p className={`text-[11px] mt-0.5 leading-snug ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                      {perm.desc}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 mt-0.5">
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    disabled={isProtectedAdmin}
                                    onChange={(e) => onTogglePermission(activeRoleRecord.role, perm.key, e.target.checked)}
                                    className="rounded w-4 h-4 cursor-pointer accent-[#38b1f7]"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CREATE NEW CUSTOM ROLE
      ══════════════════════════════════════════════════════════════════════ */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-5 ${
            isDark ? "bg-[#0c1525] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#38b1f7]/10 text-[#38b1f7]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Create Custom Role</h3>
                  <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Add a custom access level for staff members
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRoleModalOpen(false)}
                className={`p-1.5 rounded-lg ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRoleSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Role Identification Identifier *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TIER_3_SPECIALIST"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono uppercase tracking-wide transition-all ${
                    isDark
                      ? "bg-slate-900/80 border-white/10 text-white focus:border-[#38b1f7]"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#38b1f7]"
                  }`}
                />
                <p className={`text-[10px] mt-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  Will be formatted automatically into UPPERCASE_WITH_UNDERSCORES.
                </p>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  Initial Permission Template Preset
                </label>
                <select
                  value={newRolePreset}
                  onChange={(e) => setNewRolePreset(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none transition-all ${
                    isDark
                      ? "bg-slate-900 border-white/10 text-white focus:border-[#38b1f7]"
                      : "bg-slate-50 border-slate-200 text-slate-900 focus:border-[#38b1f7]"
                  }`}
                >
                  {ROLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} — {preset.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border ${
                    isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newRoleName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#38b1f7] hover:bg-[#38b1f7]/90 rounded-xl transition-all disabled:opacity-50"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: DELETE CONFIRMATION FOR CUSTOM ROLE
      ══════════════════════════════════════════════════════════════════════ */}
      {roleToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-sm p-6 rounded-2xl border shadow-2xl space-y-4 ${
            isDark ? "bg-[#0c1525] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
          }`}>
            <div className="flex items-center gap-3 text-rose-500">
              <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Role?</h3>
                <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Action cannot be undone
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              Are you sure you want to delete the custom role <strong className="text-rose-500">{roleToDelete}</strong>? Users currently assigned to this role will lose their custom privileges.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-inherit">
              <button
                onClick={() => setRoleToDelete(null)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl border ${
                  isDark ? "border-white/10 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await onDeleteCustomRole(roleToDelete);
                  if (selectedRole === roleToDelete) {
                    setSelectedRole("ADMIN");
                  }
                  setRoleToDelete(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
