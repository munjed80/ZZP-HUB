import { SettingsTabs } from "./settings-tabs";
import { fetchCompanyProfile } from "./actions";
import { SupportForm } from "@/components/support/support-form";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

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

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SupportForm minimal context="Instellingen" className="h-full" />
        <Card className="h-full border-slate-200 bg-slate-50/80 shadow-none ring-1 ring-slate-100">
          <CardContent className="space-y-2">
            <CardTitle className="text-base font-semibold text-slate-900">Snel contact</CardTitle>
            <p className="text-sm text-slate-700">
              Bereik ons direct vanuit Instellingen. Vermeld je bedrijfsnaam of factuurnummer voor een gerichte reactie.
            </p>
            <p className="text-xs text-slate-500">Reactie binnen één werkdag.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
