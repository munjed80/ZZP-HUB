"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const companySchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
  naam: z.string().min(1, "Naam is verplicht"),
  password: z.string().min(6, "Wachtwoord minimaal 6 tekens").optional(),
  companyName: z.string().min(1, "Bedrijfsnaam is verplicht"),
  address: z.string().min(1, "Adres is verplicht"),
  postalCode: z.string().min(1, "Postcode is verplicht"),
  city: z.string().min(1, "Plaats is verplicht"),
  kvkNumber: z.string().min(1, "KVK is verplicht"),
  btwNumber: z.string().min(1, "BTW nummer is verplicht"),
  iban: z.string().min(1, "IBAN is verplicht"),
  bankName: z.string().min(1, "Banknaam is verplicht"),
  paymentTerms: z.string().min(1, "Betalingstermijn is verplicht"),
});

const updateCompanySchema = companySchema.partial({ password: true });

async function assertSuperAdmin() {
  const sessionUser = await requireUser();
  if (sessionUser.role !== UserRole.SUPERADMIN) {
    throw new Error("Alleen SuperAdmins hebben toegang tot deze actie.");
  }
}

export async function listCompanies() {
  await assertSuperAdmin();
  return prisma.user.findMany({
    include: { companyProfile: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCompany(data: unknown) {
  await assertSuperAdmin();
  const parsed = companySchema.parse(data);

  if (!parsed.password) {
    return { success: false, message: "Wachtwoord is verplicht." };
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (exists) {
    return { success: false, message: "E-mailadres is al in gebruik." };
  }

  const passwordHash = await bcrypt.hash(parsed.password, 12);

  await prisma.user.create({
    data: {
      email: parsed.email,
      naam: parsed.naam,
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      companyProfile: {
        create: {
          companyName: parsed.companyName,
          address: parsed.address,
          postalCode: parsed.postalCode,
          city: parsed.city,
          kvkNumber: parsed.kvkNumber,
          btwNumber: parsed.btwNumber,
          iban: parsed.iban,
          bankName: parsed.bankName,
          paymentTerms: parsed.paymentTerms,
          korEnabled: false,
        },
      },
    },
  });

  revalidatePath("/admin/companies");
  return { success: true };
}

export async function updateCompany(userId: string, data: unknown) {
  await assertSuperAdmin();
  const parsed = updateCompanySchema.parse(data);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) {
    return { success: false, message: "Gebruiker niet gevonden." };
  }
  if (target.role === UserRole.SUPERADMIN) {
    return { success: false, message: "SuperAdmin accounts kunnen hier niet worden gewijzigd." };
  }

  const updates: Record<string, unknown> = {
    email: parsed.email,
    naam: parsed.naam,
  };

  if (parsed.password) {
    updates.passwordHash = await bcrypt.hash(parsed.password, 12);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      ...updates,
      companyProfile: {
        upsert: {
          where: { userId },
          update: {
            companyName: parsed.companyName,
            address: parsed.address,
            postalCode: parsed.postalCode,
            city: parsed.city,
            kvkNumber: parsed.kvkNumber,
            btwNumber: parsed.btwNumber,
            iban: parsed.iban,
            bankName: parsed.bankName,
            paymentTerms: parsed.paymentTerms,
          },
          create: {
            companyName: parsed.companyName,
            address: parsed.address,
            postalCode: parsed.postalCode,
            city: parsed.city,
            kvkNumber: parsed.kvkNumber,
            btwNumber: parsed.btwNumber,
            iban: parsed.iban,
            bankName: parsed.bankName,
            paymentTerms: parsed.paymentTerms,
            korEnabled: false,
          },
        },
      },
    },
  });

  revalidatePath("/admin/companies");
  return { success: true };
}

export async function setCompanySuspended(userId: string, isSuspended: boolean) {
  await assertSuperAdmin();
  await prisma.user.update({
    where: { id: userId },
    data: { isSuspended },
  });
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function deleteCompany(userId: string) {
  await assertSuperAdmin();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) {
    return { success: false, message: "Gebruiker niet gevonden." };
  }
  if (user.role === UserRole.SUPERADMIN) {
    return { success: false, message: "SuperAdmin accounts kunnen niet verwijderd worden." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoiceLine.deleteMany({ where: { invoice: { userId } } });
    await tx.quotationLine.deleteMany({ where: { quotation: { userId } } });
    await tx.invoice.deleteMany({ where: { userId } });
    await tx.quotation.deleteMany({ where: { userId } });
    await tx.expense.deleteMany({ where: { userId } });
    await tx.timeEntry.deleteMany({ where: { userId } });
    await tx.client.deleteMany({ where: { userId } });
    await tx.companyProfile.deleteMany({ where: { userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  revalidatePath("/admin/companies");
  return { success: true };
}
