import { z } from "zod";

export const registerSchema = z.object({
  bedrijfsnaam: z.string().min(2, "Bedrijfsnaam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Minimaal 6 tekens"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
