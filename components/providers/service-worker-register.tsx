"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const UPDATE_TOAST_ID = "sw-update-available";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;

    let registration: ServiceWorkerRegistration | undefined;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;

    const handleControllerChange = () => {
      if (!hadController || refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    const promptUpdate = (worker?: ServiceWorker | null) => {
      if (!worker) return;

      toast("Update beschikbaar", {
        id: UPDATE_TOAST_ID,
        description: "Er is een nieuwe versie beschikbaar. Herlaad om de nieuwste UI te gebruiken.",
        duration: 10000,
        action: {
          label: "Nu updaten",
          onClick: () => {
            worker.postMessage({ type: "SKIP_WAITING" });
            worker.addEventListener("statechange", () => {
              if (worker.state === "activated") {
                window.location.reload();
              }
            });
            setTimeout(() => {
              if (!refreshing) {
                refreshing = true;
                window.location.reload();
              }
            }, 1500);
          },
        },
      });
    };

    const register = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });

        if (registration.waiting) {
          promptUpdate(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration?.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              promptUpdate(registration?.waiting ?? newWorker);
            }
          });
        });

        registration.update();
      } catch (error) {
        // Silently fail in production - service worker is optional enhancement
        // In development/debug mode, developers can check browser console
        if (process.env.NODE_ENV !== "production") {
          console.error("Service worker registratie mislukt", error);
        }
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    register();

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      toast.dismiss(UPDATE_TOAST_ID);
    };
  }, []);

  return null;
}
