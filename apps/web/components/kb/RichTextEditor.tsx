"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Image,
  Quote,
  Code,
  Minus,
  Trash2,
  Undo,
  Redo,
  ChevronDown,
  Palette,
  Highlighter
} from "lucide-react";
import { useDialog } from "../../context/DialogContext";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const PREDEFINED_COLORS = [
  "#000000", // Black
  "#ffffff", // White
  "#ef4444", // Red
  "#f97316", // Orange
  "#f59e0b", // Yellow
  "#10b981", // Green
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#64748b", // Slate
];

const PREDEFINED_HIGHLIGHTS = [
  "#fef08a", // Light Yellow
  "#bbf7d0", // Light Green
  "#bfdbfe", // Light Blue
  "#e9d5ff", // Light Purple
  "#fbcfe8", // Light Pink
  "#fcd34d", // Amber
  "#fda4af", // Rose
  "#fed7aa", // Light Orange
  "#cbd5e1", // Light Slate
  "#e2e8f0", // Light Gray
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your article content here..."
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);
  const dialog = useDialog();

  // Active Dropdowns state
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null); // "font" | "heading" | "size" | "color" | "highlight" | null
  
  // Custom recent colors lists
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [recentHighlights, setRecentHighlights] = useState<string[]>([]);

  // Current detected styling state at cursor
  const [editorState, setEditorState] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    subscript: false,
    superscript: false,
    code: false,
    blockquote: false,
    ol: false,
    ul: false,
    heading: "",
    alignment: "left",
    fontFamily: "",
    fontSize: "",
    color: "",
    backgroundColor: "",
  });

  // Convert computed rgb/rgba colors to Hex format
  const rgbToHex = (rgb: string) => {
    if (!rgb) return "";
    if (rgb.startsWith("#")) return rgb;
    const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!match) return rgb;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const a = match[4] ? parseFloat(match[4]) : 1;
    if (a === 0) return "";
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Traverse hierarchy up from the selection node to get formatting rules
  const detectActiveStyles = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);

    // Only detect styling if selection focus is within the editor element
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    let bold = false;
    let italic = false;
    let underline = false;
    let strikeThrough = false;
    let subscript = false;
    let superscript = false;

    try {
      bold = document.queryCommandState("bold");
      italic = document.queryCommandState("italic");
      underline = document.queryCommandState("underline");
      strikeThrough = document.queryCommandState("strikeThrough");
      subscript = document.queryCommandState("subscript");
      superscript = document.queryCommandState("superscript");
    } catch (e) {}

    let code = false;
    let blockquote = false;
    let ol = false;
    let ul = false;
    let heading = "";
    let alignment = "left";
    let fontFamily = "";
    let fontSize = "";
    let color = "";
    let backgroundColor = "";

    let node: Node | null = range.startContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode;
    }

    let el = node as HTMLElement | null;
    while (el && editorRef.current.contains(el) && el !== editorRef.current) {
      const tag = el.tagName.toLowerCase();
      if (tag === "code") code = true;
      if (tag === "blockquote") blockquote = true;
      if (tag === "ol") ol = true;
      if (tag === "ul") ul = true;
      if (/^h[1-6]$/.test(tag)) heading = tag;

      const style = window.getComputedStyle(el);

      if (style.textAlign && style.textAlign !== "start" && style.textAlign !== "initial" && !alignment) {
        alignment = style.textAlign;
      }
      if (style.fontFamily && !fontFamily) {
        fontFamily = style.fontFamily;
      }
      if (style.fontSize && !fontSize) {
        fontSize = style.fontSize;
      }
      if (style.color && !color) {
        color = rgbToHex(style.color);
      }
      if (style.backgroundColor && style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)" && !backgroundColor) {
        backgroundColor = rgbToHex(style.backgroundColor);
      }

      el = el.parentElement;
    }

    // Alignment fallback check
    if (!alignment || alignment === "start") {
      try {
        if (document.queryCommandState("justifyCenter")) alignment = "center";
        else if (document.queryCommandState("justifyRight")) alignment = "right";
        else if (document.queryCommandState("justifyFull")) alignment = "justify";
        else alignment = "left";
      } catch (e) {
        alignment = "left";
      }
    }

    // Try queryCommandValue for fonts and sizes
    try {
      if (!fontFamily) fontFamily = document.queryCommandValue("fontName") || "";
      if (!fontSize) fontSize = document.queryCommandValue("fontSize") || "";
    } catch (e) {}

    setEditorState({
      bold,
      italic,
      underline,
      strikeThrough,
      subscript,
      superscript,
      code,
      blockquote,
      ol,
      ul,
      heading,
      alignment,
      fontFamily,
      fontSize,
      color,
      backgroundColor,
    });
  };

  // Load recently used colors from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedColors = localStorage.getItem("ocs_recent_colors");
      const savedHighlights = localStorage.getItem("ocs_recent_highlights");
      if (savedColors) setRecentColors(JSON.parse(savedColors));
      if (savedHighlights) setRecentHighlights(JSON.parse(savedHighlights));
    }
  }, []);

  // Sync cursor/selection updates
  useEffect(() => {
    const handleSelection = () => {
      detectActiveStyles();
    };
    document.addEventListener("selectionchange", handleSelection);
    return () => {
      document.removeEventListener("selectionchange", handleSelection);
    };
  }, []);

  // Click outside listener to auto-close dropdown options
  useEffect(() => {
    const handleWindowClick = (e: MouseEvent) => {
      if (activeDropdown && !(e.target as HTMLElement).closest(".relative")) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener("mousedown", handleWindowClick);
    return () => {
      window.removeEventListener("mousedown", handleWindowClick);
    };
  }, [activeDropdown]);

  // Load value prop into editor innerHTML on load
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const html = e.currentTarget.innerHTML;
    onChange(html);
    detectActiveStyles();
  };

  // Document execCommand helper
  const execCmd = (command: string, value: string = "") => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    detectActiveStyles();
  };

  // Color application functions
  const applyColor = (color: string) => {
    execCmd("foreColor", color);
    if (color && !PREDEFINED_COLORS.includes(color) && !recentColors.includes(color)) {
      const updated = [color, ...recentColors.slice(0, 7)];
      setRecentColors(updated);
      localStorage.setItem("ocs_recent_colors", JSON.stringify(updated));
    }
    setActiveDropdown(null);
  };

  const removeColor = () => {
    execCmd("foreColor", "initial");
    setActiveDropdown(null);
  };

  const applyHighlight = (color: string) => {
    execCmd("hiliteColor", color);
    if (color && !PREDEFINED_HIGHLIGHTS.includes(color) && !recentHighlights.includes(color)) {
      const updated = [color, ...recentHighlights.slice(0, 7)];
      setRecentHighlights(updated);
      localStorage.setItem("ocs_recent_highlights", JSON.stringify(updated));
    }
    setActiveDropdown(null);
  };

  const removeHighlight = () => {
    execCmd("hiliteColor", "transparent");
    setActiveDropdown(null);
  };

  const applyFontSize = (size: string) => {
    execCmd("fontSize", size);
  };

  const applyFontFamily = (font: string) => {
    execCmd("fontName", font);
  };

  const handleHeadingChange = (headingTag: string) => {
    execCmd("formatBlock", headingTag);
  };

  return (
    <div className="flex flex-col border border-slate-100 dark:border-slate-800/80 rounded-3xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgba(0,0,0,0.015)] overflow-hidden">
      {/* Editor Formatting Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-slate-50/70 dark:bg-slate-950/60 border-b border-slate-100 dark:border-slate-800/80 select-none items-center">
        {/* Undo / Redo */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("undo"); }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-205 transition-all"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("redo"); }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-205 transition-all"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={13} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Font Family Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "font" ? null : "font");
            }}
            className="px-2 h-7 flex items-center gap-1 border border-slate-200/50 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-extrabold text-slate-650 dark:text-slate-350 transition-all uppercase tracking-wider"
            title="Font Family"
          >
            <span className="truncate max-w-[80px]">
              {editorState.fontFamily.replace(/['"]/g, "").split(",")[0] || "Default"}
            </span>
            <ChevronDown size={11} />
          </button>
          {activeDropdown === "font" && (
            <div className="absolute left-0 mt-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[150px] flex flex-col animate-slide-in">
              {[
                { name: "Default (Sans)", val: "ui-sans-serif, system-ui" },
                { name: "Outfit (Display)", val: "Outfit, sans-serif" },
                { name: "Plus Jakarta", val: "Plus Jakarta Sans, sans-serif" },
                { name: "Serif", val: "Georgia, serif" },
                { name: "Monospace", val: "ui-monospace, SFMono-Regular, monospace" },
              ].map((font) => (
                <button
                  key={font.name}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFontFamily(font.val);
                    setActiveDropdown(null);
                  }}
                  className="px-3 py-1.5 text-[10px] text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider"
                  style={{ fontFamily: font.val }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Heading Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "heading" ? null : "heading");
            }}
            className="px-2 h-7 flex items-center gap-1 border border-slate-200/50 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-extrabold text-slate-650 dark:text-slate-350 transition-all uppercase tracking-wider"
            title="Text Style"
          >
            <span>
              {editorState.heading ? editorState.heading.toUpperCase() : "Paragraph"}
            </span>
            <ChevronDown size={11} />
          </button>
          {activeDropdown === "heading" && (
            <div className="absolute left-0 mt-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[130px] flex flex-col animate-slide-in">
              {[
                { label: "Paragraph", tag: "<p>" },
                { label: "Heading 1", tag: "<h2>" },
                { label: "Heading 2", tag: "<h3>" },
                { label: "Heading 3", tag: "<h4>" },
              ].map((h) => (
                <button
                  key={h.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleHeadingChange(h.tag);
                    setActiveDropdown(null);
                  }}
                  className={`px-3 py-1.5 text-[10px] text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider ${
                    (h.tag === "<p>" && !editorState.heading) || (editorState.heading && h.tag.includes(editorState.heading))
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      : ""
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "size" ? null : "size");
            }}
            className="px-2 h-7 flex items-center gap-1 border border-slate-200/50 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-extrabold text-slate-655 dark:text-slate-350 transition-all uppercase tracking-wider"
            title="Font Size"
          >
            <span>
              {(() => {
                switch (editorState.fontSize) {
                  case "1": case "10px": case "x-small": return "XS";
                  case "2": case "12px": case "small": return "Small";
                  case "3": case "14px": case "medium": return "Normal";
                  case "4": case "18px": case "large": return "Medium Lg";
                  case "5": case "24px": case "x-large": return "Large";
                  case "6": case "32px": case "xx-large": return "XL";
                  case "7": case "48px": return "Huge";
                  default: return "Normal";
                }
              })()}
            </span>
            <ChevronDown size={11} />
          </button>
          {activeDropdown === "size" && (
            <div className="absolute left-0 mt-1 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[130px] flex flex-col animate-slide-in">
              {[
                { label: "Extra Small (XS)", val: "1" },
                { label: "Small", val: "2" },
                { label: "Normal", val: "3" },
                { label: "Medium Large", val: "4" },
                { label: "Large", val: "5" },
                { label: "Extra Large (XL)", val: "6" },
                { label: "Huge", val: "7" },
              ].map((sz) => (
                <button
                  key={sz.label}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFontSize(sz.val);
                    setActiveDropdown(null);
                  }}
                  className={`px-3 py-1.5 text-[10px] text-left hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider ${
                    editorState.fontSize === sz.val
                      ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                      : ""
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Basic Toggles */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.bold
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.italic
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.underline
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("strikeThrough"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.strikeThrough
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Strikethrough"
        >
          <Strikethrough size={13} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Sub / Super script */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("subscript"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-extrabold transition-all ${
            editorState.subscript
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Subscript"
        >
          x₂
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("superscript"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-extrabold transition-all ${
            editorState.superscript
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Superscript"
        >
          x²
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("insertUnorderedList"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.ul
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Bulleted List"
        >
          <List size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("insertOrderedList"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.ol
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Numbered List"
        >
          <ListOrdered size={13} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Alignments */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("justifyLeft"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.alignment === "left"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Align Left"
        >
          <AlignLeft size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("justifyCenter"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.alignment === "center"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Align Center"
        >
          <AlignCenter size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("justifyRight"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.alignment === "right"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Align Right"
        >
          <AlignRight size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("justifyFull"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.alignment === "justify"
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Justify"
        >
          <AlignJustify size={13} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Text Color (Palette) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "color" ? null : "color");
            }}
            className="w-7 h-7 flex items-center justify-center border border-transparent rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
            title="Text Color"
          >
            <Palette size={13} style={{ color: editorState.color || undefined }} />
          </button>
          {activeDropdown === "color" && (
            <div className="absolute left-0 mt-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[200px] flex flex-col gap-2 animate-slide-in">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Predefined Colors</span>
              <div className="grid grid-cols-6 gap-1">
                {PREDEFINED_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor(col);
                    }}
                    className="w-5 h-5 rounded-md border border-slate-200/50 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
              </div>
              {recentColors.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Recent</span>
                  <div className="flex flex-wrap gap-1">
                    {recentColors.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyColor(col);
                        }}
                        className="w-5 h-5 rounded-md border border-slate-200/50 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider">
                  <input
                    type="color"
                    value={editorState.color || "#000000"}
                    onChange={(e) => {
                      applyColor(e.target.value);
                    }}
                    className="w-5 h-5 p-0 border-0 bg-transparent rounded-md cursor-pointer shrink-0"
                  />
                  <span>Custom</span>
                </label>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeColor();
                  }}
                  className="text-[10px] font-extrabold text-red-500 hover:underline uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color (Palette) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setActiveDropdown(activeDropdown === "highlight" ? null : "highlight");
            }}
            className="w-7 h-7 flex items-center justify-center border border-transparent rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
            title="Highlight Text"
          >
            <Highlighter
              size={13}
              style={{
                backgroundColor: editorState.backgroundColor || undefined,
                color: editorState.backgroundColor ? "#000" : undefined
              }}
            />
          </button>
          {activeDropdown === "highlight" && (
            <div className="absolute left-0 mt-1 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 min-w-[200px] flex flex-col gap-2 animate-slide-in">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Highlight Colors</span>
              <div className="grid grid-cols-6 gap-1">
                {PREDEFINED_HIGHLIGHTS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyHighlight(col);
                    }}
                    className="w-5 h-5 rounded-md border border-slate-200/50 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: col }}
                    title={col}
                  />
                ))}
              </div>
              {recentHighlights.length > 0 && (
                <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800/80 pt-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Recent</span>
                  <div className="flex flex-wrap gap-1">
                    {recentHighlights.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyHighlight(col);
                        }}
                        className="w-5 h-5 rounded-md border border-slate-200/50 dark:border-slate-800 transition-all hover:scale-105 active:scale-95"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 gap-2">
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider">
                  <input
                    type="color"
                    value={editorState.backgroundColor || "#ffff00"}
                    onChange={(e) => {
                      applyHighlight(e.target.value);
                    }}
                    className="w-5 h-5 p-0 border-0 bg-transparent rounded-md cursor-pointer shrink-0"
                  />
                  <span>Custom</span>
                </label>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    removeHighlight();
                  }}
                  className="text-[10px] font-extrabold text-red-500 hover:underline uppercase tracking-wider"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Link / Image */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter URL:", "https://");
            if (url) execCmd("createLink", url);
          }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-205 transition-all"
          title="Insert Link"
        >
          <Link size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            const url = prompt("Enter Image URL:", "https://");
            if (url) execCmd("insertImage", url);
          }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-205 transition-all"
          title="Insert Image"
        >
          <Image size={13} />
        </button>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* Extra Formats */}
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "<blockquote>"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.blockquote
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Blockquote"
        >
          <Quote size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("formatBlock", "<pre>"); }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
            editorState.code
              ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-bold border border-blue-200/35"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
          title="Code Block"
        >
          <Code size={13} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => { e.preventDefault(); execCmd("insertHorizontalRule"); }}
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-850 dark:hover:text-slate-205 transition-all"
          title="Horizontal Line"
        >
          <Minus size={13} />
        </button>
        <button
          type="button"
          onMouseDown={async (e) => {
            e.preventDefault();
            const confirmed = await dialog.confirm("Are you sure you want to clear all editor contents?", "Clear Editor");
            if (confirmed) {
              if (editorRef.current) {
                editorRef.current.innerHTML = "";
                onChange("");
                detectActiveStyles();
              }
            }
          }}
          className="w-7 h-7 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-red-500 transition-all ml-auto"
          title="Clear Content"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Editor Content Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={detectActiveStyles}
        onMouseUp={detectActiveStyles}
        placeholder={placeholder}
        className="w-full min-h-[380px] max-h-[600px] overflow-y-auto px-5 py-4 bg-slate-50/20 dark:bg-slate-950/20 focus:outline-none transition-all text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-blue-500/10 leading-relaxed font-sans prose dark:prose-invert"
        style={{ outline: "none" }}
      />
    </div>
  );
}
