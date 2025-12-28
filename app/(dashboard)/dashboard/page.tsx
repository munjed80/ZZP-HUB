import { TrendingUp, TrendingDown, Receipt, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const statistieken = [
  { label: "Omzet (maand)", waarde: 18250, accent: "success" as const, icon: TrendingUp },
  { label: "Uitgaven (maand)", waarde: 7420, accent: "warning" as const, icon: TrendingDown },
  { label: "BTW te reserveren", waarde: 3140, accent: "info" as const, icon: Receipt },
];

const acties = [
  "Controleer conceptfacturen voor BTW 21%, 9% en verlegd.",
  "Automatiseer factuurheaders met bedrijfsgegevens uit Instellingen.",
  "Reserveer voldoende BTW-bedrag voor komende kwartaalafdracht.",
  "Log uren voor 1225-criterium en koppel aan projecten.",
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
        {statistieken.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label} className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{item.label}</CardTitle>
                  <Icon className="h-4 w-4 text-slate-500" aria-hidden />
                </div>
                <Badge variant={item.accent}>Realtime</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{formatBedrag(item.waarde)}</p>
                <p className="text-xs text-slate-500">
                  Inclusief reservering voor abonnementskosten en voorlopige aangifte.
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Belangrijk vandaag</CardTitle>
            <Badge variant="info">Workflow</Badge>
          </div>
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
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
            <Timer className="h-4 w-4" aria-hidden /> Urenregistratie richting 1225 uur per jaar.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
