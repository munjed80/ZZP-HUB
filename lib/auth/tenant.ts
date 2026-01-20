/**
 * Centralized tenant isolation utilities
 * 
 * This module provides strict tenant isolation for multi-tenant SaaS.
 * All data access MUST use these helpers to prevent data leakage.
 */

import "server-only";
import { getServerAuthSession } from "../auth";
import { AccountantAccessStatus, UserRole } from "@prisma/client";
import { getAccountantSession } from "./accountant-session";
import { prisma } from "../prisma";

export interface SessionContext {
  userId: string;
  role: UserRole;
  email: string;
  isAccountantSession?: boolean;
  companyId?: string;
}

/**
 * Get the current session or throw if not authenticated
 * Supports both NextAuth sessions and accountant sessions
 * @throws Error if user is not authenticated or is suspended
 */
export async function requireSession(): Promise<SessionContext> {
  // First try NextAuth session
  const session = await getServerAuthSession();
  
  if (session?.user) {
    if (session.user.isSuspended) {
      throw new Error("Dit account is geblokkeerd. Neem contact op met support.");
    }
    
    return {
      userId: session.user.id,
      role: session.user.role,
      email: session.user.email,
      isAccountantSession: false,
    };
  }
  
  // Try accountant session
  const accountantSession = await getAccountantSession();
  
  if (accountantSession) {
    return {
      userId: accountantSession.userId,
      role: accountantSession.role,
      email: accountantSession.email,
      isAccountantSession: true,
      companyId: accountantSession.companyId,
    };
  }
  
  throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
}

/**
 * Get tenant context for the current user
 * For this app, userId IS the tenant key, but with company context support
 * for accountants who can access multiple companies.
 * @throws Error if user is not authenticated
 */
export async function requireTenantContext(): Promise<{ userId: string }> {
  const session = await requireSession();
  
  // For accountant sessions, use the companyId directly
  if (session.isAccountantSession && session.companyId) {
    return { userId: session.companyId };
  }
  
  // Import dynamically to avoid circular dependency
  const { getActiveCompanyId } = await import("./company-context");
  
  // For SUPERADMIN and COMPANY_ADMIN, always use their own userId
  if (session.role === "SUPERADMIN" || session.role === "COMPANY_ADMIN") {
    return { userId: session.userId };
  }
  
  // For accountants and staff with NextAuth session, use the active company context
  const companyId = await getActiveCompanyId();
  return { userId: companyId };
}

/**
 * Require that the current user has a specific role
 * @throws Error if user doesn't have the required role
 */
export async function requireRole(role: UserRole): Promise<SessionContext> {
  const session = await requireSession();

  if (session.role !== role) {
    throw new Error(`Toegang geweigerd. Deze actie vereist de rol: ${role}`);
  }

  return session;
}

/**
 * Require a NextAuth-backed accountant session
 */
export async function requireAccountantSession() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== UserRole.ACCOUNTANT) {
    throw new Error("Je hebt een boekhouder-account nodig om deze actie uit te voeren.");
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role,
  };
}

/**
 * List company IDs the accountant can access
 */
export async function getAccountantAccessibleCompanyIds(accountantUserId: string) {
  const accesses = await prisma.accountantAccess.findMany({
    where: {
      accountantUserId,
      status: AccountantAccessStatus.ACTIVE,
    },
    select: {
      companyId: true,
    },
  });
  return accesses.map((a) => a.companyId);
}

/**
 * Check if the current user is a SUPERADMIN
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const session = await requireSession();
    return session.role === UserRole.SUPERADMIN;
  } catch {
    return false;
  }
}

/**
 * Get the WHERE clause for tenant scoping
 * 
 * Rules:
 * - SUPERADMIN bypasses tenant scoping ONLY on /admin/** pages
 * - All other users must be scoped by userId (tenant key)
 * 
 * @param allowAdminBypass - Set to true ONLY for /admin/** routes
 * @returns { userId: string } for normal users, {} for SUPERADMIN on admin pages
 */
export async function getTenantWhereClause(
  allowAdminBypass = false
): Promise<{ userId?: string }> {
  const session = await requireSession();
  
  // SUPERADMIN can bypass ONLY on admin pages
  if (session.role === UserRole.SUPERADMIN && allowAdminBypass) {
    logTenantAccess(session.userId, "SUPERADMIN_BYPASS", "Admin page access");
    return {};
  }
  
  // All other cases: scope by userId
  return { userId: session.userId };
}

/**
 * Get tenant scope with explicit session context
 * Use this when you already have the session
 */
export function getTenantScopeFromSession(
  session: SessionContext,
  allowAdminBypass = false
): { userId?: string } {
  if (session.role === UserRole.SUPERADMIN && allowAdminBypass) {
    logTenantAccess(session.userId, "SUPERADMIN_BYPASS", "Admin page access");
    return {};
  }
  
  return { userId: session.userId };
}

/**
 * Verify tenant ownership for update/delete operations
 * This ensures users can only modify their own data
 * 
 * @throws Error if tenant verification fails
 */
export async function verifyTenantOwnership(
  resourceUserId: string | null | undefined,
  operation: string
): Promise<void> {
  const session = await requireSession();
  
  // SUPERADMIN can modify any resource
  if (session.role === UserRole.SUPERADMIN) {
    logTenantAccess(session.userId, "SUPERADMIN_MODIFY", operation);
    return;
  }
  
  // Verify ownership
  if (!resourceUserId || resourceUserId !== session.userId) {
    logTenantViolation(session.userId, operation, resourceUserId);
    throw new Error("Toegang geweigerd. U kunt deze resource niet wijzigen.");
  }
}

/**
 * Log tenant access for audit trail
 */
function logTenantAccess(userId: string, action: string, details: string): void {
  if (process.env.NODE_ENV === "production" || process.env.TENANT_DEBUG === "true") {
    console.log("[TENANT_ACCESS]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6), // Last 6 chars for privacy
      action,
      details,
    });
  }
}

/**
 * Log tenant isolation violations
 */
function logTenantViolation(
  userId: string,
  operation: string,
  attemptedResourceUserId: string | null | undefined
): void {
  console.error("[TENANT_GUARD_BLOCKED]", {
    timestamp: new Date().toISOString(),
    userId: userId.slice(-6),
    operation,
    attemptedResourceUserId: attemptedResourceUserId?.slice(-6) ?? "null",
    severity: "HIGH",
  });
}

/**
 * Roles that are considered "accountant" roles
 * These users should be redirected to /accountant-portal instead of /dashboard
 */
export const ACCOUNTANT_ROLES: UserRole[] = [
  UserRole.ACCOUNTANT,
  UserRole.ACCOUNTANT_VIEW,
  UserRole.ACCOUNTANT_EDIT,
];

/**
 * Check if a role is an accountant role
 * Use this utility for consistent role checking throughout the app
 */
export function isAccountantRole(role: string | UserRole | undefined): boolean {
  if (!role) return false;
  return ACCOUNTANT_ROLES.includes(role as UserRole);
}

/**
 * Helper to validate that a query result belongs to the current tenant
 * Use this after fetching data to double-check ownership
 */
export async function assertTenantOwnership<T extends { userId: string }>(
  resource: T | null,
  operation: string
): Promise<T> {
  if (!resource) {
    throw new Error("Resource niet gevonden.");
  }
  
  await verifyTenantOwnership(resource.userId, operation);
  return resource;
}
