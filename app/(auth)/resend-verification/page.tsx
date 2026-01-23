"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mail, Sparkles, ArrowRight } from "lucide-react";
import { resendVerificationEmailPublic } from "./actions";

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleResend = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError("Vul je e-mailadres in.");
      return;
    }

    startTransition(async () => {
      const result = await resendVerificationEmailPublic(email.trim());
      
      if (result.success) {
        setSuccess(true);
        setSuccessMessage(result.message || null);
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
            ? "Controleer je inbox!"
            : "Vul je e-mailadres in om een nieuwe verificatielink te ontvangen."}
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
            {successMessage || "Als dit e-mailadres bij ons bekend is, ontvang je binnenkort een verificatie-e-mail."}
          </p>
          <p className="text-xs text-muted-foreground">
            Controleer ook je spam-map als je geen e-mail ziet.
          </p>
        </div>
      ) : (
        <form onSubmit={handleResend} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              E-mailadres
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="je@email.nl"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isPending}
              autoComplete="email"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Je kunt maximaal 1 e-mail per minuut aanvragen.
          </p>
        </form>
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
            disabled={isPending || !email.trim()}
            className={buttonVariants(
              "primary",
              "w-full justify-center text-base py-3"
            )}
          >
            {isPending ? "Bezig met versturen..." : "Verificatie-e-mail versturen"}
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
