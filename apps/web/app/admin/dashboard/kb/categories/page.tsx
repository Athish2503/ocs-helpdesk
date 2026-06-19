"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Folder,
  FolderOpen,
  Edit2,
  Trash2,
  Plus,
  X,
  Search,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/api";
import { useDialog } from "../../../../../context/DialogContext";
import Loader from "../../../../../components/Loader";

interface Category {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  parentId: string | null;
  article_count?: number;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
}

function buildCategoryTree(categories: Category[]): CategoryNode[] {
  const map: Record<string, CategoryNode> = {};
  const roots: CategoryNode[] = [];
  categories.forEach(cat => { map[cat.id] = { ...cat, children: [] }; });
  categories.forEach(cat => {
    const node = map[cat.id];
    if (cat.parentId && map[cat.parentId]) map[cat.parentId].children.push(node);
    else roots.push(node);
  });
  return roots;
}

export default function CategoryManagementPage() {
  const router = useRouter();
  const dialog = useDialog();

  // Theme — reactive tracker
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Expansion States
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Checkbox Bulk states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/kb/categories");
      const data = await res.json();
      if (res.ok) setCategories(data.data.categories || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const body = { name: name.trim(), description: description.trim() || null, parentId: parentId || null };
    try {
      const res = editingId
        ? await fetchWithAuth(`/kb/categories/${editingId}`, { method: "PATCH", body: JSON.stringify(body) })
        : await fetchWithAuth("/kb/categories", { method: "POST", body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        setName("");
        setDescription("");
        setParentId("");
        setEditingId(null);
        load();
      } else {
        await dialog.alert(data.error?.message || "Failed to save category.", "Error");
      }
    } catch (err) {
      console.error(err);
      await dialog.alert("An unexpected error occurred.", "Error");
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id); setName(cat.name);
    setDescription(cat.description || ""); setParentId(cat.parentId || "");
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Articles in this category will be uncategorized. Continue?", "Delete Category");
    if (!confirmed) return;
    try {
      const res = await fetchWithAuth(`/kb/categories/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedIds(prev => prev.filter(x => x !== id));
        load();
      }
    } catch (err) { console.error(err); }
  };

  // Expand / Collapse controls
  const expandAll = () => {
    const next: Record<string, boolean> = {};
    categories.forEach(c => { next[c.id] = true; });
    setExpandedNodes(next);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  // Breadcrumbs Generator for Search Flat View
  const getPathName = (cat: Category) => {
    const path = [cat.name];
    let current = cat;
    while (current.parentId) {
      const parent = categories.find(c => c.id === current.parentId);
      if (parent) {
        path.unshift(parent.name);
        current = parent;
      } else {
        break;
      }
    }
    return path.join(" > ");
  };

  // Bulk deletion logic
  const handleBulkDelete = async () => {
    const confirmed = await dialog.confirm(
      `Are you sure you want to delete the ${selectedIds.length} selected categories? Articles in these categories will be uncategorized.`,
      "Bulk Delete Categories"
    );
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await fetchWithAuth(`/kb/categories/${id}`, { method: "DELETE" });
      }
      setSelectedIds([]);
      load();
    } catch (err) {
      console.error("Bulk deletion failed:", err);
      await dialog.alert("Bulk deletion failed.", "Error");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Build tree data
  const tree = buildCategoryTree(categories);

  // Search filtering
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderNode = (node: CategoryNode, depth = 0): React.ReactNode => {
    const isSelected = selectedIds.includes(node.id);
    const isNodeExpanded = !!expandedNodes[node.id];
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex flex-col gap-1.5">
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
            isSelected
              ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]/30" : "bg-blue-50 border-blue-200"
              : isDark ? "bg-white/[0.02] border-white/[0.05] hover:border-[#38b1f7]/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(node.id)}
              className="rounded border-slate-300 dark:border-slate-700 accent-blue-600 w-4 h-4 cursor-pointer"
            />

            {/* Folder Toggle */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedNodes(prev => ({ ...prev, [node.id]: !prev[node.id] }));
                }}
                className={`p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${isDark ? "text-slate-400" : "text-slate-500"}`}
              >
                {isNodeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-5" />
            )}

            <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? "bg-[#38b1f7]/10 text-[#5fc0f9]" : "bg-blue-50 text-blue-600"}`}>
              {hasChildren && isNodeExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <h4 className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>{node.name}</h4>
              {node.description && (
                <p className={`text-xs truncate max-w-sm ${isDark ? "text-slate-500" : "text-slate-400"}`}>{node.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`admin-badge ${isDark ? "bg-white/[0.05] text-slate-400 border-white/[0.06]" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
              {node.article_count ?? 0} articles
            </span>
            <button onClick={() => handleEdit(node)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-[#5fc0f9] hover:bg-white/[0.05]" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => handleDelete(node.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-950/15" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {hasChildren && isNodeExpanded && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className={`p-5 md:p-7 space-y-6 min-h-full admin-fade-in ${isDark ? "admin-dark" : ""}`}>
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin/dashboard/kb")}
          className={`p-2 rounded-xl border transition-colors ${isDark ? "border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.05]" : "border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-base font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Category Management</h1>
          <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>Add, nest, and rename category nodes to organize your knowledge base.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Create / Edit Form */}
        <div className="lg:col-span-1">
          <div className={`admin-card p-5 sticky top-6 ${isDark ? "admin-dark" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                {editingId ? "Edit Category" : "New Category"}
              </h2>
              {editingId && (
                <button onClick={() => { setEditingId(null); setName(""); setDescription(""); setParentId(""); }} className={`p-1 rounded-lg ${isDark ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-700"}`}>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="admin-form-group">
                <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Name <span className="text-red-500">*</span></label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Billing, Troubleshooting" className={`admin-input ${isDark ? "admin-dark" : ""}`} />
              </div>
              <div className="admin-form-group">
                <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Parent Category</label>
                <select value={parentId} onChange={e => setParentId(e.target.value)} className={`admin-select ${isDark ? "admin-dark" : ""}`}>
                  <option value="">None (Top Level)</option>
                  {categories.filter(c => c.id !== editingId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label className={`admin-form-label ${isDark ? "admin-dark" : ""}`}>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe what this category covers…" rows={3} className={`admin-textarea ${isDark ? "admin-dark" : ""}`} style={{ resize: "none" }} />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" className="admin-btn admin-btn-primary flex-1">
                  {editingId ? "Save Changes" : <><Plus className="w-3.5 h-3.5" />Create</>}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setName(""); setDescription(""); setParentId(""); }} className="admin-btn admin-btn-ghost">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Category tree / list view */}
        <div className="lg:col-span-2">
          {/* Toolbar panel */}
          {categories.length > 0 && (
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.05] p-3 rounded-2xl`}>
              {/* Search Bar */}
              <div className="relative flex-1 max-w-sm">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories..."
                  className={`admin-input ${isDark ? "admin-dark" : ""} pl-10 text-xs w-full`}
                  style={{ height: 38 }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold ${isDark ? "text-slate-500 hover:text-slate-350" : "text-slate-400 hover:text-slate-700"}`}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tree Expand/Collapse Controls */}
              {!searchQuery && (
                <div className="flex items-center gap-2 select-none">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="admin-btn admin-btn-ghost text-xs px-2.5"
                    style={{ height: 38 }}
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="admin-btn admin-btn-ghost text-xs px-2.5"
                    style={{ height: 38 }}
                  >
                    Collapse All
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bulk Action dashboard */}
          {selectedIds.length > 0 && (
            <div className={`flex items-center justify-between p-3.5 mb-4 rounded-2xl border ${
              isDark 
                ? "bg-blue-950/20 border-[#38b1f7]/20 text-[#5fc0f9]" 
                : "bg-blue-50 border-blue-100 text-blue-800"
            } animate-fade-in`}>
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedIds.length === categories.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(categories.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                  className="rounded border-slate-350 accent-blue-600 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {selectedIds.length} select{selectedIds.length !== 1 ? "ed" : "ed"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBulkDeleting}
                  onClick={handleBulkDelete}
                  className="admin-btn admin-btn-danger text-xs px-3.5 flex items-center gap-1.5"
                  style={{ height: 34 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isBulkDeleting ? "Deleting..." : "Delete Selected"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="admin-btn admin-btn-ghost text-xs px-3.5"
                  style={{ height: 34 }}
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className={`admin-card py-16 flex flex-col items-center justify-center gap-3 ${isDark ? "admin-dark" : ""}`}>
              <Loader size="md" variant="inline" theme={isDark ? "dark" : "light"} label="Loading categories…" />
            </div>
          ) : categories.length === 0 ? (
            <div className={`admin-card py-12 ${isDark ? "admin-dark" : ""}`}>
              <div className="admin-empty-state">
                <FolderOpen className={`w-10 h-10 ${isDark ? "text-slate-700" : "text-slate-300"}`} />
                <h3>No categories yet</h3>
                <p>Create your first category using the form to start organizing your articles.</p>
              </div>
            </div>
          ) : searchQuery ? (
            // Search flat list view showing paths
            <div className="space-y-2">
              <p className={`text-[11px] font-semibold uppercase tracking-wider px-1 mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                Found {filteredCategories.length} matching categories
              </p>
              {filteredCategories.length === 0 ? (
                <p className={`text-xs text-center py-6 ${isDark ? "text-slate-500" : "text-slate-450"}`}>
                  No categories match "{searchQuery}"
                </p>
              ) : (
                filteredCategories.map(cat => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? isDark ? "bg-[#38b1f7]/8 border-[#38b1f7]/30" : "bg-blue-50 border-blue-200"
                          : isDark ? "bg-white/[0.02] border-white/[0.05] hover:border-[#38b1f7]/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(cat.id)}
                          className="rounded border-slate-300 dark:border-slate-700 accent-blue-600 w-4 h-4 cursor-pointer"
                        />
                        <div className={`p-1.5 rounded-lg flex-shrink-0 ${isDark ? "bg-[#38b1f7]/10 text-[#5fc0f9]" : "bg-blue-50 text-blue-600"}`}>
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden mr-2">
                          <h4 className={`text-sm font-semibold truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}>{cat.name}</h4>
                          <p className={`text-[10px] font-medium truncate ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                            Path: {getPathName(cat)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`admin-badge ${isDark ? "bg-white/[0.05] text-slate-400 border-white/[0.06]" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                          {cat.article_count ?? 0} articles
                        </span>
                        <button onClick={() => handleEdit(cat)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-[#5fc0f9] hover:bg-white/[0.05]" : "text-slate-400 hover:text-blue-600 hover:bg-blue-50"}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(cat.id)} className={`p-1.5 rounded-lg transition-colors ${isDark ? "text-slate-500 hover:text-red-400 hover:bg-red-950/15" : "text-slate-400 hover:text-red-500 hover:bg-red-50"}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            // Tree view
            <div className="space-y-2">
              <p className={`text-[11px] font-semibold uppercase tracking-wider px-1 mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                {categories.length} categor{categories.length !== 1 ? "ies" : "y"}
              </p>
              {tree.map(node => renderNode(node, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
