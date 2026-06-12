"use client";

import React, { useState } from "react";
import { Star, StarOff, Trash2, Copy, Check, ExternalLink } from "lucide-react";
import { fetchWithAuth } from "../../lib/api";

interface Attachment {
  id: string;
  articleId: string;
  filename: string;
  originalFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  isFeatured: boolean;
  displayOrder: number;
}

interface ImageGalleryProps {
  articleId: string;
  attachments: Attachment[];
  onDeleteSuccess: (id: string) => void;
  onSetFeaturedSuccess: (id: string) => void;
}

export default function ImageGallery({
  articleId,
  attachments,
  onDeleteSuccess,
  onSetFeaturedSuccess,
}: ImageGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  const serverBase = API_URL.replace("/api", "");

  const getImageUrl = (filePath: string) => {
    if (filePath.startsWith("http")) return filePath;
    // Replace windows backslashes
    const normalizedPath = filePath.replace(/\\/g, "/").replace(/^\.\//, "");
    return `${serverBase}/${normalizedPath}`;
  };

  const copyToClipboard = (attachment: Attachment, format: "markdown" | "url") => {
    const url = getImageUrl(attachment.filePath);
    const text = format === "markdown" ? `![${attachment.originalFilename}](${url})` : url;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(`${attachment.id}-${format}`);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const setFeatured = async (id: string) => {
    setIsProcessing(id);
    try {
      const response = await fetchWithAuth(`/kb/articles/${articleId}/attachments/${id}/featured`, {
        method: "POST",
      });
      if (response.ok) {
        onSetFeaturedSuccess(id);
      }
    } catch (err) {
      console.error("Error setting featured image:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  const deleteImage = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    setIsProcessing(id);
    try {
      const response = await fetchWithAuth(`/kb/attachments/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        onDeleteSuccess(id);
      }
    } catch (err) {
      console.error("Error deleting image:", err);
    } finally {
      setIsProcessing(null);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-900">
        <span className="text-sm text-slate-400 font-medium">No images uploaded yet</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {attachments.map((img) => {
        const url = getImageUrl(img.filePath);
        const isFeatured = img.isFeatured;
        const disabled = isProcessing === img.id;

        return (
          <div
            key={img.id}
            className={`group border rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all duration-200 ${
              isFeatured
                ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                : "border-slate-200 dark:border-slate-800 hover:shadow-sm"
            }`}
          >
            {/* Image Preview Container */}
            <div className="relative aspect-video bg-slate-100 dark:bg-slate-950 overflow-hidden">
              <img
                src={url}
                alt={img.originalFilename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Badges / Quick actions */}
              <div className="absolute top-2 left-2 flex gap-1">
                {isFeatured && (
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                    <Star size={10} fill="white" /> Featured
                  </span>
                )}
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg transition-colors"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Content & Metadata */}
            <div className="p-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate" title={img.originalFilename}>
                {img.originalFilename}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {img.width && img.height ? `${img.width}x${img.height} • ` : ""}
                {Math.round(img.fileSize / 1024)} KB
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => copyToClipboard(img, "markdown")}
                  className="flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 transition-all font-semibold"
                >
                  {copiedId === `${img.id}-markdown` ? (
                    <>
                      <Check size={12} className="text-green-500" />
                      <span className="text-green-600">Copied MD</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy MD</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => copyToClipboard(img, "url")}
                  className="flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-600 dark:text-slate-400 transition-all font-semibold"
                >
                  {copiedId === `${img.id}-url` ? (
                    <>
                      <Check size={12} className="text-green-500" />
                      <span className="text-green-600">Copied URL</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 gap-1.5">
                <button
                  disabled={disabled || isFeatured}
                  onClick={() => setFeatured(img.id)}
                  className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md transition-all font-bold ${
                    isFeatured
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20"
                      : "text-slate-500 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-950"
                  }`}
                >
                  {isFeatured ? <Star size={12} fill="currentColor" /> : <StarOff size={12} />}
                  <span>{isFeatured ? "Featured" : "Make Featured"}</span>
                </button>

                <button
                  disabled={disabled}
                  onClick={() => deleteImage(img.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/10 p-1.5 rounded-md transition-all"
                  title="Delete image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
