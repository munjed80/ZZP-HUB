import { z } from "zod";

export const companySettingsSchema = z.object({
  companyName: z.string().min(2, "Bedrijfsnaam is verplicht"),
  address: z.string().min(2, "Adres is verplicht"),
  postalCode: z.string().min(4, "Postcode is verplicht"),
  city: z.string().min(2, "Plaats is verplicht"),
  kvkNumber: z.string().min(6, "KVK-nummer is verplicht"),
  btwNumber: z.string().min(4, "BTW-nummer is verplicht"),
  iban: z.string().min(8, "IBAN is verplicht"),
  bankName: z.string().min(2, "Bank is verplicht"),
  paymentTerms: z.coerce.number().int().positive().min(1, "Betaaltermijn is verplicht"),
  logoUrl: z
    .string()
    .url("Voer een geldige URL in")
    .optional()
    .or(z.literal("")),
  korEnabled: z.boolean().default(false),
});

export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

export const emailSettingsSchema = z.object({
  emailSenderName: z.string().min(2, "Afzendernaam is verplicht"),
  emailReplyTo: z
    .string()
    .email("Voer een geldig reply-to e-mailadres in")
    .optional()
    .or(z.literal("")),
});

export type EmailSettingsInput = z.infer<typeof emailSettingsSchema>;
