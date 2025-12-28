import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(1, "Naam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  address: z.string().min(1, "Adres is verplicht"),
  postalCode: z.string().min(1, "Postcode is verplicht"),
  city: z.string().min(1, "Stad is verplicht"),
  kvkNumber: z.string().optional().nullable(),
  btwId: z.string().optional().nullable(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
