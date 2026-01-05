"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowRight, Check, MoveLeft, Sparkles, X } from "lucide-react";
import { ONBOARDING_STORAGE_KEY } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type Step = {
  id: string;
  title: string;
  description: string;
  selectors: string[];
};

type OnboardingTourProps = {
  userId?: string;
};

const steps: Step[] = [
  {
    id: "profile",
    title: "Vul je bedrijfsprofiel in",
    description: "Ga naar Instellingen / Profiel en vul je bedrijfsgegevens in voor correcte facturen.",
    selectors: ['[data-tour="profile-link"]'],
  },
  {
    id: "relaties",
    title: "Voeg je eerste relatie toe",
    description: "Open Relaties om een klant toe te voegen. Zo kun je direct facturen koppelen.",
    selectors: ['[data-tour="relations-link"]'],
  },
  {
    id: "invoice",
    title: "Maak je eerste factuur",
    description: "Gebruik de + knop om snel een nieuwe factuur te starten en te versturen.",
    selectors: ['[data-tour="fab-add"]', '[data-tour="new-invoice-button"]'],
  },
];

function findTarget(selectors: string[]): HTMLElement | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el instanceof HTMLElement) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return el;
    }
  }
  return null;
}

export function OnboardingTour({ userId }: OnboardingTourProps) {
  const pathname = usePathname();
  const storageKey = useMemo(() => `${ONBOARDING_STORAGE_KEY}-${userId ?? "anon"}`, [userId]);
  const mounted = typeof window !== "undefined";
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !window.localStorage.getItem(storageKey);
  });
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const totalSteps = steps.length;
  const step = steps[currentStep];

  useEffect(() => {
    if (!mounted || !active || !step) return;

    let frame: number | null = null;
    const updateRect = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = findTarget(step.selectors);
        setTargetRect(el ? el.getBoundingClientRect() : null);
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [active, step, pathname, mounted]);

  const completeTour = () => {
    window.localStorage.setItem(storageKey, new Date().toISOString());
    setActive(false);
  };

  const nextStep = () => {
    if (currentStep === totalSteps - 1) {
      completeTour();
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  if (!mounted || !active || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] pointer-events-auto" role="dialog" aria-modal="true" aria-labelledby="onboarding-tour-title">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      {targetRect ? (
        <div
          aria-hidden
          className="absolute rounded-xl border-2 border-teal-300/80 shadow-[0_20px_60px_-24px_rgba(15,76,92,0.55)] transition-all duration-200"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      ) : null}

      <div className="absolute inset-x-4 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] pointer-events-auto md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[420px]">
        <div className="rounded-2xl bg-white/95 p-4 shadow-2xl shadow-slate-900/20 ring-1 ring-slate-100 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <Sparkles className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p id="onboarding-tour-title" className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
                  Onboarding
                </p>
                <p className="text-sm text-slate-600">
                  Stap {currentStep + 1} / {totalSteps}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={completeTour}
              className="rounded-full p-1.5 text-[rgb(var(--brand-primary))] transition hover:bg-[rgb(var(--brand-primary)/0.08)] hover:text-[rgb(var(--brand-primary-active))]"
              aria-label="Tour sluiten"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <p className="text-base font-semibold text-slate-900">{step.title}</p>
            <p className="text-sm text-slate-600">{step.description}</p>
            {!targetRect ? (
              <p className="text-xs font-medium text-amber-600">
                Element niet gevonden. Navigeer naar het onderdeel om verder te gaan.
              </p>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={completeTour}
              className="text-sm font-semibold text-[rgb(var(--brand-primary))] underline-offset-4 hover:text-[rgb(var(--brand-primary-active))]"
            >
              Overslaan
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                className={buttonVariants("outline", cn("items-center gap-2 px-3 py-2 text-sm font-semibold", currentStep === 0 && "opacity-50"))}
              >
                <MoveLeft className="h-4 w-4" aria-hidden />
                Vorige
              </button>
              <button
                type="button"
                onClick={nextStep}
                className={buttonVariants("primary", "flex items-center gap-2 px-4 py-2 text-sm font-semibold")}
              >
                {currentStep === totalSteps - 1 ? (
                  <>
                    Afronden
                    <Check className="h-4 w-4" aria-hidden />
                  </>
                ) : (
                  <>
                    Volgende
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
