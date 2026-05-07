"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Language = "EN" | "ES";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ES");

  useEffect(() => {
    // Read from cookie first, then localStorage
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const savedLang = (getCookie("language") || localStorage.getItem("language")) as Language;
    if (savedLang && (savedLang === "EN" || savedLang === "ES")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("language", lang);
    // Set cookie so the server can read it
    document.cookie = `language=${lang}; path=/; max-age=31536000`; // 1 year
    
    // Refresh the page to trigger server-side re-fetch with new language
    window.location.reload();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
