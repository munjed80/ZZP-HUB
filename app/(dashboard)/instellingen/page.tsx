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
    <div className="space-y-8 sm:space-y-10">
      {/* Enhanced Header with Visual Hierarchy */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50/80 via-white/95 to-teal-50/60 dark:from-emerald-950/40 dark:via-slate-900/95 dark:to-teal-950/30 p-6 sm:p-8 shadow-[0_8px_40px_-12px_rgba(16,185,129,0.25)]">
        {/* Decorative gradient orb */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-emerald-400/20 via-teal-400/10 to-transparent blur-3xl" aria-hidden="true" />
        
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" aria-hidden="true" />
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Instellingen</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account &amp; Voorkeuren
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium max-w-2xl">
              Beheer uw profiel, voorkeuren en abonnement vanuit één centrale plek met directe preview.
            </p>
          </div>
          
          {/* Premium status badge */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 dark:border-emerald-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm px-5 py-4 shadow-[0_8px_32px_-12px_rgba(16,185,129,0.3)]">
            <Badge variant="success" className="shadow-sm">{abonnement.status}</Badge>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 dark:text-white">{abonnement.type}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{abonnement.prijs}</span>
            </div>
          </div>
        </div>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} user={user} />
    </div>
  );
}
