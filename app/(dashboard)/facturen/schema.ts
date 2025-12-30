import { z } from "zod";

export const invoiceLineSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  quantity: z.coerce.number().positive("Aantal moet groter dan 0 zijn"),
  unit: z.enum(["UUR", "STUK", "PROJECT", "KM", "LICENTIE"], {
    required_error: "Eenheid is verplicht",
  }),
  price: z.coerce.number().nonnegative("Prijs moet 0 of hoger zijn"),
  vat: z.enum(["21", "9", "0"], {
    required_error: "BTW tarief is verplicht",
  }),
});

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Relatie is verplicht"),
  invoiceNum: z.string().min(3, "Factuurnummer is verplicht"),
  date: z.string().min(1, "Factuurdatum is verplicht"),
  dueDate: z.string().min(1, "Vervaldatum is verplicht"),
  lines: z.array(invoiceLineSchema).min(1, "Voeg minimaal één regel toe"),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceLineValues = z.infer<typeof invoiceLineSchema>;
