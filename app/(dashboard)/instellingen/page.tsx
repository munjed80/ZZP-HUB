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
    <div className="min-h-screen bg-white">
      {/* Clean header - Light mode only */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 border-b border-gray-100 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-gray-900">
            Instellingen
          </h1>
          <p className="mt-2 text-base text-gray-600 max-w-2xl">
            Beheer uw profiel, bedrijfsgegevens en voorkeuren
          </p>
        </div>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} user={user} />
    </div>
  );
}
