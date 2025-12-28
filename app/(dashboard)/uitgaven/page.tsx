import { getExpenses } from "./actions";
import { UitgavenClient } from "./uitgaven-client";

export default async function UitgavenPagina() {
  const expenses = await getExpenses();

  return <UitgavenClient expenses={expenses} />;
}
