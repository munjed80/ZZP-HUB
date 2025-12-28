import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const abonnement = {
  type: "Maandelijks",
  prijs: "€29,00",
  status: "Actief",
};

export default function InstellingenPagina() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Instellingen</h1>
        <p className="text-sm text-slate-600">
          Beheer profiel, abonnement en beveiliging. Alle teksten en flows zijn voorbereid
          voor Nederlandse gebruikers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profiel</CardTitle>
            <Badge variant="info">Authenticatie placeholder</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-700">
              Koppel straks je identiteit via NextAuth of een externe SSO. Sessies worden
              opgezet voor veilige toegang tot facturen, uitgaven en btw-aangiftes.
            </p>
            <p className="text-sm font-semibold text-slate-900">E-mailadres</p>
            <p className="text-sm text-slate-600">demo@zzp-hub.nl</p>
          </CardContent>
        </Card>

        <Card>
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
