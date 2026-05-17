"use client";

import { useFocusMode } from "@/context/FocusModeContext";

export default function FocusModeToggle({ lang }: { lang: string }) {
  const { isFocusMode, toggleFocusMode } = useFocusMode();

  return (
    <button
      onClick={toggleFocusMode}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl border transition-all font-bold text-xs uppercase tracking-widest
        ${isFocusMode 
          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20" 
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-black dark:hover:text-white shadow-sm"
        }
      `}
    >
      {isFocusMode ? (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          {lang === "ES" ? "Salir del Modo Enfoque" : "Exit Focus Mode"}
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          {lang === "ES" ? "Modo Enfoque" : "Focus Mode"}
        </>
      )}
    </button>
  );
}
