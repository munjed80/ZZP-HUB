"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTenantContext, requireSession } from "@/lib/auth/tenant";
import { CompanyRole } from "@prisma/client";
import {
  companySettingsSchema,
  emailSettingsSchema,
  profileBasicsSchema,
  type CompanySettingsInput,
  type EmailSettingsInput,
  type ProfileBasicsInput,
} from "./schema";

export async function fetchCompanyProfile() {
  const { userId } = await requireTenantContext();
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

  const { userId } = await requireTenantContext();
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
    console.error("Database Save Error:", error);
    console.error("Failed payload:", JSON.stringify(payload, null, 2));
    throw error;
  }
}

export async function updateEmailSettings(values: EmailSettingsInput) {
  "use server";

  const { userId } = await requireTenantContext();
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

export async function fetchUserAccount() {
  const { userId } = await requireTenantContext();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return {
    name: user.naam ?? "",
    email: user.email,
  };
}

export async function fetchAccountantInvites() {
  const { userId: companyId } = await requireTenantContext();
  const invites = await prisma.companyUser.findMany({
    where: {
      companyId,
      role: CompanyRole.ACCOUNTANT,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      invitedEmail: true,
      status: true,
      canRead: true,
      canEdit: true,
      canExport: true,
      canBTW: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  return invites.map((invite) => ({
    id: invite.id,
    email: invite.invitedEmail ?? invite.user?.email ?? "Onbekend",
    status: invite.status,
    canRead: invite.canRead,
    canEdit: invite.canEdit,
    canExport: invite.canExport,
    canBTW: invite.canBTW,
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
  }));
}

export async function saveProfileBasics(values: ProfileBasicsInput) {
  "use server";

  const { userId } = await requireTenantContext();
  const data = profileBasicsSchema.parse(values);

  const trimmedName = data.name.trim();
  const trimmedCompanyName = data.companyName?.trim();

  await prisma.user.update({
    where: { id: userId },
    data: { naam: trimmedName },
  });

  if (trimmedCompanyName) {
    await prisma.companyProfile.updateMany({
      where: { userId },
      data: { companyName: trimmedCompanyName },
    });
  }

  revalidatePath("/instellingen");

  return {
    name: trimmedName,
    companyName: trimmedCompanyName ?? "",
  };
}

export async function saveProfileAvatar(avatarDataUrl: string) {
  "use server";

  const { userId } = await requireTenantContext();
  const safeAvatar = avatarDataUrl.trim();
  if (!safeAvatar) {
    throw new Error("Geen afbeelding aangeleverd.");
  }

  const profile = await prisma.companyProfile.findUnique({ where: { userId } });
  if (!profile) {
    return null;
  }

  const updated = await prisma.companyProfile.update({
    where: { userId },
    data: { logoUrl: safeAvatar },
  });

  revalidatePath("/instellingen");
  return updated.logoUrl ?? null;
}

export async function changePassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
}) {
  "use server";
  const { userId } = await requireTenantContext();
  
  // Validate password policy
  if (newPassword.length < 8) {
    throw new Error("Nieuw wachtwoord moet minimaal 8 tekens zijn.");
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

  revalidatePath("/instellingen");
  return { success: true };
}

export async function downloadBackup() {
  "use server";

  const { userId } = await requireTenantContext();

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

export async function linkAccountantToCompany(input: {
  accountantEmail: string;
  canRead?: boolean;
  canEdit?: boolean;
  canExport?: boolean;
  canBTW?: boolean;
}) {
  "use server";

  const { userId: companyId } = await requireTenantContext();
  const { normalizeEmail } = await import("@/lib/utils");
  const { CompanyUserStatus } = await import("@prisma/client");

  // Validate and normalize email
  let accountantEmail: string;
  try {
    accountantEmail = normalizeEmail(input.accountantEmail);
  } catch {
    throw new Error("Ongeldig e-mailadres");
  }

  // Find the accountant user by email
  const accountantUser = await prisma.user.findUnique({
    where: { email: accountantEmail },
    select: { id: true, email: true },
  });

  if (!accountantUser) {
    throw new Error("Accountant gebruiker niet gevonden");
  }

  // Check if user is already an accountant for any company
  const existingAccountantRole = await prisma.companyUser.findFirst({
    where: {
      userId: accountantUser.id,
      role: CompanyRole.ACCOUNTANT,
    },
  });

  if (!existingAccountantRole) {
    throw new Error("Gebruiker is geen accountant");
  }

  // Create or upsert the CompanyUser record
  await prisma.companyUser.upsert({
    where: {
      companyId_userId: {
        companyId: companyId,
        userId: accountantUser.id,
      },
    },
    update: {
      status: CompanyUserStatus.ACTIVE,
      canRead: input.canRead ?? true,
      canEdit: input.canEdit ?? false,
      canExport: input.canExport ?? false,
      canBTW: input.canBTW ?? false,
    },
    create: {
      companyId: companyId,
      userId: accountantUser.id,
      invitedEmail: accountantEmail,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.ACTIVE,
      canRead: input.canRead ?? true,
      canEdit: input.canEdit ?? false,
      canExport: input.canExport ?? false,
      canBTW: input.canBTW ?? false,
    },
  });

  revalidatePath("/instellingen");

  return {
    ok: true,
    companyId,
    accountantUserId: accountantUser.id,
  };
}
