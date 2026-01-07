"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle } from "lucide-react";
import { WelcomeStep } from "@/components/onboarding/welcome-step";
import { CompanyStep } from "@/components/onboarding/company-step";
import { ClientStep } from "@/components/onboarding/client-step";
import { SecurityStep } from "@/components/onboarding/security-step";
import { CelebrationStep } from "@/components/onboarding/celebration-step";
import { AssistantWidget } from "@/components/assistant/assistant-widget";

interface OnboardingPageProps {
  searchParams: Promise<{ step?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const params = await searchParams;
  return <OnboardingClient initialStep={params.step} />;
}

function OnboardingClient({ initialStep }: { initialStep?: string }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(Math.max(1, Math.min(5, parseInt(initialStep || "1", 10))));

  useEffect(() => {
    // Update URL when step changes
    router.replace(`/onboarding?step=${currentStep}`, { scroll: false });
  }, [currentStep, router]);

  const steps = [
    { number: 1, title: "Welkom", component: WelcomeStep },
    { number: 2, title: "Bedrijf", component: CompanyStep },
    { number: 3, title: "Eerste relatie", component: ClientStep },
    { number: 4, title: "Beveiliging", component: SecurityStep },
    { number: 5, title: "Klaar!", component: CelebrationStep },
  ];

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          <h1 className="text-xl font-bold text-foreground">Welkom bij ZZP-HUB</h1>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 w-full">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                    currentStep > step.number
                      ? "bg-success text-white"
                      : currentStep === step.number
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" aria-hidden />
                  ) : (
                    step.number
                  )}
                </div>
                <p className="text-xs font-medium text-muted-foreground hidden sm:block">
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 rounded-full transition-all ${
                    currentStep > step.number ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <CurrentStepComponent
          onNext={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
          onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        />
      </div>

      {/* Assistant Widget */}
      <AssistantWidget currentStep={currentStep} isOnboarding={true} />
    </div>
  );
}
