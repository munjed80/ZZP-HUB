import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const statistieken = [
  { label: "Omzet (maand)", waarde: 18250, accent: "success" as const },
  { label: "Uitgaven (maand)", waarde: 7420, accent: "warning" as const },
  { label: "BTW te reserveren", waarde: 3140, accent: "info" as const },
];

const acties = [
  "Controleer conceptfacturen en plan automatische verzending.",
  "Bewaar reservering voor kwartalen zodat btw-aangifte soepel verloopt.",
  "Check abonnement: maandelijkse incasso gepland voor 1e van de maand.",
];

export default function DashboardPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Overzicht</h1>
        <p className="text-sm text-slate-600">
          Direct inzicht in de financiële gezondheid van je ZZP-bedrijf.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statistieken.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
              <Badge variant={item.accent}>Realtime</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatBedrag(item.waarde)}</p>
              <p className="text-xs text-slate-500">
                Inclusief reservering voor maandelijkse abonnementskosten.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Belangrijk vandaag</CardTitle>
          <Badge variant="info">Workflow</Badge>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {acties.map((actie) => (
              <li key={actie} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-500" />
                <p className="text-sm text-slate-700">{actie}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
