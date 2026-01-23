"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";
import { CompanyRole, CompanyUserStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import AccountantInviteEmail from "@/components/emails/AccountantInviteEmail";
import { getAppBaseUrl } from "@/lib/base-url";
import { logInviteCreated } from "@/lib/auth/security-audit";
import {
  companySettingsSchema,
  emailSettingsSchema,
  profileBasicsSchema,
  type CompanySettingsInput,
  type EmailSettingsInput,
  type ProfileBasicsInput,
} from "./schema";

// Structured logging helper for invite events
function logInviteEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `INVITE_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

// Hash token for secure storage (same as in /api/accountants/invite)
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

export async function resendAccountantInvite(companyUserId: string) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the invite
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.PENDING,
    },
  });

  if (!companyUser) {
    throw new Error("Uitnodiging niet gevonden of al geaccepteerd");
  }

  if (!companyUser.invitedEmail) {
    throw new Error("E-mailadres ontbreekt voor deze uitnodiging");
  }

  const emailMasked = companyUser.invitedEmail.replace(/(.).+(@.*)/, "$1***$2");
  logInviteEvent("RESEND_ATTEMPT", { companyUserId: companyUserId.slice(-6), emailMasked });

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // Update with new token
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: { tokenHash },
  });

  // Get company profile for email
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: companyId },
    select: { companyName: true },
  });
  const companyName = companyProfile?.companyName || "Uw bedrijf";

  // Build invite URL
  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  // Send invitation email
  logInviteEvent("RESEND_EMAIL_ATTEMPT", { emailMasked });

  try {
    const emailResult = await sendEmail({
      to: companyUser.invitedEmail,
      subject: `Herinnering: Uitnodiging accountant toegang tot ${companyName}`,
      react: AccountantInviteEmail({
        inviteUrl,
        companyName,
      }),
    });

    if (emailResult.success) {
      logInviteEvent("RESEND_EMAIL_SUCCESS", { 
        emailMasked, 
        messageId: emailResult.messageId,
      });
      revalidatePath("/instellingen");
      return { ok: true, emailSent: true };
    } else {
      const errorMsg = emailResult.error?.message || "Unknown error";
      logInviteEvent("RESEND_EMAIL_FAIL", { emailMasked, error: errorMsg });
      return { ok: true, emailSent: false, emailError: errorMsg, inviteUrl };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logInviteEvent("RESEND_EMAIL_FAIL", { emailMasked, error: errorMsg });
    return { ok: true, emailSent: false, emailError: errorMsg, inviteUrl };
  }
}

export async function getAccountantInviteLink(companyUserId: string) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the invite
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.PENDING,
    },
  });

  if (!companyUser || !companyUser.tokenHash) {
    throw new Error("Uitnodiging niet gevonden of al geaccepteerd");
  }

  // Generate new token (we regenerate for security - old link is invalidated)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // Update with new token
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: { tokenHash },
  });

  // Build invite URL
  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  const emailMasked = companyUser.invitedEmail?.replace(/(.).+(@.*)/, "$1***$2") || "unknown";
  logInviteEvent("LINK_GENERATED", { companyUserId: companyUserId.slice(-6), emailMasked });

  return { ok: true, inviteUrl };
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

  // Validate and normalize email
  let accountantEmail: string;
  try {
    accountantEmail = normalizeEmail(input.accountantEmail);
  } catch {
    throw new Error("Ongeldig e-mailadres");
  }

  const emailMasked = accountantEmail.replace(/(.).+(@.*)/, "$1***$2");
  logInviteEvent("CREATE_ATTEMPT", { companyId: companyId.slice(-6), emailMasked });

  // Find the accountant user by email (optional - may not exist yet)
  const accountantUser = await prisma.user.findUnique({
    where: { email: accountantEmail },
    select: { id: true, email: true },
  });

  // Prevent self-assignment as accountant
  if (accountantUser && accountantUser.id === companyId) {
    throw new Error("U kunt uzelf niet als accountant toevoegen");
  }

  // Get company profile for email
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { userId: companyId },
    select: { companyName: true },
  });
  const companyName = companyProfile?.companyName || "Uw bedrijf";

  // Check if there's already an existing invite for this email
  const existingInvite = await prisma.companyUser.findFirst({
    where: {
      companyId,
      role: CompanyRole.ACCOUNTANT,
      OR: [
        { invitedEmail: accountantEmail },
        ...(accountantUser ? [{ userId: accountantUser.id }] : []),
      ],
    },
  });

  if (existingInvite?.status === CompanyUserStatus.ACTIVE) {
    throw new Error("Deze accountant is al gekoppeld aan uw bedrijf");
  }

  // Generate invite token (always needed for PENDING status, or for sending email even if user exists)
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  let companyUser;
  // NOTE: Even if the user exists, we create a PENDING invite and require them to accept
  // This is the SnelStart-style flow: always require explicit acceptance
  if (existingInvite) {
    // Update existing invite with new token and permissions
    companyUser = await prisma.companyUser.update({
      where: { id: existingInvite.id },
      data: {
        userId: null, // Reset until accepted
        invitedEmail: accountantEmail,
        tokenHash,
        status: CompanyUserStatus.PENDING, // Always PENDING until accepted
        canRead: input.canRead ?? true,
        canEdit: input.canEdit ?? false,
        canExport: input.canExport ?? false,
        canBTW: input.canBTW ?? false,
      },
    });
    logInviteEvent("CREATE_UPDATED_EXISTING", { 
      companyUserId: companyUser.id.slice(-6), 
      emailMasked,
      hadExistingUser: Boolean(accountantUser),
    });
  } else {
    // Create new invite
    companyUser = await prisma.companyUser.create({
      data: {
        companyId,
        userId: null, // Set when accepted
        invitedEmail: accountantEmail,
        tokenHash,
        role: CompanyRole.ACCOUNTANT,
        status: CompanyUserStatus.PENDING, // Always PENDING until accepted
        canRead: input.canRead ?? true,
        canEdit: input.canEdit ?? false,
        canExport: input.canExport ?? false,
        canBTW: input.canBTW ?? false,
      },
    });
    logInviteEvent("CREATE_NEW", { 
      companyUserId: companyUser.id.slice(-6), 
      emailMasked,
      userExists: Boolean(accountantUser),
    });
  }

  // Log invite creation for security audit
  await logInviteCreated({
    userId: companyId,
    email: accountantEmail,
    role: "ACCOUNTANT",
    companyId,
  });

  // Build invite URL
  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  // Send invitation email
  logInviteEvent("EMAIL_SEND_ATTEMPT", { emailMasked, baseUrl });

  let emailSent = false;
  let emailError: string | undefined;
  
  try {
    const emailResult = await sendEmail({
      to: accountantEmail,
      subject: `Uitnodiging: Accountant toegang tot ${companyName}`,
      react: AccountantInviteEmail({
        inviteUrl,
        companyName,
      }),
    });

    if (emailResult.success) {
      emailSent = true;
      logInviteEvent("EMAIL_SEND_SUCCESS", { 
        emailMasked, 
        messageId: emailResult.messageId,
      });
    } else {
      emailError = emailResult.error?.message || "Unknown error";
      logInviteEvent("EMAIL_SEND_FAIL", { 
        emailMasked, 
        error: emailError,
      });
    }
  } catch (error) {
    emailError = error instanceof Error ? error.message : "Unknown error";
    logInviteEvent("EMAIL_SEND_FAIL", { 
      emailMasked, 
      error: emailError,
    });
  }

  revalidatePath("/instellingen");

  return {
    ok: true,
    companyId,
    companyUserId: companyUser.id,
    accountantUserId: accountantUser?.id ?? null,
    status: "PENDING", // Always PENDING - requires acceptance
    emailSent,
    emailError,
    // Include invite URL for fallback "copy link" functionality when email fails
    inviteUrl: !emailSent ? inviteUrl : undefined,
  };
}
