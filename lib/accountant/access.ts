import crypto from "crypto";
import { AccountantAccessStatus, InviteStatus, UserRole } from "@prisma/client";
import { prisma } from "../prisma";

export type AccessPermissions = {
  canRead: boolean;
  canEdit: boolean;
  canExport: boolean;
  canBTW: boolean;
};

export const FULL_ACCESS: AccessPermissions = {
  canRead: true,
  canEdit: true,
  canExport: true,
  canBTW: true,
};

export function resolvePermissions(fullAccess: boolean, partial?: AccessPermissions): AccessPermissions {
  if (fullAccess) return FULL_ACCESS;
  return {
    canRead: partial?.canRead ?? true,
    canEdit: partial?.canEdit ?? false,
    canExport: partial?.canExport ?? false,
    canBTW: partial?.canBTW ?? false,
  };
}

export function generateInviteToken() {
  return crypto.randomUUID();
}

export function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function validateInvitedEmail(email: unknown): string {
  if (typeof email !== "string") {
    throw new Error("E-mailadres is verplicht.");
  }
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error("E-mailadres is verplicht.");
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    throw new Error("Voer een geldig e-mailadres in.");
  }
  return normalized;
}

export async function createInvite(params: {
  companyId: string;
  invitedEmail: string;
  permissions: AccessPermissions;
}): Promise<{ token: string }> {
  const email = validateInvitedEmail(params.invitedEmail);
  const token = generateInviteToken();
  const tokenHash = hashInviteToken(token);

  await prisma.accountantInvite.create({
    data: {
      companyId: params.companyId,
      invitedEmail: email,
      role: UserRole.ACCOUNTANT,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      permissions: JSON.stringify(params.permissions),
    },
  });

  return { token };
}

export async function acceptInvite(token: string, userId: string): Promise<{ companyId: string }> {
  const tokenHash = hashInviteToken(token);
  const invite = await prisma.accountantInvite.findFirst({
    where: {
      tokenHash,
      status: InviteStatus.PENDING,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    throw new Error("Uitnodiging ongeldig of verlopen.");
  }

  await prisma.$transaction([
    prisma.accountantInvite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.ACCEPTED, acceptedAt: new Date(), acceptedByUserId: userId },
    }),
    prisma.accountantAccess.upsert({
      where: {
        accountantUserId_companyId: {
          accountantUserId: userId,
          companyId: invite.companyId,
        },
      },
      update: {
        status: AccountantAccessStatus.ACTIVE,
        canRead: true,
        canEdit: !!JSON.parse(invite.permissions || "{}")?.canEdit,
        canExport: !!JSON.parse(invite.permissions || "{}")?.canExport,
        canBTW: !!JSON.parse(invite.permissions || "{}")?.canBTW,
        permissions: invite.permissions,
      },
      create: {
        accountantUserId: userId,
        companyId: invite.companyId,
        status: AccountantAccessStatus.ACTIVE,
        canRead: true,
        canEdit: !!JSON.parse(invite.permissions || "{}")?.canEdit,
        canExport: !!JSON.parse(invite.permissions || "{}")?.canExport,
        canBTW: !!JSON.parse(invite.permissions || "{}")?.canBTW,
        permissions: invite.permissions,
      },
    }),
  ]);

  return { companyId: invite.companyId };
}

export async function listCompaniesForAccountant(accountantUserId: string) {
  const accesses = await prisma.accountantAccess.findMany({
    where: { accountantUserId, status: AccountantAccessStatus.ACTIVE },
    include: {
      company: {
        select: { id: true, naam: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return accesses.map((a) => ({
    companyId: a.companyId,
    companyName: a.company?.naam || a.companyId,
  }));
}

export async function getAccessForAccountant(accountantUserId: string, companyId: string) {
  return prisma.accountantAccess.findUnique({
    where: { accountantUserId_companyId: { accountantUserId, companyId } },
  });
}
