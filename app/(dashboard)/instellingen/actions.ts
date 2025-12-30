"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { companySettingsSchema, type CompanySettingsInput } from "./schema";

export async function fetchCompanyProfile() {
  const userId = getCurrentUserId();
  try {
    return await prisma.companyProfile.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error("Kon bedrijfsprofiel niet ophalen", error);
    return null;
  }
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
    korEnabled: data.korEnabled ?? false,
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
      korEnabled: payload.korEnabled,
    },
  });

  revalidatePath("/instellingen");
  return profile;
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  "use server";
  const userId = getCurrentUserId();
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

  await new Promise((resolve) => setTimeout(resolve, 1000));
  return { success: true, newPassword, currentPassword };
}

export async function downloadBackup() {
  "use server";

  const userId = getCurrentUserId();

  const [clients, invoices, expenses] = await Promise.all([
    prisma.client.findMany({ where: { userId } }),
    prisma.invoice.findMany({
      where: { userId },
      include: { lines: true, client: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    clients,
    invoices: invoices.map((invoice) => ({
      ...invoice,
      date: invoice.date.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      lines: invoice.lines.map((line) => ({
        ...line,
        quantity: Number(line.quantity),
        price: Number(line.price),
        amount: Number(line.amount),
      })),
    })),
    expenses: expenses.map((expense) => ({
      ...expense,
      amountExcl: Number(expense.amountExcl),
      date: expense.date.toISOString(),
      createdAt: expense.createdAt.toISOString(),
    })),
  };
}
