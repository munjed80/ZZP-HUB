import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Sessie = {
  gebruiker: string;
  abonnement: string;
};

export function formatBedrag(bedrag: number) {
  return bedrag.toLocaleString("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

/**
 * Roles that are considered "accountant" roles
 * These users should be redirected to /accountant-portal instead of /dashboard
 */
export const ACCOUNTANT_ROLES = [
  "ACCOUNTANT",
  "ACCOUNTANT_VIEW",
  "ACCOUNTANT_EDIT",
] as const;

/**
 * Check if a role is an accountant role
 * Use this utility for consistent role checking throughout the app
 */
export function isAccountantRole(role: string | undefined | null): boolean {
  if (!role) return false;
  return ACCOUNTANT_ROLES.includes(role as typeof ACCOUNTANT_ROLES[number]);
}

export function assertUniqueHrefs(
  items: Array<{ href: string }>,
  context: string,
): void {
  if (process.env.NODE_ENV === "production") return;
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const item of items) {
    if (seen.has(item.href)) {
      duplicates.add(item.href);
    } else {
      seen.add(item.href);
    }
  }
  if (duplicates.size > 0) {
    throw new Error(
      `[${context}] Duplicate navigation hrefs: ${[...duplicates].join(", ")}`,
    );
  }
}
