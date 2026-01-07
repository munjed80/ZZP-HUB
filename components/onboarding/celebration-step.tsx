"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { completeOnboarding } from "@/app/onboarding/actions";

interface CelebrationStepProps {
  onNext: () => void;
}

export function CelebrationStep({ onNext }: CelebrationStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeOnboarding();
      
      if (result.success) {
        router.push("/dashboard");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8 text-center py-8 relative">
      {/* Simple confetti effect using CSS */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-${Math.random() * 20}%`,
                backgroundColor: ['#0A2E50', '#1D4ED8', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random() * 1}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <div className="rounded-full bg-success/10 p-8">
          <CheckCircle className="h-20 w-20 text-success" aria-hidden />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-4xl font-bold text-foreground">
          Helemaal klaar!
        </h2>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Je account is succesvol ingesteld. Je kunt nu aan de slag met
          factureren, relatiebeheer en meer.
        </p>
      </div>

      <div className="space-y-3 max-w-md mx-auto pt-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-left">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-foreground text-sm">
              Bedrijfsprofiel compleet
            </p>
            <p className="text-xs text-muted-foreground">
              Al je gegevens staan klaar voor facturering
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-left">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-foreground text-sm">
              Eerste relatie toegevoegd
            </p>
            <p className="text-xs text-muted-foreground">
              Je kunt direct beginnen met factureren
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-left">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" aria-hidden />
          <div>
            <p className="font-medium text-foreground text-sm">
              Account beveiligd
            </p>
            <p className="text-xs text-muted-foreground">
              Je gegevens zijn veilig opgeslagen
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleComplete}
        disabled={isPending}
        className={buttonVariants(
          "primary",
          "w-full max-w-md mx-auto justify-center text-base py-4 text-lg font-bold"
        )}
      >
        {isPending ? "Bezig met afronden..." : "Aan de slag"}
        <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
      </button>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
