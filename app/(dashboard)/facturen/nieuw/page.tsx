import { getClients } from "../../relaties/actions";
import { InvoiceForm } from "./invoice-form";
import { fetchCompanyProfile } from "../../instellingen/actions";

export default async function NieuweFactuurPagina() {
  const [clients, profile] = await Promise.all([getClients(), fetchCompanyProfile()]);

  return <InvoiceForm clients={clients} korEnabled={profile?.korEnabled ?? false} />;
}
