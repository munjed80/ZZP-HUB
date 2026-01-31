import { z } from "zod";

/**
 * Valid role values for registration:
 * - "ZZP" maps to UserRole.COMPANY_ADMIN (ZZP freelancer with own company)
 * - "ACCOUNTANT" maps to UserRole.ACCOUNTANT (accountant who manages clients)
 */
export const REGISTRATION_ROLES = ["ZZP", "ACCOUNTANT"] as const;
export type RegistrationRole = typeof REGISTRATION_ROLES[number];

export const registerSchema = z.object({
  role: z.enum(REGISTRATION_ROLES, {
    errorMap: () => ({ message: "Kies een geldige rol (ZZP of Accountant)" }),
  }),
  bedrijfsnaam: z.string().min(2, "Bedrijfsnaam is verplicht"),
  email: z.string().email("Voer een geldig e-mailadres in"),
  password: z.string().min(6, "Minimaal 6 tekens"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
