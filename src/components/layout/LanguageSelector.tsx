"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <button
        onClick={() => setLanguage("ES")}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
          language === "ES" 
            ? "bg-white dark:bg-zinc-600 shadow-sm text-black dark:text-white" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => setLanguage("EN")}
        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
          language === "EN" 
            ? "bg-white dark:bg-zinc-600 shadow-sm text-black dark:text-white" 
            : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        }`}
      >
        EN
      </button>
    </div>
  );
}
