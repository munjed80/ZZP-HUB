import { SettingsTabs } from "./settings-tabs";
import { fetchCompanyProfile, fetchUserAccount } from "./actions";
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
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Account &amp; Voorkeuren</h1>
        <p className="text-sm text-slate-600 mt-1">Beheer profiel, voorkeuren en abonnement</p>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} user={user} />
    </div>
  );
}
