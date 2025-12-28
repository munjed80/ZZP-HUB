import { getExpenses } from "./actions";
import { UitgavenClient } from "./uitgaven-client";
import type { ExpenseClientShape } from "./schema";

export default async function UitgavenPagina() {
  let expenses: ExpenseClientShape[] = [];
  let errorMessage: string | undefined;

  try {
    expenses = await getExpenses();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Uitgaven konden niet worden geladen.";
  }

  return <UitgavenClient expenses={expenses} errorMessage={errorMessage} />;
}
