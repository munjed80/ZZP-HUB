import { z } from "zod";

export const registerSchema = z
  .object({
    role: z.enum(["ZZP", "ACCOUNTANT"], { required_error: "Kies een rol" }),
    bedrijfsnaam: z.string().optional(),
    email: z.string().email("Voer een geldig e-mailadres in"),
    password: z.string().min(6, "Minimaal 6 tekens"),
  })
  .superRefine((data, ctx) => {
    if (data.role === "ZZP") {
      const name = data.bedrijfsnaam?.trim() ?? "";
      if (name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bedrijfsnaam is verplicht",
          path: ["bedrijfsnaam"],
        });
      }
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;
