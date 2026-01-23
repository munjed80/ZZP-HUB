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

/**
 * Mask an email address for safe logging (e.g., "j***n@example.com")
 * Preserves first and last character of local part + full domain
 */
function maskEmail(email: string): string {
  return email.replace(/(.).+(@.*)/, "$1***$2");
}

// Structured logging helper for invite events
function logInviteEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `INVITE_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * Hash a token using SHA-256 for secure storage.
 * This creates a one-way hash that can be stored in the database.
 * The original token is sent to the user via email and compared
 * by hashing and matching against the stored hash.
 */
function hashToken(token: string): string {
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

  const emailMasked = maskEmail(companyUser.invitedEmail);
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

  // SECURITY: We regenerate the token each time to prevent token reuse attacks.
  // This invalidates any previously shared links. If the accountant has multiple
  // tabs open or bookmarked an old link, they will need to use the new one.
  // This is intentional - the company owner controls when new links are generated.
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // Update with new token (updatedAt is automatically set by Prisma @updatedAt)
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: { tokenHash },
  });

  // Build invite URL
  const baseUrl = getAppBaseUrl();
  const inviteUrl = `${baseUrl}/accept-invite?token=${token}`;

  const emailMasked = companyUser.invitedEmail ? maskEmail(companyUser.invitedEmail) : "unknown";
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

  const emailMasked = maskEmail(accountantEmail);
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

  // IDEMPOTENT: If already linked/active, return success with alreadyLinked flag instead of throwing
  if (existingInvite?.status === CompanyUserStatus.ACTIVE) {
    logInviteEvent("CREATE_ALREADY_LINKED", {
      companyId: companyId.slice(-6),
      emailMasked,
      existingId: existingInvite.id.slice(-6),
    });
    return {
      ok: true,
      alreadyLinked: true,
      companyId,
      companyUserId: existingInvite.id,
      accountantUserId: existingInvite.userId ?? null,
      status: "ACTIVE",
      emailSent: false,
    };
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

/**
 * Revoke a pending invite - prevents the invite from being accepted.
 * Sets status to REVOKED and clears the tokenHash so the token can't be used.
 * Only works on PENDING invites. Authorization: only company owner.
 */
export async function revokeAccountantInvite(companyUserId: string) {
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
    throw new Error("Uitnodiging niet gevonden of al verwerkt");
  }

  const emailMasked = companyUser.invitedEmail ? maskEmail(companyUser.invitedEmail) : "unknown";
  logInviteEvent("REVOKE_ATTEMPT", { companyUserId: companyUserId.slice(-6), emailMasked });

  // Update status to REVOKED and clear tokenHash
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: {
      status: CompanyUserStatus.REVOKED,
      tokenHash: null, // Invalidate the token
    },
  });

  logInviteEvent("REVOKE_SUCCESS", { companyUserId: companyUserId.slice(-6), emailMasked });

  revalidatePath("/instellingen");
  return { ok: true };
}

/**
 * Remove access for an active accountant - unlinks them from the company.
 * Sets status to REVOKED and clears userId to break the link.
 * Only works on ACTIVE accountants. Authorization: only company owner.
 */
export async function removeAccountantAccess(companyUserId: string) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the active accountant link
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.ACTIVE,
    },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!companyUser) {
    throw new Error("Accountant koppeling niet gevonden of niet actief");
  }

  const emailMasked = companyUser.user?.email ? maskEmail(companyUser.user.email) : "unknown";
  logInviteEvent("REMOVE_ACCESS_ATTEMPT", { companyUserId: companyUserId.slice(-6), emailMasked });

  // Update to REVOKED and clear userId to unlink
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: {
      status: CompanyUserStatus.REVOKED,
      userId: null, // Unlink the accountant
    },
  });

  logInviteEvent("REMOVE_ACCESS_SUCCESS", { companyUserId: companyUserId.slice(-6), emailMasked });

  revalidatePath("/instellingen");
  return { ok: true };
}

/**
 * Update permissions for an active accountant.
 * Only works on ACTIVE accountants. Authorization: only company owner.
 */
export async function updateAccountantPermissions(
  companyUserId: string,
  permissions: {
    canRead: boolean;
    canEdit: boolean;
    canExport: boolean;
    canBTW: boolean;
  }
) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the active accountant link
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: CompanyUserStatus.ACTIVE,
    },
  });

  if (!companyUser) {
    throw new Error("Accountant koppeling niet gevonden of niet actief");
  }

  logInviteEvent("UPDATE_PERMISSIONS_ATTEMPT", { companyUserId: companyUserId.slice(-6) });

  // Update permissions
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: {
      canRead: permissions.canRead,
      canEdit: permissions.canEdit,
      canExport: permissions.canExport,
      canBTW: permissions.canBTW,
    },
  });

  logInviteEvent("UPDATE_PERMISSIONS_SUCCESS", { companyUserId: companyUserId.slice(-6) });

  revalidatePath("/instellingen");
  return { ok: true };
}

/**
 * Re-invite an accountant by creating a new PENDING invite.
 * Works on REVOKED or EXPIRED invites. Creates a fresh token and sends email.
 * Authorization: only company owner.
 */
export async function reInviteAccountant(companyUserId: string) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the invite (REVOKED or EXPIRED)
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: {
        in: [CompanyUserStatus.REVOKED, CompanyUserStatus.EXPIRED],
      },
    },
  });

  if (!companyUser) {
    throw new Error("Uitnodiging niet gevonden");
  }

  if (!companyUser.invitedEmail) {
    throw new Error("E-mailadres ontbreekt voor deze uitnodiging");
  }

  const emailMasked = maskEmail(companyUser.invitedEmail);
  logInviteEvent("REINVITE_ATTEMPT", { companyUserId: companyUserId.slice(-6), emailMasked });

  // Generate new token
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  // Update to PENDING with new token
  await prisma.companyUser.update({
    where: { id: companyUserId },
    data: {
      tokenHash,
      status: CompanyUserStatus.PENDING,
      userId: null, // Clear userId if it was set
    },
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
  logInviteEvent("REINVITE_EMAIL_ATTEMPT", { emailMasked });

  try {
    const emailResult = await sendEmail({
      to: companyUser.invitedEmail,
      subject: `Uitnodiging: Accountant toegang tot ${companyName}`,
      react: AccountantInviteEmail({
        inviteUrl,
        companyName,
      }),
    });

    if (emailResult.success) {
      logInviteEvent("REINVITE_EMAIL_SUCCESS", {
        emailMasked,
        messageId: emailResult.messageId,
      });
      revalidatePath("/instellingen");
      return { ok: true, emailSent: true };
    } else {
      const errorMsg = emailResult.error?.message || "Unknown error";
      logInviteEvent("REINVITE_EMAIL_FAIL", { emailMasked, error: errorMsg });
      return { ok: true, emailSent: false, emailError: errorMsg, inviteUrl };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    logInviteEvent("REINVITE_EMAIL_FAIL", { emailMasked, error: errorMsg });
    return { ok: true, emailSent: false, emailError: errorMsg, inviteUrl };
  }
}

/**
 * Delete/remove an invite record (REVOKED or EXPIRED only).
 * Soft-delete by removing from the database (audit trail maintained in logs).
 * Authorization: only company owner.
 */
export async function deleteAccountantInvite(companyUserId: string) {
  "use server";

  const { userId: companyId } = await requireTenantContext();

  // Find the invite (REVOKED or EXPIRED only)
  const companyUser = await prisma.companyUser.findFirst({
    where: {
      id: companyUserId,
      companyId,
      role: CompanyRole.ACCOUNTANT,
      status: {
        in: [CompanyUserStatus.REVOKED, CompanyUserStatus.EXPIRED],
      },
    },
  });

  if (!companyUser) {
    throw new Error("Uitnodiging niet gevonden of kan niet verwijderd worden");
  }

  const emailMasked = companyUser.invitedEmail ? maskEmail(companyUser.invitedEmail) : "unknown";
  logInviteEvent("DELETE_ATTEMPT", { companyUserId: companyUserId.slice(-6), emailMasked });

  // Delete the record
  await prisma.companyUser.delete({
    where: { id: companyUserId },
  });

  logInviteEvent("DELETE_SUCCESS", { companyUserId: companyUserId.slice(-6), emailMasked });

  revalidatePath("/instellingen");
  return { ok: true };
}
