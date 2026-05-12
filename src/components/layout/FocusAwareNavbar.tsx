"use client";

import { useFocusMode } from "@/context/FocusModeContext";

export default function FocusAwareNavbar({ children }: { children: React.ReactNode }) {
  const { isFocusMode } = useFocusMode();

  if (isFocusMode) return null;

  return <>{children}</>;
}
