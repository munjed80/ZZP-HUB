import { SettingsTabs } from "./settings-tabs";
import { fetchCompanyProfile, fetchUserAccount } from "./actions";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Instellingen",
  description: "Beheer uw bedrijfsprofiel, accountinstellingen en abonnement.",
};

const abonnement = {
  type: "Elite",
  prijs: "€4,99 / maand",
  status: "Actief",
};

export default async function InstellingenPagina() {
  const profiel = await fetchCompanyProfile();
  const user = await fetchUserAccount();

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-card to-accent/10 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Instellingen</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Account &amp; Voorkeuren</h1>
            <p className="text-sm text-muted-foreground">
              Beheer profiel, voorkeuren en abonnement vanuit één stijlvolle plek.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/40 bg-card/70 px-4 py-3 shadow-sm">
            <Badge variant="success">{abonnement.status}</Badge>
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold text-foreground">{abonnement.type}</span>
              <span className="text-xs text-muted-foreground">{abonnement.prijs}</span>
            </div>
          </div>
        </div>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} user={user} />
    </div>
  );
}
