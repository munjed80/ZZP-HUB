"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/tenant";
import { getCompanyMembers } from "@/lib/auth/company-access";
import { UserRole, InviteStatus, AccountantAccessStatus } from "@prisma/client";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import AccountantOTPEmail from "@/components/emails/AccountantOTPEmail";
import { logInviteCreated } from "@/lib/auth/security-audit";
import { clearAccountantSessionOnZZPLogin } from "@/lib/auth/accountant-session";

/**
 * Clear any accountant session cookie when a ZZP/COMPANY_ADMIN user logs in
 * This prevents session confusion between accountant and ZZP users.
 * Should be called after successful NextAuth login for non-accountant users.
 */
export async function clearAccountantCookieOnLogin() {
  try {
    await clearAccountantSessionOnZZPLogin();
    return { success: true };
  } catch (error) {
    console.error("Error clearing accountant cookie on login:", error);
    // Don't fail - this is a cleanup operation
    return { success: false };
  }
}

/**
 * Generate a cryptographically secure 6-digit OTP code
 */
function generateOTPCode(): string {
  // Generate 3 random bytes (24 bits) which gives us 0-16777215
  const randomBytes = crypto.randomBytes(3);
  // Convert to number and mod by 1000000 to get 6 digits
  const num = (randomBytes.readUIntBE(0, 3) % 900000) + 100000;
  return num.toString();
}

type PermissionInput = {
  canRead?: boolean;
  canEdit?: boolean;
  canExport?: boolean;
  canBTW?: boolean;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function constantTimeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function derivePermissions(permissions?: PermissionInput) {
  const canRead = permissions?.canRead ?? true;
  const canEdit = Boolean(permissions?.canEdit);
  const canExport = Boolean(permissions?.canExport);
  const canBTW = Boolean(permissions?.canBTW);
  return {
    canRead,
    canEdit,
    canExport,
    canBTW,
    permissionsJson: JSON.stringify({
      canRead,
      canEdit,
      canExport,
      canBTW,
    }),
  };
}

async function ensureAccountantAccess(
  accountantUserId: string,
  companyId: string,
  permissions?: PermissionInput
) {
  const { canRead, canEdit, canExport, canBTW, permissionsJson } = derivePermissions(permissions);
  await prisma.accountantAccess.upsert({
    where: {
      accountantUserId_companyId: {
        accountantUserId,
        companyId,
      },
    },
    update: {
      canRead,
      canEdit,
      canExport,
      canBTW,
      permissions: permissionsJson,
      status: AccountantAccessStatus.ACTIVE,
    },
    create: {
      accountantUserId,
      companyId,
      canRead,
      canEdit,
      canExport,
      canBTW,
      permissions: permissionsJson,
      status: AccountantAccessStatus.ACTIVE,
    },
  });
  console.log("[ACCOUNTANT_ACCESS_GRANTED]", {
    accountantUserId: accountantUserId.slice(-6),
    companyId: companyId.slice(-6),
    permissions: { canRead, canEdit, canExport, canBTW },
  });
}

/**
 * Invite an accountant to access the company
 * Generates a secure token and 6-digit OTP code
 */
export async function inviteAccountant(email: string, permissions: PermissionInput) {
  try {
    const session = await requireSession();

    // Only company owner/admin can invite
    if (
      session.role !== UserRole.COMPANY_ADMIN &&
      session.role !== UserRole.SUPERADMIN
    ) {
      return {
        success: false,
        message: "Alleen bedrijfseigenaren kunnen accountants uitnodigen.",
      };
    }

    // Safe debug logging (no PII)
    console.log("[ACCOUNTANT_INVITE_REQUEST]", {
      hasEmail: Boolean(email),
      emailLength: email?.length || 0,
      companyId: session.userId.slice(-6),
    });

    // Validate email - strict checks before Prisma call
    if (!email || typeof email !== 'string') {
      console.error("[ACCOUNTANT_INVITE_FAILED]", {
        reason: "EMAIL_MISSING",
        hasEmail: Boolean(email),
        emailType: typeof email,
      });
      return { success: false, message: "E-mailadres is verplicht." };
    }

    // Trim and normalize email
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      console.error("[ACCOUNTANT_INVITE_FAILED]", {
        reason: "EMAIL_EMPTY_AFTER_TRIM",
        originalLength: email.length,
      });
      return { success: false, message: "E-mailadres mag niet leeg zijn." };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      console.error("[ACCOUNTANT_INVITE_FAILED]", {
        reason: "EMAIL_INVALID_FORMAT",
        emailLength: normalizedEmail.length,
      });
      return { success: false, message: "Ongeldig e-mailadres formaat." };
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      const existingAccess = await prisma.accountantAccess.findUnique({
        where: {
          accountantUserId_companyId: {
            companyId: session.userId,
            accountantUserId: existingUser.id,
          },
        },
      });

      if (existingAccess?.status === AccountantAccessStatus.ACTIVE) {
        return {
          success: false,
          message: "Deze accountant heeft al toegang tot uw bedrijf.",
        };
      }
    }

    // Check for pending invite - if exists, invalidate it
    const pendingInvite = await prisma.accountantInvite.findFirst({
      where: {
        companyId: session.userId,
        invitedEmail: normalizedEmail,
        status: InviteStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (pendingInvite) {
      // Invalidate the previous invite by marking it as expired
      await prisma.accountantInvite.update({
        where: { id: pendingInvite.id },
        data: { status: InviteStatus.EXPIRED },
      });
    }

    // Get company profile for email
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    const companyName = companyProfile?.companyName || user?.naam || user?.email || "Bedrijf";
    const normalizedPermissions = derivePermissions(permissions);

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    
    // Generate 6-digit OTP
    const otpCode = generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    
    // Token expires in 7 days, OTP expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // Create invite with OTP - email is guaranteed non-null here
    const invite = await prisma.accountantInvite.create({
      data: {
        companyId: session.userId,
        invitedEmail: normalizedEmail,
        role: UserRole.ACCOUNTANT,
        tokenHash,
        otpHash,
        otpExpiresAt,
        status: InviteStatus.PENDING,
        expiresAt,
        inviteType: "ACCOUNTANT_ACCESS",
        permissions: normalizedPermissions.permissionsJson,
      },
    });
    console.log("[ACCOUNTANT_INVITE_CREATED]", {
      companyId: session.userId.slice(-6),
      inviteId: invite.id.slice(-6),
      emailLength: normalizedEmail.length,
    });

    // Log invite creation for audit
    await logInviteCreated({
      userId: session.userId,
      email: normalizedEmail,
      role: UserRole.ACCOUNTANT,
      companyId: session.userId,
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessUrl = `${baseUrl}/accountant-invite?token=${token}`;

    // Send invitation email with OTP
    try {
      const emailResult = await sendEmail({
        to: normalizedEmail,
        subject: `ZZP Hub – Access code for ${companyName}`,
        react: AccountantOTPEmail({
          accessUrl,
          companyName,
          otpCode,
          validityMinutes: 10,
        }),
      });
      if (emailResult.success) {
        console.log("[ACCOUNTANT_INVITE_EMAIL_SENT]", {
          emailLength: normalizedEmail.length,
          inviteId: invite.id.slice(-6),
          messageId: emailResult.messageId,
        });
      }
    } catch (emailError) {
      console.error("[ACCOUNTANT_INVITE_FAILED]", {
        reason: "EMAIL_SEND_FAILED",
        inviteId: invite.id.slice(-6),
        error: emailError instanceof Error ? emailError.message : "unknown",
      });
      // Continue even if email fails - the invite is still created and URL can be shared manually
    }

    revalidatePath("/accountant-access");

    return {
      success: true,
      message: "Uitnodiging succesvol verstuurd.",
      inviteUrl: accessUrl,
    };
  } catch (error) {
    // Extract error code safely for logging
    const errorCode = 
      error && typeof error === 'object' && 'code' in error 
        ? String((error as { code?: string }).code)
        : 'UNKNOWN';
    
    console.error("[ACCOUNTANT_INVITE_FAILED]", {
      reason: "UNEXPECTED_ERROR",
      errorCode,
      errorMessage: error instanceof Error ? error.message : "unknown",
      hasEmail: Boolean(email),
      emailLength: email?.length || 0,
    });
    return {
      success: false,
      message: "Er is een fout opgetreden bij het versturen van de uitnodiging.",
    };
  }
}

/**
 * Resend OTP code for an existing pending invite
 * Generates a new OTP and updates the expiry
 */
export async function resendOTPCode(inviteId: string) {
  try {
    const session = await requireSession();

    // Find the invite
    const invite = await prisma.accountantInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return { success: false, message: "Uitnodiging niet gevonden." };
    }

    // Only company owner can resend
    if (invite.companyId !== session.userId && session.role !== UserRole.SUPERADMIN) {
      return {
        success: false,
        message: "U kunt alleen codes voor uw eigen uitnodigingen opnieuw versturen.",
      };
    }

    // Check if invite is still pending
    if (invite.status !== InviteStatus.PENDING) {
      return {
        success: false,
        message: "Deze uitnodiging is niet meer actief.",
      };
    }

    // Check if invite token is expired
    if (invite.expiresAt < new Date()) {
      return {
        success: false,
        message: "De uitnodiging is verlopen. Stuur een nieuwe uitnodiging.",
      };
    }

    // Get company profile for email
    const companyProfile = await prisma.companyProfile.findUnique({
      where: { userId: session.userId },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    const companyName = companyProfile?.companyName || user?.naam || user?.email || "Bedrijf";

    // Generate new token + 6-digit OTP
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const otpCode = generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    
    // New OTP expires in 10 minutes
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // Update invite with new OTP
    await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: {
        tokenHash,
        otpHash,
        otpExpiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessUrl = `${baseUrl}/accountant-invite?token=${token}`;

    // Send email with new OTP
    try {
      const emailResult = await sendEmail({
        to: invite.invitedEmail,
        subject: `ZZP Hub – New access code for ${companyName}`,
        react: AccountantOTPEmail({
          accessUrl,
          companyName,
          otpCode,
          validityMinutes: 10,
        }),
      });
      if (emailResult.success) {
        console.log("ACCOUNTANT_INVITE_EMAIL_SENT", {
          to: invite.invitedEmail,
          inviteId: invite.id,
          messageId: emailResult.messageId,
        });
      }
    } catch (emailError) {
      console.error("ACCOUNTANT_INVITE_FAILED", {
        reason: "EMAIL_SEND_FAILED",
        inviteId: invite.id,
        error: emailError instanceof Error ? emailError.message : "unknown",
      });
      return {
        success: false,
        message: "Er is een fout opgetreden bij het versturen van de e-mail.",
      };
    }

    revalidatePath("/accountant-access");

    return {
      success: true,
      message: "Nieuwe code succesvol verstuurd.",
    };
  } catch (error) {
    console.error("Error resending OTP:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het opnieuw versturen van de code.",
    };
  }
}

/**
 * Accept an accountant invitation
 */
export async function acceptInvite(token: string) {
  console.warn("Deprecated acceptInvite action used. Redirect to OTP flow.");
  return {
    success: false,
    message: "Gebruik de nieuwe accountant uitnodiging met verificatiecode.",
  };
}

/**
 * Revoke accountant access
 */
export async function revokeAccountantAccess(memberId: string) {
  try {
    const session = await requireSession();

    // Find the access record
    const access = await prisma.accountantAccess.findUnique({
      where: { id: memberId },
    });

    if (!access) {
      return { success: false, message: "Lid niet gevonden." };
    }

    // Only company owner or SUPERADMIN can revoke
    if (
      access.companyId !== session.userId &&
      session.role !== UserRole.SUPERADMIN
    ) {
      return {
        success: false,
        message: "U kunt alleen toegang intrekken voor uw eigen bedrijf.",
      };
    }

    await prisma.accountantAccess.update({
      where: { id: memberId },
      data: { status: AccountantAccessStatus.REVOKED },
    });
    console.log("[ACCOUNTANT_ACCESS_REVOKED]", {
      accountantUserId: access.accountantUserId.slice(-6),
      companyId: access.companyId.slice(-6),
      status: "REVOKED",
    });

    revalidatePath("/accountant-access");

    return { success: true, message: "Toegang succesvol ingetrokken." };
  } catch (error) {
    console.error("Error revoking access:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het intrekken van de toegang.",
    };
  }
}

/**
 * List company members (accountants) for the current user's company
 */
export async function listCompanyMembers() {
  try {
    const session = await requireSession();
    const members = await getCompanyMembers(session.userId);
    return { success: true, members };
  } catch (error) {
    console.error("Error listing company members:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het ophalen van de lijst.",
      members: [],
    };
  }
}

/**
 * Get all companies the current user has access to (for accountant portal)
 */
export async function getAccountantCompanies() {
  try {
    const session = await requireSession();

    // Check if user has an accountant role (ACCOUNTANT, ACCOUNTANT_VIEW, or ACCOUNTANT_EDIT)
    const isAccountant = session.role === UserRole.ACCOUNTANT || 
                         session.role === UserRole.ACCOUNTANT_VIEW || 
                         session.role === UserRole.ACCOUNTANT_EDIT;

    if (!isAccountant && session.role !== UserRole.SUPERADMIN) {
      console.log('[ACCOUNTANT_PORTAL_LOAD]', {
        timestamp: new Date().toISOString(),
        hasSession: true,
        accountantUserId: session.userId.slice(-6),
        role: session.role,
        accessCount: 0,
        companyCount: 0,
        reason: 'WRONG_ROLE',
      });
      
      return {
        success: false,
        message: "Alleen accountant-accounts kunnen dit overzicht zien.",
        companies: [],
      };
    }

    // Get companies where user has active accountant access
    const accesses = await prisma.accountantAccess.findMany({
      where: {
        accountantUserId: session.userId,
        status: AccountantAccessStatus.ACTIVE,
      },
      include: {
        company: {
          select: {
            id: true,
            email: true,
            naam: true,
            companyProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Log diagnostics
    console.log('[ACCOUNTANT_PORTAL_LOAD]', {
      timestamp: new Date().toISOString(),
      hasSession: true,
      accountantUserId: session.userId.slice(-6),
      role: session.role,
      accessCount: accesses.length,
      companyCount: accesses.length,
      reason: accesses.length === 0 ? 'NO_ACCESS_FOUND' : undefined,
    });

    // Get stats for each company
    const companies = await Promise.all(
      accesses.map(async (access) => {
        const companyId = access.companyId;

        // Count unpaid invoices
        const unpaidInvoices = await prisma.invoice.count({
          where: {
            userId: companyId,
            emailStatus: {
              in: ["VERZONDEN", "HERINNERING"],
            },
          },
        });

        // Count invoices due soon (within 7 days)
        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        const invoicesDueSoon = await prisma.invoice.count({
          where: {
            userId: companyId,
            emailStatus: {
              in: ["VERZONDEN", "HERINNERING"],
            },
            dueDate: {
              gte: now,
              lte: sevenDaysFromNow,
            },
          },
        });

        // Calculate next VAT period (simplified - quarterly)
        const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
        const nextQuarterMonth = currentQuarter * 3;
        const nextVatDeadline = new Date(now.getFullYear(), nextQuarterMonth, 0);
        const daysUntilVat = Math.ceil(
          (nextVatDeadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        const vatDueSoon = daysUntilVat <= 14;

        return {
          id: access.id,
          companyId: access.companyId,
          role: session.role,
          companyName:
            access.company.companyProfile?.companyName ||
            access.company.naam ||
            access.company.email,
          stats: {
            unpaidInvoices,
            invoicesDueSoon,
            vatDueSoon,
          },
        };
      })
    );

    return { success: true, companies };
  } catch (error) {
    console.error('[ACCOUNTANT_PORTAL_LOAD_ERROR]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return {
      success: false,
      message: "Er is een fout opgetreden bij het ophalen van de bedrijven.",
      companies: [],
    };
  }
}

/**
 * Get pending invites for the current user's company
 */
export async function getPendingInvites() {
  try {
    const session = await requireSession();

    const invites = await prisma.accountantInvite.findMany({
      where: {
        companyId: session.userId,
        status: InviteStatus.PENDING,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return { success: true, invites };
  } catch (error) {
    console.error("Error getting pending invites:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het ophalen van de uitnodigingen.",
      invites: [],
    };
  }
}

/**
 * Cancel a pending invite
 */
export async function cancelInvite(inviteId: string) {
  try {
    const session = await requireSession();

    const invite = await prisma.accountantInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite) {
      return { success: false, message: "Uitnodiging niet gevonden." };
    }

    // Only company owner can cancel
    if (invite.companyId !== session.userId && session.role !== UserRole.SUPERADMIN) {
      return {
        success: false,
        message: "U kunt alleen uw eigen uitnodigingen annuleren.",
      };
    }

    await prisma.accountantInvite.update({
      where: { id: inviteId },
      data: { status: InviteStatus.REVOKED },
    });

    revalidatePath("/accountant-access");

    return { success: true, message: "Uitnodiging geannuleerd." };
  } catch (error) {
    console.error("Error canceling invite:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het annuleren van de uitnodiging.",
    };
  }
}
