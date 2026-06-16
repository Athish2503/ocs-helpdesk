"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { HelpCircle, Info, X } from "lucide-react";

interface DialogConfig {
  type: "alert" | "confirm";
  title: string;
  message: string;
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  alert: (message: string, title?: string) => Promise<void>;
  confirm: (message: string, title?: string) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DialogConfig | null>(null);

  const alert = useCallback((message: string, title: string = "Alert") => {
    return new Promise<void>((resolve) => {
      setConfig({
        type: "alert",
        title,
        message,
        resolve: () => {
          setConfig(null);
          resolve();
        },
      });
    });
  }, []);

  const confirm = useCallback((message: string, title: string = "Confirm") => {
    return new Promise<boolean>((resolve) => {
      setConfig({
        type: "confirm",
        title,
        message,
        resolve: (val: boolean) => {
          setConfig(null);
          resolve(val);
        },
      });
    });
  }, []);

  const handleClose = () => {
    if (config) {
      config.resolve(false);
    }
  };

  const handleConfirm = () => {
    if (config) {
      config.resolve(true);
    }
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}

      {/* Global Dialog Modal Overlay */}
      {config && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity" 
            onClick={handleClose}
          />

          {/* Modal Container */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl z-10 overflow-hidden transform transition-all duration-300 animate-slide-in flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className={`p-1.5 rounded-lg ${
                  config.type === "alert" 
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" 
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                }`}>
                  {config.type === "alert" ? <Info className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-[#F8FAFC]">
                  {config.title}
                </h3>
              </div>
              <button 
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Body */}
            <div className="p-6">
              <p className="text-xs text-slate-600 dark:text-slate-350 font-semibold leading-relaxed whitespace-pre-line">
                {config.message}
              </p>
            </div>

            {/* Actions Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-850 flex justify-end space-x-2">
              {config.type === "confirm" && (
                <button
                  onClick={() => config.resolve(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 transition-colors cursor-pointer"
              >
                {config.type === "alert" ? "OK" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
