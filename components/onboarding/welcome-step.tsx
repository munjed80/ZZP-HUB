"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-8 text-center">
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Sparkles className="h-16 w-16 text-primary" aria-hidden />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          Welkom bij ZZP-HUB!
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We gaan je account in een paar eenvoudige stappen instellen. Dit duurt
          slechts enkele minuten en zorgt ervoor dat je meteen aan de slag kunt.
        </p>
      </div>

      <div className="space-y-3 pt-4">
        <div className="grid gap-3 text-left max-w-md mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Bedrijfsgegevens</p>
              <p className="text-sm text-muted-foreground">
                Vul je bedrijfsinformatie in via KVK-zoekfunctie
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Eerste relatie</p>
              <p className="text-sm text-muted-foreground">
                Voeg je eerste klant toe om direct te kunnen factureren
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <div className="rounded-full bg-primary/10 p-2 mt-0.5">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium text-foreground">Beveiliging</p>
              <p className="text-sm text-muted-foreground">
                Optioneel: activeer 2-factor authenticatie voor extra veiligheid
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={onNext}
        className={buttonVariants(
          "primary",
          "w-full max-w-md mx-auto justify-center text-base py-3"
        )}
      >
        Laten we beginnen
        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
