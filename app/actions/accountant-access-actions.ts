"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/tenant";
import { getCompanyMembers } from "@/lib/auth/company-access";
import { UserRole, InviteStatus } from "@prisma/client";
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

/**
 * Invite an accountant to access the company
 * Generates a secure token and 6-digit OTP code
 */
export async function inviteAccountant(email: string, role: UserRole) {
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

    // Validate role
    if (
      role !== UserRole.ACCOUNTANT_VIEW &&
      role !== UserRole.ACCOUNTANT_EDIT &&
      role !== UserRole.STAFF
    ) {
      return {
        success: false,
        message: "Ongeldige rol. Kies ACCOUNTANT_VIEW, ACCOUNTANT_EDIT, of STAFF.",
      };
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, message: "Ongeldig e-mailadres." };
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      const existingMember = await prisma.companyMember.findUnique({
        where: {
          companyId_userId: {
            companyId: session.userId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember) {
        return {
          success: false,
          message: "Deze gebruiker heeft al toegang tot uw bedrijf.",
        };
      }
    }

    // Check for pending invite - if exists, invalidate it
    const pendingInvite = await prisma.accountantInvite.findFirst({
      where: {
        companyId: session.userId,
        email,
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

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    
    // Generate 6-digit OTP
    const otpCode = generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    
    // Token expires in 7 days, OTP expires in 10 minutes
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // Create invite with OTP
    await prisma.accountantInvite.create({
      data: {
        companyId: session.userId,
        email,
        role,
        token,
        tokenHash,
        otpHash,
        otpExpiresAt,
        status: InviteStatus.PENDING,
        expiresAt,
      },
    });

    // Log invite creation for audit
    await logInviteCreated({
      userId: session.userId,
      email,
      role,
      companyId: session.userId,
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessUrl = `${baseUrl}/accountant-verify?token=${token}`;

    // Send invitation email with OTP
    try {
      await sendEmail({
        to: email,
        subject: `Uw toegangscode voor ${companyName}`,
        react: AccountantOTPEmail({
          accessUrl,
          companyName,
          otpCode,
          validityMinutes: 10,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
      // Continue even if email fails - the invite is still created and URL can be shared manually
    }

    revalidatePath("/accountant-access");

    return {
      success: true,
      message: "Uitnodiging succesvol verstuurd.",
      inviteUrl: accessUrl,
    };
  } catch (error) {
    console.error("Error inviting accountant:", error);
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

    // Generate new 6-digit OTP
    const otpCode = generateOTPCode();
    const otpHash = await bcrypt.hash(otpCode, 10);
    
    // New OTP expires in 10 minutes
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10);

    // Update invite with new OTP
    await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: {
        otpHash,
        otpExpiresAt,
      },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const accessUrl = `${baseUrl}/accountant-verify?token=${invite.token}`;

    // Send email with new OTP
    try {
      await sendEmail({
        to: invite.email,
        subject: `Nieuwe toegangscode voor ${companyName}`,
        react: AccountantOTPEmail({
          accessUrl,
          companyName,
          otpCode,
          validityMinutes: 10,
        }),
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
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
  try {
    const session = await requireSession();

    // Find the invite
    const invite = await prisma.accountantInvite.findUnique({
      where: { token },
      include: {
        company: {
          select: {
            companyProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    if (!invite) {
      return { success: false, message: "Ongeldige of verlopen uitnodiging." };
    }

    // Check if already accepted
    if (invite.acceptedAt) {
      return { success: false, message: "Deze uitnodiging is al geaccepteerd." };
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return { success: false, message: "Deze uitnodiging is verlopen." };
    }

    // Check if email matches
    if (invite.email !== session.email) {
      return {
        success: false,
        message: "Deze uitnodiging is voor een ander e-mailadres.",
      };
    }

    // Check if already a member
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: invite.companyId,
          userId: session.userId,
        },
      },
    });

    if (existingMember) {
      // Mark invite as accepted even though they're already a member
      await prisma.accountantInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return {
        success: false,
        message: "U heeft al toegang tot dit bedrijf.",
      };
    }

    // Create company member
    await prisma.companyMember.create({
      data: {
        companyId: invite.companyId,
        userId: session.userId,
        role: invite.role,
      },
    });

    // Mark invite as accepted
    await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    const companyName = invite.company.companyProfile?.companyName || "Bedrijf";

    revalidatePath("/accountant-portal");

    return {
      success: true,
      message: `U heeft nu toegang tot ${companyName}.`,
      companyId: invite.companyId,
    };
  } catch (error) {
    console.error("Error accepting invite:", error);
    return {
      success: false,
      message: "Er is een fout opgetreden bij het accepteren van de uitnodiging.",
    };
  }
}

/**
 * Revoke accountant access
 */
export async function revokeAccountantAccess(memberId: string) {
  try {
    const session = await requireSession();

    // Find the member
    const member = await prisma.companyMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      return { success: false, message: "Lid niet gevonden." };
    }

    // Only company owner or SUPERADMIN can revoke
    if (
      member.companyId !== session.userId &&
      session.role !== UserRole.SUPERADMIN
    ) {
      return {
        success: false,
        message: "U kunt alleen toegang intrekken voor uw eigen bedrijf.",
      };
    }

    // Delete the member
    await prisma.companyMember.delete({
      where: { id: memberId },
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

    // Get companies where user is a member
    const memberships = await prisma.companyMember.findMany({
      where: { userId: session.userId },
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

    // Get stats for each company
    const companies = await Promise.all(
      memberships.map(async (membership) => {
        const companyId = membership.companyId;

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
          id: membership.id,
          companyId: membership.companyId,
          role: membership.role,
          companyName:
            membership.company.companyProfile?.companyName ||
            membership.company.naam ||
            membership.company.email,
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
    console.error("Error getting accountant companies:", error);
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

    await prisma.accountantInvite.delete({
      where: { id: inviteId },
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
