import { getClients } from "../../relaties/actions";
import { InvoiceForm } from "./invoice-form";

export default async function NieuweFactuurPagina() {
  const clients = await getClients();

  return <InvoiceForm clients={clients} />;
}
