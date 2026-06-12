"use client";

import React from "react";
import { Search, RotateCcw, Filter } from "lucide-react";

interface AdvancedFiltersProps {
  search: string;
  isPublished: string; // "all" | "true" | "false"
  isInternal: string; // "all" | "true" | "false"
  onSearchChange: (val: string) => void;
  onPublishedChange: (val: string) => void;
  onInternalChange: (val: string) => void;
  onReset: () => void;
  showStatusFilters?: boolean;
}

export default function AdvancedFilters({
  search,
  isPublished,
  isInternal,
  onSearchChange,
  onPublishedChange,
  onInternalChange,
  onReset,
  showStatusFilters = true,
}: AdvancedFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search articles, documentation, troubleshooting..."
          className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {showStatusFilters && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Published State Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter size={12} /> Status
            </span>
            <select
              value={isPublished}
              onChange={(e) => onPublishedChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="true">Published Only</option>
              <option value="false">Drafts Only</option>
            </select>
          </div>

          {/* Internal vs Customer Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Filter size={12} /> Visibility
            </span>
            <select
              value={isInternal}
              onChange={(e) => onInternalChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Visibilities</option>
              <option value="false">Customer Facing</option>
              <option value="true">Internal Only</option>
            </select>
          </div>
        </div>
      )}

      {/* Reset Button */}
      {(search || isPublished !== "all" || isInternal !== "all") && (
        <button
          onClick={onReset}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
}
