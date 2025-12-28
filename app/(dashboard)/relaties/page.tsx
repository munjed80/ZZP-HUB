import { getClients } from "./actions";
import { RelatiesClient } from "./relaties-client";

export default async function RelatiesPagina() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Relaties</h1>
        <p className="text-sm text-slate-600">
          Beheer klanten. Gegevens worden automatisch ingevuld bij facturen en offertes (adres, BTW-ID, betalingstermijn).
        </p>
      </div>

      <RelatiesClient clients={clients} />
    </div>
  );
}
