"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

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

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
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

export default function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: CategorySidebarProps) {
  const tree = buildCategoryTree(categories);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const router = useRouter();

  const canManage = user && (user.role === "ADMIN" || user.role === "AGENT");

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderNode = (node: CategoryNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedCategoryId === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          onClick={() => onSelectCategory(node.id)}
          className={`flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 group text-sm ${
            isSelected
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
          style={{ paddingLeft: `${Math.max(12, depth * 16)}px` }}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {hasChildren ? (
              <button
                onClick={(e) => toggleExpand(node.id, e)}
                className={`p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors ${
                  isSelected ? "hover:bg-blue-700 text-white" : "text-slate-400"
                }`}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <span className="w-4" />
            )}

            {isExpanded ? (
              <FolderOpen size={16} className={isSelected ? "text-white" : "text-blue-500"} />
            ) : (
              <Folder size={16} className={isSelected ? "text-white" : "text-slate-400 group-hover:text-blue-500"} />
            )}
            <span className="truncate font-medium">{node.name}</span>
          </div>

          {node.article_count !== undefined && node.article_count > 0 && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                isSelected ? "bg-blue-700 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {node.article_count}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 flex flex-col gap-0.5">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col gap-1.5">
      <div className="flex items-center justify-between px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <span>Categories</span>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              type="button"
              onClick={() => router.push("/admin/dashboard/kb/categories")}
              className="text-blue-600 dark:text-blue-400 hover:underline normal-case font-semibold text-xs"
            >
              Manage
            </button>
          )}
          {selectedCategoryId && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 normal-case font-semibold text-xs"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <div
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all text-sm font-medium ${
            selectedCategoryId === null
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}
        >
          <FolderOpen size={16} className={selectedCategoryId === null ? "text-white" : "text-blue-500"} />
          <span>All Articles</span>
        </div>

        {tree.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
