"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "./schema";

export async function registerCompany(values: RegisterInput) {
  const data = registerSchema.parse(values);

  try {
    console.log("Register Attempt:", data.email);
    console.log("Register attempt", { emailMasked: data.email.replace(/(.).+(@.*)/, "$1***$2") });

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return { success: false, message: "E-mailadres is al in gebruik." };
    }

    const password = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        email: data.email,
        password,
        naam: data.bedrijfsnaam,
        role: UserRole.COMPANY_ADMIN,
      },
    });

    console.log("Register success", { emailMasked: data.email.replace(/(.).+(@.*)/, "$1***$2") });
    return { success: true };
  } catch (error) {
    console.error("Register failed", error);
    return { success: false, message: "Er ging iets mis. Probeer opnieuw." };
  }
}
