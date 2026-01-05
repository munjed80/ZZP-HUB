"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="zzp-hub-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}

// Re-export useTheme from next-themes for convenience
export { useTheme } from "next-themes";
