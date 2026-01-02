"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "./schema";

export async function registerCompany(values: RegisterInput) {
  const data = registerSchema.parse(values);

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { success: false, message: "E-mailadres is al in gebruik." };
  }

  const passwordHash = await bcrypt.hash(data.wachtwoord, 12);

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      naam: data.bedrijfsnaam,
      role: UserRole.COMPANY_ADMIN,
    },
  });

  return { success: true };
}
