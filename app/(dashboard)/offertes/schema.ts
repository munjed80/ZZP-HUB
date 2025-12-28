import { z } from "zod";

export const quotationLineSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.coerce.number().positive("Aantal moet groter dan 0 zijn"),
  unit: z.enum(["UUR", "STUK", "PROJECT", "KM"], {
    required_error: "Eenheid is verplicht",
  }),
  price: z.coerce.number().nonnegative("Prijs moet 0 of hoger zijn"),
  vat: z.enum(["21", "9", "0"], {
    required_error: "BTW tarief is verplicht",
  }),
});

export const quotationSchema = z.object({
  clientId: z.string().min(1, "Relatie is verplicht"),
  quoteNum: z.string().min(3, "Offertenummer is verplicht"),
  date: z.string().min(1, "Offertedatum is verplicht"),
  validUntil: z.string().min(1, "Geldig tot is verplicht"),
  lines: z.array(quotationLineSchema).min(1, "Voeg minimaal één regel toe"),
});

export type QuotationFormValues = z.infer<typeof quotationSchema>;
export type QuotationLineValues = z.infer<typeof quotationLineSchema>;
