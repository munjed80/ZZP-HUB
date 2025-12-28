import { getClients } from "../../relaties/actions";
import { QuotationForm } from "./quotation-form";

export default async function NieuweOffertePagina() {
  const clients = await getClients();

  return <QuotationForm clients={clients} />;
}
