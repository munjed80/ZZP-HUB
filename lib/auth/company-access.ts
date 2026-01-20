/**
 * Company Access Control
 * 
 * This module provides multi-tenant company access control for accountants.
 * It extends the tenant isolation to support company members (accountants)
 * accessing multiple companies.
 */

import "server-only";
import { prisma } from "../prisma";
import { requireSession, type SessionContext } from "./tenant";
import { AccountantAccessStatus, UserRole } from "@prisma/client";

export type Permission = "read" | "write" | "export" | "vat_actions";

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPERADMIN: ["read", "write", "export", "vat_actions"],
  COMPANY_ADMIN: ["read", "write", "export", "vat_actions"],
  STAFF: ["read", "write"],
  ACCOUNTANT_VIEW: ["read", "export"],
  ACCOUNTANT_EDIT: ["read", "write", "export", "vat_actions"],
  ZZP: ["read", "write", "export", "vat_actions"],
  ACCOUNTANT: ["read", "write", "export"],
};

/**
 * Check if user has access to a company with the required permission
 * @throws Error if access is denied
 */
export async function requireCompanyAccess(
  userId: string,
  companyId: string,
  permission: Permission
): Promise<void> {
  const session = await requireSession();

  // SUPERADMIN has access to everything
  if (session.role === UserRole.SUPERADMIN) {
    logCompanyAccess(userId, companyId, permission, "SUPERADMIN_BYPASS");
    return;
  }

  if (session.role === UserRole.ACCOUNTANT) {
    const access = await prisma.accountantAccess.findUnique({
      where: {
        accountantUserId_companyId: {
          accountantUserId: userId,
          companyId,
        },
      },
    });

    if (!access || access.status !== AccountantAccessStatus.ACTIVE) {
      logCompanyAccessDenied(userId, companyId, permission, "NOT_MEMBER");
      throw new Error("Toegang geweigerd. U heeft geen toegang tot dit bedrijf.");
    }

    const permissionMap: Record<Permission, boolean> = {
      read: access.canRead,
      write: access.canEdit,
      export: access.canExport,
      vat_actions: access.canBTW,
    };

    if (!permissionMap[permission]) {
      logCompanyAccessDenied(userId, companyId, permission, "INSUFFICIENT_PERMISSION");
      throw new Error(`Toegang geweigerd. Onvoldoende rechten voor actie: ${permission}`);
    }

    logCompanyAccess(userId, companyId, permission, "ACCOUNTANT_ACCESS");
    return;
  }

  // Owner has full access to their own company
  if (userId === companyId) {
    const userPermissions = ROLE_PERMISSIONS[session.role] || [];
    if (!userPermissions.includes(permission)) {
      throw new Error(`Toegang geweigerd. Onvoldoende rechten voor actie: ${permission}`);
    }
    logCompanyAccess(userId, companyId, permission, "OWNER_ACCESS");
    return;
  }

  // Check if user is a company member (accountant)
  const member = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: {
        companyId,
        userId,
      },
    },
  });

  if (!member) {
    logCompanyAccessDenied(userId, companyId, permission, "NOT_MEMBER");
    throw new Error("Toegang geweigerd. U heeft geen toegang tot dit bedrijf.");
  }

  // Check if member has the required permission
  const memberPermissions = ROLE_PERMISSIONS[member.role] || [];
  if (!memberPermissions.includes(permission)) {
    logCompanyAccessDenied(userId, companyId, permission, "INSUFFICIENT_PERMISSION");
    throw new Error(`Toegang geweigerd. Onvoldoende rechten voor actie: ${permission}`);
  }

  logCompanyAccess(userId, companyId, permission, "MEMBER_ACCESS");
}

/**
 * Get all companies the user has access to
 */
export async function getUserCompanies(userId: string): Promise<
  Array<{
    companyId: string;
    role: UserRole;
    isOwner: boolean;
  }>
> {
  const session = await requireSession();

  // SUPERADMIN can see all companies (but we return empty for portal context)
  if (session.role === UserRole.SUPERADMIN) {
    return [];
  }

  if (session.role === UserRole.ACCOUNTANT) {
    const accesses = await prisma.accountantAccess.findMany({
      where: {
        accountantUserId: userId,
        status: AccountantAccessStatus.ACTIVE,
      },
      select: {
        companyId: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return accesses.map((access) => ({
      companyId: access.companyId,
      role: UserRole.ACCOUNTANT,
      isOwner: false,
    }));
  }

  // Get owned company (self)
  const ownedCompany = {
    companyId: userId,
    role: session.role,
    isOwner: true,
  };

  // Get member companies (accountant access)
  const memberCompanies = await prisma.companyMember.findMany({
    where: { userId },
    select: {
      companyId: true,
      role: true,
    },
  });

  return [
    ownedCompany,
    ...memberCompanies.map((m) => ({
      companyId: m.companyId,
      role: m.role,
      isOwner: false,
    })),
  ];
}

/**
 * Get company members (accountants) for a company
 */
export async function getCompanyMembers(companyId: string): Promise<
  Array<{
    id: string;
    userId: string;
    email: string;
    naam: string | null;
    role: UserRole;
    createdAt: Date;
    permissions?: string | null;
  }>
> {
  const session = await requireSession();

  // Only company owner or SUPERADMIN can view members
  if (session.userId !== companyId && session.role !== UserRole.SUPERADMIN) {
    throw new Error("Toegang geweigerd. Alleen de bedrijfseigenaar kan deze lijst bekijken.");
  }

  const members = await prisma.accountantAccess.findMany({
    where: { companyId, status: AccountantAccessStatus.ACTIVE },
    include: {
      accountant: {
        select: {
          id: true,
          email: true,
          naam: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.accountantUserId,
    email: m.accountant.email,
    naam: m.accountant.naam,
    role: UserRole.ACCOUNTANT,
    createdAt: m.createdAt,
    permissions: m.permissions,
  }));
}

/**
 * Check if user has a specific permission for a role
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Log company access for audit trail
 */
function logCompanyAccess(
  userId: string,
  companyId: string,
  permission: Permission,
  reason: string
): void {
  if (process.env.NODE_ENV === "production" || process.env.TENANT_DEBUG === "true") {
    console.log("[COMPANY_ACCESS]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6),
      companyId: companyId.slice(-6),
      permission,
      reason,
    });
  }
}

/**
 * Log company access denied for security monitoring
 */
function logCompanyAccessDenied(
  userId: string,
  companyId: string,
  permission: Permission,
  reason: string
): void {
  console.error("[COMPANY_ACCESS_DENIED]", {
    timestamp: new Date().toISOString(),
    userId: userId.slice(-6),
    companyId: companyId.slice(-6),
    permission,
    reason,
    severity: "HIGH",
  });
}
