"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId, requireUser } from "@/lib/auth";
import {
  companySettingsSchema,
  emailSettingsSchema,
  type CompanySettingsInput,
  type EmailSettingsInput,
} from "./schema";

export async function fetchCompanyProfile() {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
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

  const { id: userId } = await requireUser();
  const data = companySettingsSchema.parse(values);
  const logoUrl = data.logoUrl?.trim();
  const paymentTerms = `${data.paymentTerms}`.trim();

  const payload = {
    companyName: data.companyName.trim(),
    address: data.address.trim(),
    postalCode: data.postalCode.trim(),
    city: data.city.trim(),
    kvkNumber: data.kvkNumber.trim(),
    btwNumber: data.btwNumber.trim(),
    iban: data.iban.trim(),
    bankName: data.bankName.trim(),
    paymentTerms,
    logoUrl: logoUrl || null,
    korEnabled: data.korEnabled ?? false,
    userId,
  };

  try {
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
  } catch (error) {
    console.error("Settings Save Error:", error);
    throw error;
  }
}

export async function updateEmailSettings(values: EmailSettingsInput) {
  "use server";

  const { id: userId } = await requireUser();
  const data = emailSettingsSchema.parse(values);
  const replyTo = data.emailReplyTo?.trim();

  const updateResult = await prisma.companyProfile.updateMany({
    where: { userId },
    data: {
      emailSenderName: data.emailSenderName.trim(),
      emailReplyTo: replyTo ? replyTo.toLowerCase() : null,
    },
  });

  if (updateResult.count === 0) {
    throw new Error("Maak eerst een bedrijfsprofiel aan voordat je e-mailinstellingen opslaat.");
  }

  revalidatePath("/instellingen");
  return prisma.companyProfile.findUnique({ where: { userId } });
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  "use server";
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("Gebruiker niet gevonden.");
  }

  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) {
    throw new Error("Huidig wachtwoord is onjuist.");
  }

  const password = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password },
  });

  return { success: true };
}

export async function downloadBackup() {
  "use server";

  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }

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
