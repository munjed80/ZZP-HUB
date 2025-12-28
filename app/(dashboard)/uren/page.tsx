import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const uren = [
  { datum: "2025-02-10", project: "Ontwerp sprint", uren: 6, notitie: "Wireframes en design updates" },
  { datum: "2025-02-11", project: "Development", uren: 7.5, notitie: "Featurebouw en testen" },
];

export default function UrenPagina() {
  const totaal = uren.reduce((sum, uur) => sum + uur.uren, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Urenregistratie</h1>
        <p className="text-sm text-slate-600">
          Registreer uren richting het 1.225-urencriterium. Koppel uren aan projecten en facturen.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Recente uren</CardTitle>
          </div>
          <Badge variant="info">{totaal.toFixed(1)} uur deze periode</Badge>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200">
          {uren.map((uur) => (
            <div key={uur.datum + uur.project} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{uur.project}</p>
                <p className="text-xs text-slate-600">{uur.datum}</p>
                <p className="text-xs text-slate-500">{uur.notitie}</p>
              </div>
              <Badge variant="success">{uur.uren} uur</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
