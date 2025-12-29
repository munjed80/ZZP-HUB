"use client";

import { useState, useEffect } from "react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies (only in browser)
    if (typeof window !== "undefined") {
      const hasAccepted = localStorage.getItem("cookieConsent");
      if (!hasAccepted) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookieConsent", "true");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="banner"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 p-4 shadow-lg"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-sm text-slate-100">
          Wij gebruiken cookies om de website te verbeteren. Deze cookies zijn noodzakelijk voor de werking van de website.
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-label="Accepteer cookies"
          >
            Akkoord
          </button>
        </div>
      </div>
    </div>
  );
}
