"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Mail, Sparkles } from "lucide-react";

export default function CheckEmailPage() {
  return (
    <div className="space-y-8 rounded-[32px] bg-card/70 p-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
      <div className="space-y-2">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • E-mailverificatie
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Controleer je e-mail</h1>
        <p className="text-sm text-muted-foreground">
          We hebben een verificatielink naar je e-mailadres gestuurd.
        </p>
      </div>

      <div className="flex items-center justify-center py-8">
        <div className="rounded-full bg-primary/10 p-6">
          <Mail className="h-16 w-16 text-primary" aria-hidden />
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-card-foreground">
          Klik op de link in de e-mail om je account te activeren en verder te
          gaan met de onboarding.
        </p>
        <p className="text-xs text-muted-foreground">
          De verificatielink is 24 uur geldig. Als je geen e-mail hebt ontvangen,
          controleer dan je spam-map.
        </p>
      </div>

      <div className="space-y-3">
        <Link
          href="/resend-verification"
          className={buttonVariants(
            "secondary",
            "w-full justify-center text-base py-3"
          )}
        >
          E-mail niet ontvangen? Opnieuw versturen
        </Link>
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
