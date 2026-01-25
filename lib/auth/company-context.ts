/**
 * Company Context Utilities
 * 
 * Provides active company context for users with multiple company memberships.
 * Implements SnelStart-style "Accountant Mode" where accountants can switch
 * between companies they have access to.
 */

import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CompanyRole, CompanyUserStatus } from "@prisma/client";
import { requireSession, type SessionContext } from "./tenant";

/** Cookie name for active company */
export const ACTIVE_COMPANY_COOKIE = "zzp-hub-active-company";

/** UUID v4 validation regex */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Company membership with permissions
 */
export interface CompanyMembership {
  id: string;
  companyId: string;
  companyName: string | null;
  role: CompanyRole;
  status: CompanyUserStatus;
  permissions: {
    canRead: boolean;
    canEdit: boolean;
    canExport: boolean;
    canBTW: boolean;
  };
}

/**
 * Active company context including user session and membership details
 */
export interface ActiveCompanyContext {
  session: SessionContext;
  activeCompanyId: string;
  activeMembership: CompanyMembership | null;
  /** All active memberships for this user */
  memberships: CompanyMembership[];
  /** Whether user is viewing their own company (as owner) or another company (as accountant/staff) */
  isOwnerContext: boolean;
}

/**
 * Get the active company ID from cookie
 * @returns The active company ID or null if not set
 */
export async function getActiveCompanyIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const activeCompanyId = cookieStore.get(ACTIVE_COMPANY_COOKIE)?.value;
  
  if (!activeCompanyId || !UUID_REGEX.test(activeCompanyId)) {
    return null;
  }
  
  return activeCompanyId;
}

/**
 * Get all active memberships for a user
 */
export async function getUserMemberships(userId: string): Promise<CompanyMembership[]> {
  const memberships = await prisma.companyUser.findMany({
    where: {
      userId,
      status: CompanyUserStatus.ACTIVE,
    },
    select: {
      id: true,
      companyId: true,
      role: true,
      status: true,
      canRead: true,
      canEdit: true,
      canExport: true,
      canBTW: true,
      company: {
        select: {
          companyProfile: {
            select: { companyName: true },
          },
        },
      },
    },
  });

  return memberships.map((m) => ({
    id: m.id,
    companyId: m.companyId,
    companyName: m.company?.companyProfile?.companyName || null,
    role: m.role,
    status: m.status,
    permissions: {
      canRead: m.canRead,
      canEdit: m.canEdit,
      canExport: m.canExport,
      canBTW: m.canBTW,
    },
  }));
}

/**
 * Get the active company context for the current user.
 * 
 * This function determines which company the user is currently working in:
 * - For COMPANY_ADMIN/SUPERADMIN: their own userId is used as companyId
 * - For users with ACCOUNTANT memberships: uses activeCompanyId from cookie
 * 
 * @throws Error if user is not authenticated
 */
export async function getActiveCompanyContext(): Promise<ActiveCompanyContext> {
  const session = await requireSession();
  const userId = session.userId;
  
  // Get all memberships for this user
  const memberships = await getUserMemberships(userId);
  
  // Check if user has any non-OWNER memberships (ACCOUNTANT or STAFF can access other companies)
  const hasMultiCompanyMembership = memberships.some(m => 
    m.role === CompanyRole.ACCOUNTANT || m.role === CompanyRole.STAFF
  );
  
  // Get active company from cookie
  const cookieCompanyId = await getActiveCompanyIdFromCookie();
  
  // Determine the active company ID
  let activeCompanyId: string;
  let activeMembership: CompanyMembership | null = null;
  let isOwnerContext = false;

  if (session.role === "SUPERADMIN" || session.role === "COMPANY_ADMIN") {
    // For owners, default to their own company unless they have a multi-company cookie set
    if (cookieCompanyId && hasMultiCompanyMembership) {
      // Check if they have access to the cookie company
      activeMembership = memberships.find(m => m.companyId === cookieCompanyId) || null;
      if (activeMembership) {
        activeCompanyId = cookieCompanyId;
        isOwnerContext = activeMembership.role === CompanyRole.OWNER;
      } else {
        // Fallback to own company
        activeCompanyId = userId;
        isOwnerContext = true;
      }
    } else {
      // Default to own company
      activeCompanyId = userId;
      isOwnerContext = true;
    }
  } else if (hasMultiCompanyMembership) {
    // For users with multi-company access (ACCOUNTANT/STAFF), use the cookie company or first available membership
    if (cookieCompanyId) {
      activeMembership = memberships.find(m => m.companyId === cookieCompanyId) || null;
      if (activeMembership) {
        activeCompanyId = cookieCompanyId;
        isOwnerContext = activeMembership.role === CompanyRole.OWNER;
      } else if (memberships.length > 0) {
        // Cookie company not accessible, use first available
        activeMembership = memberships[0];
        activeCompanyId = activeMembership.companyId;
        isOwnerContext = activeMembership.role === CompanyRole.OWNER;
      } else {
        // No memberships - use own userId (will have limited access)
        activeCompanyId = userId;
        isOwnerContext = true;
      }
    } else if (memberships.length > 0) {
      // No cookie, use first available membership
      activeMembership = memberships[0];
      activeCompanyId = activeMembership.companyId;
      isOwnerContext = activeMembership.role === CompanyRole.OWNER;
    } else {
      // No memberships - use own userId
      activeCompanyId = userId;
      isOwnerContext = true;
    }
  } else {
    // Regular user without multi-company memberships - use own company
    activeCompanyId = userId;
    isOwnerContext = true;
  }

  return {
    session,
    activeCompanyId,
    activeMembership,
    memberships,
    isOwnerContext,
  };
}

/**
 * Require active company context with valid membership
 * Use this when accessing company data that requires explicit membership
 * 
 * @throws Error if user doesn't have access to any company
 */
export async function requireActiveCompanyContext(): Promise<ActiveCompanyContext> {
  const context = await getActiveCompanyContext();
  
  // For owner context, always allow
  if (context.isOwnerContext) {
    return context;
  }
  
  // For accountant context, require active membership
  if (!context.activeMembership) {
    throw new Error("Geen toegang tot dit bedrijf. Vraag de eigenaar om u toegang te geven.");
  }
  
  return context;
}

/**
 * Check if user has a specific permission for the active company
 */
export async function hasPermission(
  permission: "canRead" | "canEdit" | "canExport" | "canBTW"
): Promise<boolean> {
  const context = await getActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return true;
  }
  
  // Check membership permissions
  if (!context.activeMembership) {
    return false;
  }
  
  return context.activeMembership.permissions[permission];
}

/**
 * Require a specific permission for the active company
 * 
 * @throws Error if user doesn't have the required permission
 */
export async function requirePermission(
  permission: "canRead" | "canEdit" | "canExport" | "canBTW"
): Promise<ActiveCompanyContext> {
  const context = await requireActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return context;
  }
  
  if (!context.activeMembership?.permissions[permission]) {
    const permissionNames = {
      canRead: "lezen",
      canEdit: "bewerken",
      canExport: "exporteren",
      canBTW: "BTW beheren",
    };
    throw new Error(`Geen toestemming om te ${permissionNames[permission]}.`);
  }
  
  return context;
}

/**
 * Check if user is in accountant mode (viewing another company)
 */
export async function isAccountantMode(): Promise<boolean> {
  const context = await getActiveCompanyContext();
  return !context.isOwnerContext && context.activeMembership?.role === CompanyRole.ACCOUNTANT;
}

/**
 * Guard for company-admin-only actions
 * Throws error if user is not the company owner
 * 
 * @throws Error if user is not the owner
 */
export async function requireCompanyOwner(): Promise<ActiveCompanyContext> {
  const context = await requireActiveCompanyContext();
  
  if (!context.isOwnerContext) {
    throw new Error("Alleen de eigenaar kan deze actie uitvoeren.");
  }
  
  return context;
}
