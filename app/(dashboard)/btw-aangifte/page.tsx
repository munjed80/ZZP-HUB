import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBedrag } from "@/lib/utils";

const kwartalen = [
  { periode: "Q1", verschuldigd: 3120, status: "Concept" },
  { periode: "Q2", verschuldigd: 2840, status: "Ingediend" },
  { periode: "Q3", verschuldigd: 0, status: "Nog starten" },
];

export default function BtwPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">BTW-aangifte</h1>
        <p className="text-sm text-slate-600">
          Bereid je kwartaal-aangifte voor met placeholders voor berekeningen en afdracht.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vierkantscontrole</CardTitle>
            <Badge variant="warning">Placeholder</Badge>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-slate-700">
              <li>1. Verzamel omzetfacturen en gekoppelde BTW-tarieven (21% / 9%).</li>
              <li>2. Trek aftrekbare voorbelasting van uitgaven af.</li>
              <li>3. Controleer intracommunautaire prestaties en correcties.</li>
              <li>4. Zet reservering klaar voor automatische betaling via maandelijkse incasso.</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kwartaalstatus</CardTitle>
            <Badge variant="info">Live inzicht</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {kwartalen.map((item) => (
                <div key={item.periode} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.periode}</p>
                    <p className="text-xs text-slate-600">{item.status}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatBedrag(item.verschuldigd)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
