import { getClients } from "./actions";
import { RelatiesClient } from "./relaties-client";

export default async function RelatiesPagina() {
  const clients = await getClients();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary via-accent to-warning"></div>
          <h1 className="text-3xl font-bold text-foreground">Relaties</h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium">
          Beheer klantgegevens voor facturen en offertes
        </p>
      </div>

      <RelatiesClient clients={clients} />
    </div>
  );
}
