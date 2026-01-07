"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mail, Sparkles, ArrowRight } from "lucide-react";
import { resendVerificationEmail } from "./actions";

export default function ResendVerificationPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleResend = () => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await resendVerificationEmail();
      
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || "Er ging iets mis.");
      }
    });
  };

  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • Verificatie-e-mail opnieuw versturen
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Nieuwe verificatie-e-mail aanvragen
        </h1>
        <p className="text-sm text-muted-foreground">
          {success
            ? "E-mail succesvol verstuurd!"
            : "Klik op de knop om een nieuwe verificatie-e-mail te ontvangen."}
        </p>
      </div>

      <div className="flex items-center justify-center py-8">
        <div className="rounded-full bg-primary/10 p-6">
          <Mail className="h-16 w-16 text-primary" aria-hidden />
        </div>
      </div>

      {success ? (
        <div className="space-y-4">
          <p className="text-sm text-card-foreground">
            We hebben een nieuwe verificatielink naar je e-mailadres gestuurd.
            Controleer je inbox en klik op de link om je account te activeren.
          </p>
          <p className="text-xs text-muted-foreground">
            Als je geen e-mail ontvangt, controleer dan je spam-map.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-card-foreground">
            Als je geen verificatie-e-mail hebt ontvangen of als de link is
            verlopen, kun je hier een nieuwe aanvragen.
          </p>
          <p className="text-xs text-muted-foreground">
            Let op: je kunt maximaal 1 e-mail per minuut aanvragen.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!success && (
          <button
            onClick={handleResend}
            disabled={isPending}
            className={buttonVariants(
              "primary",
              "w-full justify-center text-base py-3"
            )}
          >
            {isPending ? "Bezig met versturen..." : "Nieuwe e-mail versturen"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </button>
        )}
        <Link
          href="/login"
          className="block text-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}
