"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Search, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { saveCompanyProfile } from "@/app/onboarding/actions";
import type { KVKSearchResult } from "@/lib/kvk/interface";

interface CompanyStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function CompanyStep({ onNext, onBack }: CompanyStepProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<KVKSearchResult[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);
  
  const [formData, setFormData] = useState({
    companyName: "",
    address: "",
    postalCode: "",
    city: "",
    kvkNumber: "",
    btwNumber: "",
    iban: "",
    bankName: "",
  });

  const applyResult = (result: KVKSearchResult) => {
    setFormData((prev) => ({
      ...prev,
      companyName: result.name || prev.companyName,
      address: result.address || prev.address,
      postalCode: result.postalCode || prev.postalCode,
      city: result.city || prev.city,
      kvkNumber: result.kvkNumber || prev.kvkNumber,
    }));
    setShowManualForm(true);
    setSearchResults([]);
    setError(null);
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/kvk/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      const results: KVKSearchResult[] = data.results || [];
      
      if (response.ok) {
        setSearchResults(results);
        if (results.length > 0) {
          applyResult(results[0]);
        } else {
          setError("Geen resultaten gevonden. Vul de gegevens handmatig in.");
          setShowManualForm(true);
        }
      } else {
        setError(data.error || "Zoeken mislukt. Probeer opnieuw.");
        setShowManualForm(true);
      }
    } catch {
      setError("Er ging iets mis bij het zoeken.");
      setShowManualForm(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCompany = (result: KVKSearchResult) => {
    applyResult(result);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await saveCompanyProfile(formData);
      
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
          <Building2 className="h-6 w-6 text-primary" aria-hidden />
          <h2 className="text-2xl font-bold text-foreground">Bedrijfsgegevens</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Zoek je bedrijf via KVK of vul de gegevens handmatig in.
        </p>
      </div>

      {!showManualForm ? (
        <div className="space-y-4">
          {/* KVK Search */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-card-foreground">
              Zoek op bedrijfsnaam of KVK-nummer
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Bijv. Test BV of 12345678"
                className="flex-1 border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
              />
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className={buttonVariants("primary", "px-4")}
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="h-4 w-4" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-card-foreground">
                Zoekresultaten ({searchResults.length})
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.kvkNumber}
                    onClick={() => handleSelectCompany(result)}
                    className="w-full text-left p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <p className="font-medium text-foreground">{result.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {result.address}, {result.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      KVK: {result.kvkNumber}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Manual Entry Button */}
          <button
            onClick={() => setShowManualForm(true)}
            className="w-full text-center text-sm text-primary underline-offset-4 hover:underline py-2"
          >
            Bedrijf niet gevonden? Handmatig invoeren
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-semibold text-card-foreground">
                Bedrijfsnaam *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                KVK-nummer *
              </label>
              <input
                type="text"
                required
                value={formData.kvkNumber}
                onChange={(e) => setFormData({ ...formData, kvkNumber: e.target.value })}
                className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                BTW-nummer *
              </label>
              <input
                type="text"
                required
                value={formData.btwNumber}
                onChange={(e) => setFormData({ ...formData, btwNumber: e.target.value })}
                className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                IBAN *
              </label>
              <input
                type="text"
                required
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                className="w-full border-0 border-b border-border bg-transparent px-1 pb-3 pt-1 text-sm text-foreground transition-all duration-300 focus:border-b-[2px] focus:border-primary focus:outline-none focus:ring-0"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-card-foreground">
                Banknaam *
              </label>
              <input
                type="text"
                required
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
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
      )}
    </div>
  );
}
