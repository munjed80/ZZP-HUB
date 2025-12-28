import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const uitgaven = [
  { categorie: "Software & tools", bedrag: 320, beschrijving: "SaaS licenties (maandelijks)" },
  { categorie: "Reiskosten", bedrag: 145, beschrijving: "Kilometervergoeding klantbezoek" },
  { categorie: "Hardware", bedrag: 980, beschrijving: "Laptop upgrade" },
];

export default function UitgavenPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Uitgaven</h1>
        <p className="text-sm text-slate-600">
          Log zakelijke kosten en houd reserveringen bij voor BTW en inkomstenbelasting.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Laatste boekingen</CardTitle>
            <Badge variant="info">Klaar voor export</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uitgaven.map((item) => (
                <div key={item.beschrijving} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">{item.categorie}</p>
                    <p className="text-sm font-semibold text-slate-900">{formatBedrag(item.bedrag)}</p>
                  </div>
                  <p className="text-xs text-slate-600">{item.beschrijving}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logging</CardTitle>
            <Badge variant="success">Beveiligd</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700">
              Upload bonnen en koppel ze aan transacties. Authenticatie wordt voorbereid zodat
              uitgaven alleen zichtbaar zijn binnen een geldige sessie.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
