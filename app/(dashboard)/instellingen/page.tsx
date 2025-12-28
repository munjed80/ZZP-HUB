import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";
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

      <div className="grid gap-4 md:grid-cols-3">
        <SettingsForm initialProfile={profiel} />

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>Abonnement</CardTitle>
            <Badge variant="success">Maandelijks</Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-700">
              {abonnement.type} tarief: {abonnement.prijs} per maand. Opzegbaar per
              maand en gericht op groeiende freelancers.
            </p>
            <p className="text-sm font-semibold text-slate-900">Status: {abonnement.status}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
