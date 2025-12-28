import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const relaties = [
  {
    naam: "Studio Delta",
    contact: "info@studiodelta.nl",
    adres: "Keizersgracht 12, 1015 CX Amsterdam",
    btw: "NL123456789B01",
  },
  {
    naam: "Gemeente Utrecht",
    contact: "inkoop@utrecht.nl",
    adres: "Stadsplateau 1, 3521 AZ Utrecht",
    btw: "NL987654321B01",
  },
];

export default function RelatiesPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Relaties</h1>
        <p className="text-sm text-slate-600">
          Beheer klanten. Gegevens worden automatisch ingevuld bij facturen en offertes (adres, BTW-ID, betalingstermijn).
        </p>
      </div>

      <Card className="bg-white">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" aria-hidden />
            <CardTitle>Klanten</CardTitle>
          </div>
          <Badge variant="info">CRUD placeholder</Badge>
        </CardHeader>
        <CardContent className="divide-y divide-slate-200">
          {relaties.map((relatie) => (
            <div key={relatie.naam} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{relatie.naam}</p>
                <p className="text-sm text-slate-600">{relatie.contact}</p>
                <p className="text-xs text-slate-500">{relatie.adres}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">BTW: {relatie.btw}</Badge>
                <button className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800">
                  Bewerk
                </button>
                <button className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-800 hover:border-slate-400">
                  Verwijder
                </button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
