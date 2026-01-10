"use client";

import { useState, useTransition } from "react";
import { Building2, Loader2, Search, Sparkles } from "lucide-react";
import { completeProfileSetup } from "./actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SetupPage() {
  const [companyName, setCompanyName] = useState("");
  const [kvkNumber, setKvkNumber] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLookup, setIsLookup] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLookup = async () => {
    if (!kvkNumber.trim()) return;
    setIsLookup(true);
    setError(null);

    try {
      const response = await fetch(`/api/kvk/details?kvk=${encodeURIComponent(kvkNumber.trim())}`);
      const data = await response.json();

      if (response.ok && data.details) {
        setCompanyName((prev) => data.details.name || prev);
        setKvkNumber((prev) => data.details.kvkNumber || prev);
      } else {
        setError(data.error || "Zoeken mislukt. Vul de gegevens handmatig in.");
      }
    } catch {
      setError("Zoeken mislukt. Vul de gegevens handmatig in.");
    } finally {
      setIsLookup(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await completeProfileSetup({ companyName, kvkNumber });
      if (!result.success) {
        setError(result.message || "Er ging iets mis bij het opslaan.");
        return;
      }

      window.location.href = "/dashboard";
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          <Sparkles className="h-4 w-4" aria-hidden />
          ZZP-HUB • Profiel setup
        </p>
        <h1 className="text-3xl font-bold text-foreground">Stel je profiel in</h1>
        <p className="text-sm text-muted-foreground">
          Vul je bedrijfsnaam in, voeg optioneel je KVK toe en start direct.
        </p>
      </div>

      <div className="rounded-2xl bg-card/80 p-6 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.45)] backdrop-blur-xl ring-1 ring-border">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Building2 className="h-4 w-4 text-primary" aria-hidden />
              Bedrijfsnaam *
            </label>
            <input
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Bijv. ZZP-HUB BV"
              className="w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">KVK-nummer (optioneel)</label>
            <div className="flex gap-2">
              <input
                value={kvkNumber}
                onChange={(e) => setKvkNumber(e.target.value)}
                placeholder="Bijv. 12345678"
                className="flex-1 rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground shadow-inner focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookup || !kvkNumber.trim()}
                className={cn(
                  buttonVariants("outline", "px-3"),
                  "min-w-[52px] justify-center"
                )}
              >
                {isLookup ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gebruik de zoekknop om je gegevens via KVK op te halen. Je kunt dit veld ook leeg laten.
            </p>
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending || !companyName.trim()}
            className={buttonVariants(
              "primary",
              "w-full justify-center text-base py-4 text-lg font-bold"
            )}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                Opslaan...
              </>
            ) : (
              <>Opslaan en naar Dashboard</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
