"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { saveFirstClient } from "@/app/onboarding/actions";

interface ClientStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ClientStep({ onNext, onBack }: ClientStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    address: "",
    postalCode: "",
    city: "",
    btwId: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveFirstClient(formData);
      
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
          <Users className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="text-2xl font-bold text-foreground">Eerste relatie</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Voeg je eerste klant toe om direct facturen te kunnen maken.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-card-foreground">
              Naam *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Bijv. Acme BV"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-card-foreground">
              E-mailadres *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="facturen@bedrijf.nl"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-card-foreground">
              Adres *
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Straatnaam 123"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              Postcode *
            </label>
            <input
              type="text"
              required
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              placeholder="1234 AB"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              Plaats *
            </label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="Amsterdam"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-semibold text-card-foreground">
              BTW-ID (optioneel)
            </label>
            <input
              type="text"
              value={formData.btwId}
              onChange={(e) => setFormData({ ...formData, btwId: e.target.value })}
              placeholder="NL123456789B01"
              className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onBack}
            className={buttonVariants("secondary", "flex-1 justify-center py-3")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
            Vorige
          </button>
          <button
            type="submit"
            disabled={isPending}
            className={buttonVariants("primary", "flex-1 justify-center py-3")}
          >
            {isPending ? "Opslaan..." : "Volgende"}
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
