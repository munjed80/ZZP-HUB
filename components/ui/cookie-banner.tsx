"use client";

import { useSyncExternalStore } from "react";

function subscribe(listener: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => listener();
  window.addEventListener("storage", handler);
  window.addEventListener("cookie-consent-change", handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("cookie-consent-change", handler);
  };
}

function getSnapshot() {
  if (typeof window === "undefined") return false;
  return !localStorage.getItem("cookieConsent");
}

export function CookieBanner() {
  const isVisible = useSyncExternalStore(subscribe, getSnapshot, () => false);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookieConsent", "true");
      window.dispatchEvent(new Event("cookie-consent-change"));
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="alertdialog"
      aria-label="Cookie consent"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 p-4 shadow-lg"
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
        <p id="cookie-banner-description" className="text-sm text-slate-100">
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
