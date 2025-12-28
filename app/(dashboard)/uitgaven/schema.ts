import { z } from "zod";
import type { BtwTarief } from "@prisma/client";

export const categories = ["Kantoorkosten", "Reiskosten", "Marketing", "Apparatuur", "Overig"] as const;

const vatRates = ["HOOG_21", "LAAG_9", "NUL_0", "VRIJGESTELD", "VERLEGD"] as const satisfies readonly BtwTarief[];

export const expenseSchema = z.object({
  description: z.string().min(1, "Omschrijving is verplicht"),
  category: z.enum(categories, {
    required_error: "Categorie is verplicht",
  }),
  amountExcl: z
    .number({ required_error: "Bedrag exclusief BTW is verplicht" })
    .positive("Vul een bedrag groter dan 0 in"),
  vatRate: z.enum(vatRates, {
    required_error: "BTW tarief is verplicht",
  }),
  date: z.string().min(1, "Datum is verplicht"),
  receiptUrl: z
    .string()
    .url("Voer een geldige URL in")
    .optional()
    .or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
