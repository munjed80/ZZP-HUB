"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Shield, Lock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { skip2FA } from "@/app/onboarding/actions";

interface SecurityStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function SecurityStep({ onNext, onBack }: SecurityStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSkip = () => {
    setError(null);
    startTransition(async () => {
      const result = await skip2FA();
      
      if (result.success) {
        router.refresh();
        onNext();
      } else {
        setError(result.message || "Er ging iets mis");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="text-2xl font-bold text-foreground">Extra beveiliging</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Beveilig je account met twee-factor authenticatie (2FA).
        </p>
      </div>

      <div className="space-y-4 text-center py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Lock className="h-16 w-16 text-primary" aria-hidden />
          </div>
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-foreground">
            Twee-factor authenticatie (optioneel)
          </h3>
          <p className="text-sm text-muted-foreground">
            2FA voegt een extra beveiligingslaag toe aan je account. Je kunt dit
            later altijd nog inschakelen via de instellingen.
          </p>
        </div>

        <div className="space-y-3 max-w-md mx-auto pt-4">
          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-success/10 p-2 mt-0.5">
                <Shield className="h-4 w-4 text-success" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Extra beveiliging</p>
                <p className="text-xs text-muted-foreground">
                  Bescherm je account tegen ongeautoriseerde toegang
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-primary/10 p-2 mt-0.5">
                <Lock className="h-4 w-4 text-primary" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Altijd in te schakelen</p>
                <p className="text-xs text-muted-foreground">
                  Je kunt 2FA later toevoegen via Instellingen → Beveiliging
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className={buttonVariants("secondary", "flex-1 justify-center py-3")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
          Vorige
        </button>
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className={buttonVariants("primary", "flex-1 justify-center py-3")}
        >
          {isPending ? "Bezig..." : "Later instellen"}
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
