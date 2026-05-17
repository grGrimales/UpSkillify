"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/context/LanguageContext";
import { ToastProvider } from "@/context/ToastContext";
import { FocusModeProvider } from "@/context/FocusModeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      themes={["light", "dark", "sepia", "dim"]}
      suppressHydrationWarning
    >
      <SessionProvider>
        <FocusModeProvider>
          <LanguageProvider>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </FocusModeProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
