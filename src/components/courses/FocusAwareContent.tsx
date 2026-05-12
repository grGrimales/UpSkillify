"use client";

import { useFocusMode } from "@/context/FocusModeContext";
import { useEffect } from "react";

export default function FocusAwareContent({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useFocusMode();

  useEffect(() => {
    if (isFocusMode) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFocusMode]);

  return (
    <div 
      className={`
        transition-colors duration-300
        ${isFocusMode 
          ? "fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 overflow-y-auto overflow-x-hidden p-4 py-8 md:py-12" 
          : "max-w-4xl mx-auto px-4 py-8 md:py-12"
        }
      `}
    >
      <div className={isFocusMode ? "max-w-4xl mx-auto" : ""}>
        {children}
      </div>
    </div>
  );
}
