"use client";

import React from "react";
import { Tag } from "lucide-react";

interface TagItem {
  name: string;
  count: number;
}

interface TagFilterProps {
  tags: TagItem[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export default function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  if (tags.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        <Tag size={13} />
        <span>Popular Tags</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedTag && (
          <button
            onClick={() => onSelectTag(null)}
            className="text-xs px-2.5 py-1 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors font-medium"
          >
            Clear Tag filter
          </button>
        )}

        {tags.map((tag) => {
          const isSelected = selectedTag === tag.name;
          return (
            <button
              key={tag.name}
              onClick={() => onSelectTag(isSelected ? null : tag.name)}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 font-medium ${
                isSelected
                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                  : "bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>#{tag.name}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  isSelected ? "bg-blue-700 text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {tag.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
