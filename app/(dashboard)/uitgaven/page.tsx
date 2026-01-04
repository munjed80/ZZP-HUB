import { getExpenses } from "./actions";
import { UitgavenClient } from "./uitgaven-client";
import type { ExpenseClientShape } from "./schema";

type UitgavenPaginaProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function UitgavenPagina({ searchParams }: UitgavenPaginaProps) {
  let expenses: ExpenseClientShape[] = [];
  let errorMessage: string | undefined;

  try {
    expenses = await getExpenses();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Uitgaven konden niet worden geladen.";
  }

  const forceOpen = searchParams?.action === "new";

  return <UitgavenClient expenses={expenses} errorMessage={errorMessage} forceOpen={forceOpen} />;
}
