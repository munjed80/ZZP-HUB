type ClassValue = string | boolean | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
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
