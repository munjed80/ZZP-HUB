import type { Sessie } from "./utils";

export function getDemoSessie(): Sessie {
  return {
    gebruiker: "Demo gebruiker",
    abonnement: "Maandelijks - proefperiode actief",
  };
}

export function isIngelogd(): boolean {
  // Vervang dit later met echte sessievalidatie (NextAuth, Clerk of een custom provider).
  return true;
}
