"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "zzp-hub-pwa-dismissed";

const isStandalone = () => {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone;
};

export function InstallPWA() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const userDismissed = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISS_KEY) === "true";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone() || userDismissed) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const isIOSDevice = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIOSDevice) {
      setIsIOS(true);
      setVisible(true);
    }

    const handleInstalled = () => {
      localStorage.setItem(DISMISS_KEY, "true");
      setVisible(false);
    };

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [userDismissed]);

  const handleInstall = async () => {
    if (!promptEvent) {
      dismiss();
      return;
    }

    promptEvent.prompt();
    try {
      const choice = await promptEvent.userChoice;
      if (choice.outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, "true");
      }
    } catch (error) {
      // Silently handle install prompt errors in production
      if (process.env.NODE_ENV !== "production") {
        console.error("Installatieprompt kon niet worden afgehandeld", error);
      }
    } finally {
      setPromptEvent(null);
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-sm z-50">
      <div className="rounded-xl border border-[var(--border)] bg-white/90 backdrop-blur shadow-xl p-4 text-sm">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-semibold">
            Z
          </div>
          <div className="space-y-2 flex-1">
            <div className="font-semibold text-[var(--primary)]">Installeer ZZP HUB</div>
            {isIOS ? (
              <p className="text-[var(--muted)]">
                Open Safari, tik op het deel-icoon en kies <strong>Zet op beginscherm</strong> voor een app-ervaring.
              </p>
            ) : (
              <p className="text-[var(--muted)]">Installeer de app voor een snellere, fullscreen ervaring.</p>
            )}
            {!isIOS && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-3 py-1.5 text-white text-sm font-medium transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                >
                  Installeren
                </button>
                <button
                  onClick={dismiss}
                  className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--brand-primary))] px-3 py-1.5 text-[rgb(var(--brand-primary))] text-sm font-medium transition hover:bg-[rgb(var(--brand-primary)/0.08)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--brand-primary))]"
                >
                  Later
                </button>
              </div>
            )}
          </div>
          <button
            aria-label="Sluit installatiesuggestie"
            onClick={dismiss}
            className="text-[rgb(var(--brand-primary))] hover:text-[rgb(var(--brand-primary-active))] transition"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
