"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { companySettingsSchema, type CompanySettingsInput } from "./schema";

export async function fetchCompanyProfile() {
  const userId = getCurrentUserId();
  return prisma.companyProfile.findUnique({
    where: { userId },
  });
}

export async function updateCompanySettings(values: CompanySettingsInput) {
  "use server";

  const userId = getCurrentUserId();
  const data = companySettingsSchema.parse(values);

  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: "demo@zzp-hub.nl",
      passwordHash: "demo-placeholder-hash",
      naam: "Demo gebruiker",
    },
  });

  const payload = {
    companyName: data.companyName,
    address: data.address,
    postalCode: data.postalCode,
    city: data.city,
    kvkNumber: data.kvkNumber,
    btwNumber: data.btwNumber,
    iban: data.iban,
    bankName: data.bankName,
    paymentTerms: `${data.paymentTerms}`,
    logoUrl: data.logoUrl || null,
    userId,
  };

  const profile = await prisma.companyProfile.upsert({
    where: { userId },
    create: payload,
    update: {
      companyName: payload.companyName,
      address: payload.address,
      postalCode: payload.postalCode,
      city: payload.city,
      kvkNumber: payload.kvkNumber,
      btwNumber: payload.btwNumber,
      iban: payload.iban,
      bankName: payload.bankName,
      paymentTerms: payload.paymentTerms,
      logoUrl: payload.logoUrl,
    },
  });

  revalidatePath("/instellingen");
  return profile;
}
