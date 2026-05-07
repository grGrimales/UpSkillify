"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3 min-w-[320px] max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`
              flex items-center justify-between p-4 rounded-2xl border shadow-2xl cursor-pointer animate-in slide-in-from-right-full duration-300
              ${toast.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800 text-emerald-900 dark:text-emerald-400" 
                : toast.type === "error"
                ? "bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-800 text-red-900 dark:text-red-400"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-800 text-blue-900 dark:text-blue-400"}
            `}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {toast.type === "error" && (
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              <p className="text-sm font-bold">{toast.message}</p>
            </div>
            <button className="text-current opacity-50 hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
