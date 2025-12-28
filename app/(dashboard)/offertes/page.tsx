import { FileSignature } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const offertes = [
  { nummer: "OFF-2025-004", klant: "Studio Delta", bedrag: 4200, status: "Verzonden" },
  { nummer: "OFF-2025-003", klant: "Bright BV", bedrag: 1850, status: "Geaccepteerd" },
];

export default function OffertesPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Offertes</h1>
        <p className="text-sm text-slate-600">
          Stel offertes op met BTW 21%, 9%, 0% of verlegd. Converteer geaccepteerde offertes naar facturen met één klik.
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Laatste offertes</CardTitle>
          </div>
          <Badge variant="info">Converteren naar factuur</Badge>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200">
          {offertes.map((offerte) => (
            <div key={offerte.nummer} className="flex flex-col gap-2 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{offerte.nummer}</p>
                <p className="text-sm text-slate-600">{offerte.klant}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={offerte.status === "Geaccepteerd" ? "success" : "info"}>
                  {offerte.status}
                </Badge>
                <p className="text-sm font-semibold text-slate-900">{formatBedrag(offerte.bedrag)}</p>
                <button className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
                  Converteer naar factuur
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
