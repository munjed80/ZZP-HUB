import { getClients } from "./actions";
import { RelatiesClient } from "./relaties-client";

export default async function RelatiesPagina() {
  const clients = await getClients();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Relaties</h1>
        <p className="text-sm text-slate-600 mt-1">
          Beheer klantgegevens voor facturen en offertes
        </p>
      </div>

      <RelatiesClient clients={clients} />
    </div>
  );
}
