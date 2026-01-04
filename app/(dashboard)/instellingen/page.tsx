import { SettingsTabs } from "./settings-tabs";
import { fetchCompanyProfile } from "./actions";

const abonnement = {
  type: "Maandelijks",
  prijs: "€29,00",
  status: "Actief",
};

export default async function InstellingenPagina() {
  const profiel = await fetchCompanyProfile();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Instellingen</h1>
        <p className="text-sm text-slate-600 mt-1">
          Beheer bedrijfsprofiel en abonnement
        </p>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} />
    </div>
  );
}
