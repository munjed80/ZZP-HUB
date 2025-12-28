import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const facturen = [
  { nummer: "INV-2025-012", klant: "Studio Delta", bedrag: 2450, status: "Open", tarief: "21%" },
  { nummer: "INV-2025-011", klant: "Gemeente Utrecht", bedrag: 6200, status: "Betaald", tarief: "0% verlegd" },
  { nummer: "INV-2025-010", klant: "Bright BV", bedrag: 1800, status: "Concept", tarief: "9%" },
];

export default function FacturenPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Facturen</h1>
        <p className="text-sm text-slate-600">
          Beheer openstaande facturen, verstuur herinneringen en volg betalingen. BTW 21%, 9%, 0% en verlegd worden ondersteund.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/facturen/nieuw"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Nieuwe factuur (concept)
          </Link>
          <Link
            href="/facturen/voorbeeld"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 hover:ring-slate-300"
          >
            Voorbeeld weergave / PDF
          </Link>
        </div>
      </div>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Laatste facturen</CardTitle>
          <Badge variant="info">Betaalstatus live</Badge>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200">
            {facturen.map((factuur) => (
              <div key={factuur.nummer} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{factuur.nummer}</p>
                  <p className="text-sm text-slate-600">{factuur.klant}</p>
                  <p className="text-xs text-slate-500">BTW tarief: {factuur.tarief}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={factuur.status === "Betaald" ? "success" : "warning"}>
                    {factuur.status}
                  </Badge>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatBedrag(factuur.bedrag)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
