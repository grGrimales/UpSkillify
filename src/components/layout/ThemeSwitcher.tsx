"use client";

import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import { useState, useEffect, useRef } from "react";

const THEMES = [
  {
    id: "light",
    label: { ES: "Claro", EN: "Light" },
    swatch: "#ffffff",
    border: "#d4d4d8",
  },
  {
    id: "dark",
    label: { ES: "Oscuro", EN: "Dark" },
    swatch: "#18181b",
    border: "#3f3f46",
  },
  {
    id: "sepia",
    label: { ES: "Sepia", EN: "Sepia" },
    swatch: "#f7efe0",
    border: "#d4bfa0",
  },
  {
    id: "dim",
    label: { ES: "Tenue", EN: "Dim" },
    swatch: "#1a1c30",
    border: "#2d3060",
  },
] as const;

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Avoid hydration mismatch — render a placeholder until mounted
  if (!mounted) return <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />;

  const current = (theme === "system" ? resolvedTheme : theme) ?? "light";
  const currentData = THEMES.find((t) => t.id === current) ?? THEMES[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        style={{
          backgroundColor: currentData.swatch,
          borderColor: currentData.border,
        }}
        title={language === "ES" ? "Cambiar tema" : "Change theme"}
        aria-expanded={open}
        aria-haspopup="listbox"
      />

      {open && (
        <div
          role="listbox"
          className="absolute right-0 top-10 z-[60] w-36 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-1.5 flex flex-col gap-0.5"
        >
          {THEMES.map((t) => {
            const isActive = current === t.id;
            return (
              <button
                key={t.id}
                role="option"
                aria-selected={isActive}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                }`}
              >
                <span
                  className="h-4 w-4 shrink-0 rounded-full border"
                  style={{ backgroundColor: t.swatch, borderColor: t.border }}
                />
                {t.label[language as "ES" | "EN"] ?? t.label.ES}
                {isActive && (
                  <svg className="ml-auto h-3 w-3 text-blue-600 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
