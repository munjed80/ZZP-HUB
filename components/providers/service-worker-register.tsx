"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        // Silently fail in production - service worker is optional enhancement
        // In development/debug mode, developers can check browser console
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.error("Service worker registratie mislukt", error);
        }
      }
    };

    register();
  }, []);

  return null;
}
