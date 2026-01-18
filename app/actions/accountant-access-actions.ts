"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/tenant";
import { getCompanyMembers } from "@/lib/auth/company-access";
import { UserRole } from "@prisma/client";
import crypto from "crypto";

/**
 * Invite an accountant to access the company
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

    // Check for pending invite
    const pendingInvite = await prisma.accountantInvite.findFirst({
      where: {
        companyId: session.userId,
        email,
        acceptedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (pendingInvite) {
      return {
        success: false,
        message: "Er is al een uitnodiging verstuurd naar dit e-mailadres.",
      };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invite
    await prisma.accountantInvite.create({
      data: {
        companyId: session.userId,
        email,
        role,
        token,
        expiresAt,
      },
    });

    // TODO: Send email with invitation link
    // For now, we'll return the token for manual sharing
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/accept-invite?token=${token}`;

    revalidatePath("/accountant-access");

    return {
      success: true,
      message: "Uitnodiging succesvol aangemaakt.",
      inviteUrl,
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
        acceptedAt: null,
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
