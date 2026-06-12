"use client";

import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { fetchWithAuth } from "../../lib/api";

interface ImageUploaderProps {
  articleId: string;
  onUploadSuccess: (attachment: any) => void;
}

export default function ImageUploader({ articleId, onUploadSuccess }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Only image files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetchWithAuth(`/kb/articles/${articleId}/attachments`, {
        method: "POST",
        // Do not set Content-Type header when using FormData; fetch handles it with bound boundaries
        headers: {}, 
        body: formData,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error?.message || "Failed to upload image.");
      }

      onUploadSuccess(resData.data.attachment);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
          isDragging
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/10"
            : "border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-950"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        {isUploading ? (
          <>
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Uploading image...</span>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Upload size={20} />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Click to upload or drag & drop
              </p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP, GIF up to 5MB</p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
