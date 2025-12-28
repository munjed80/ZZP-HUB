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

export function getCurrentUserId(): string {
  // In een echte implementatie koppel je dit aan de geauthenticeerde gebruiker of provider.
  return "00000000-0000-0000-0000-000000000001";
}
