"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Folder, FolderOpen, Plus, Edit2, Trash2, ArrowRight } from "lucide-react";
import { fetchWithAuth } from "../../../../../lib/api";
import { useDialog } from "../../../../../context/DialogContext";

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

  categories.forEach((cat) => {
    map[cat.id] = { ...cat, children: [] };
  });

  categories.forEach((cat) => {
    const node = map[cat.id];
    if (cat.parentId && map[cat.parentId]) {
      map[cat.parentId].children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function CategoryManagementPage() {
  const router = useRouter();
  const dialog = useDialog();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetchWithAuth("/kb/categories");
      const resData = await response.json();
      if (response.ok) {
        setCategories(resData.data.categories || []);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const body = {
      name: name.trim(),
      description: description.trim() || null,
      parentId: parentId || null,
    };

    try {
      let response;
      if (editingId) {
        response = await fetchWithAuth(`/kb/categories/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        response = await fetchWithAuth("/kb/categories", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      if (response.ok) {
        setName("");
        setDescription("");
        setParentId("");
        setEditingId(null);
        loadCategories();
      }
    } catch (err) {
      console.error("Failed to save category:", err);
    }
  };

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setDescription(cat.description || "");
    setParentId(cat.parentId || "");
  };

  const handleDelete = async (id: string) => {
    const confirmed = await dialog.confirm("Are you sure? Articles in this category will be unassigned (orphan categories).", "Delete Category");
    if (!confirmed) return;
    try {
      const response = await fetchWithAuth(`/kb/categories/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        loadCategories();
      }
    } catch (err) {
      console.error("Failed to delete category:", err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setParentId("");
  };

  const tree = buildCategoryTree(categories);

  const renderNode = (node: CategoryNode, depth = 0) => {
    return (
      <div key={node.id} className="flex flex-col gap-1">
        <div
          className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-all"
          style={{ marginLeft: `${depth * 20}px` }}
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1 rounded bg-slate-50 dark:bg-slate-800 text-blue-500 flex-shrink-0">
              <Folder size={16} />
            </div>
            <div className="truncate">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{node.name}</h4>
              {node.description && (
                <p className="text-xs text-slate-400 truncate max-w-sm mt-0.5">{node.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
              {node.article_count || 0} articles
            </span>
            <button
              onClick={() => handleEdit(node)}
              className="p-1.5 text-slate-400 hover:text-blue-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => handleDelete(node.id)}
              className="p-1.5 text-slate-400 hover:text-red-500 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 text-slate-800 dark:text-slate-100">
      {/* Title block */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/dashboard/kb")}
            className="p-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">Category Dashboard</h1>
            <p className="text-xs text-slate-400">Add, nest, and rename category nodes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create / Edit Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm sticky top-6"
          >
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">
              {editingId ? "Edit Category" : "New Category"}
            </h3>

            <div className="flex flex-col gap-4">
              {/* Category Name */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Troubleshooting, Billing"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Parent Category Selector */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Parent Category</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {categories
                    .filter((cat) => cat.id !== editingId) // Prevent nesting in self
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the topics covered in this category"
                  rows={3}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  {editingId ? "Update Node" : "Create Node"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-500 rounded-lg text-xs font-bold transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Tree List View */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px]">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400 font-semibold mt-2">Loading categories...</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px] text-center">
              <FolderOpen size={48} className="text-slate-300 dark:text-slate-700 mb-2" />
              <h3 className="text-sm font-bold">No Categories Configured</h3>
              <p className="text-xs text-slate-400 mt-1">
                Add your first category node using the form on the left to structure your articles.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1 mb-2">
                Hierarchical Category Tree
              </h3>
              {tree.map((node) => renderNode(node, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
