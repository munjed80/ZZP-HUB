"use client";

import { useState, useEffect } from "react";
import { X, HelpCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssistantWidgetProps {
  currentStep?: number;
  isOnboarding?: boolean;
}

const onboardingMessages = [
  {
    step: 1,
    title: "Welkom!",
    message: "Laten we beginnen met je account instellen.",
  },
  {
    step: 2,
    title: "Bedrijfsgegevens",
    message: "Zoek je bedrijf via KVK of vul handmatig in.",
  },
  {
    step: 3,
    title: "Eerste relatie",
    message: "Voeg je eerste klant toe om te kunnen factureren.",
  },
  {
    step: 4,
    title: "Beveiliging",
    message: "Optioneel: activeer 2FA voor extra veiligheid.",
  },
  {
    step: 5,
    title: "Bijna klaar!",
    message: "Je bent klaar om aan de slag te gaan.",
  },
];

export function AssistantWidget({ currentStep, isOnboarding = false }: AssistantWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Auto-show during onboarding
    if (isOnboarding && !isDismissed) {
      setIsOpen(true);
    }
  }, [isOnboarding, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsOpen(false);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const currentMessage = isOnboarding && currentStep
    ? onboardingMessages.find(m => m.step === currentStep)
    : null;

  if (isDismissed && !isOnboarding) {
    return null;
  }

  return (
    <>
      {/* Widget Button */}
      {!isOpen && (
        <button
          onClick={handleToggle}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "h-14 w-14 rounded-full",
            "bg-primary text-white shadow-2xl",
            "flex items-center justify-center",
            "hover:scale-110 transition-transform duration-200",
            "ring-4 ring-primary/20"
          )}
          aria-label="Help openen"
        >
          <HelpCircle className="h-6 w-6" aria-hidden />
        </button>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <>
          {/* Backdrop for outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={handleDismiss}
            aria-hidden="true"
          />

          <div
            className={cn(
              "fixed bottom-6 right-6 z-50",
              "w-80 max-w-[calc(100vw-3rem)]",
              "rounded-2xl bg-card shadow-2xl border-2 border-border",
              "overflow-hidden"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary p-4 text-white">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" aria-hidden />
                <h3 className="font-bold">Hulp assistent</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="rounded-full p-1 hover:bg-white/20 transition-colors"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {isOnboarding && currentMessage ? (
                <>
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground">
                      {currentMessage.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentMessage.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex gap-1">
                      {onboardingMessages.map((m) => (
                        <div
                          key={m.step}
                          className={cn(
                            "h-1.5 w-6 rounded-full transition-colors",
                            currentStep && currentStep >= m.step
                              ? "bg-primary"
                              : "bg-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span>Stap {currentStep} van 5</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-card-foreground">
                    Welkom bij ZZP-HUB! Als je hulp nodig hebt, staan we voor je klaar.
                  </p>
                  <div className="space-y-2">
                    <a
                      href="/support"
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <span className="font-medium">Documentatie</span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                    <a
                      href="mailto:support@zzp-hub.nl"
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                    >
                      <span className="font-medium">Contact support</span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
