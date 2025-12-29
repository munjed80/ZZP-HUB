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
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-sm text-slate-600">
          Beheer profiel, bedrijfsgegevens en abonnement. Deze gegevens vullen automatisch de factuur-header en -footer.
        </p>
      </div>

      <SettingsTabs initialProfile={profiel} abonnement={abonnement} />
    </div>
  );
}
