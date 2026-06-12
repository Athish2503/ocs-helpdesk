"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback((msg: string, dur?: number) => toast(msg, "success", dur), [toast]);
  const error = useCallback((msg: string, dur?: number) => toast(msg, "error", dur), [toast]);
  const info = useCallback((msg: string, dur?: number) => toast(msg, "info", dur), [toast]);
  const warning = useCallback((msg: string, dur?: number) => toast(msg, "warning", dur), [toast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-emerald-500/10 dark:bg-emerald-950/20",
          border: "border-emerald-500/30 dark:border-emerald-500/20",
          text: "text-emerald-800 dark:text-emerald-400",
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
        };
      case "error":
        return {
          bg: "bg-red-500/10 dark:bg-red-950/20",
          border: "border-red-500/30 dark:border-red-500/20",
          text: "text-red-800 dark:text-red-400",
          icon: <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
        };
      case "warning":
        return {
          bg: "bg-amber-500/10 dark:bg-amber-950/20",
          border: "border-amber-500/30 dark:border-amber-500/20",
          text: "text-amber-800 dark:text-amber-400",
          icon: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
        };
      case "info":
      default:
        return {
          bg: "bg-blue-500/10 dark:bg-blue-950/20",
          border: "border-blue-500/30 dark:border-blue-500/20",
          text: "text-blue-800 dark:text-blue-400",
          icon: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
        };
    }
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}

      {/* Floating Toasts Portal */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none select-none">
        {toasts.map((t) => {
          const styles = getToastStyles(t.type);
          return (
            <div
              key={t.id}
              className={`flex items-start justify-between p-4 rounded-xl border backdrop-blur-md shadow-lg pointer-events-auto transition-all duration-300 animate-slide-in ${styles.bg} ${styles.border}`}
              role="alert"
            >
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">{styles.icon}</div>
                <p className={`text-xs font-semibold leading-relaxed ${styles.text}`}>
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-4 mt-0.5 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
