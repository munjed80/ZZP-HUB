/**
 * Company Context Management
 * 
 * Manages the active company context for users (especially accountants)
 * who have access to multiple companies.
 */

import "server-only";
import { cookies } from "next/headers";
import { requireSession } from "./tenant";
import { getUserCompanies } from "./company-access";

const COMPANY_CONTEXT_COOKIE = "zzp-active-company";

/**
 * Get the active company ID for the current user
 * 
 * For regular users (owners), this is always their own userId.
 * For accountants, this can be any company they have access to.
 * 
 * @returns The active company ID to use for queries
 */
export async function getActiveCompanyId(): Promise<string> {
  const session = await requireSession();

  // For SUPERADMIN and COMPANY_ADMIN, always return their own userId
  if (
    session.role === "SUPERADMIN" ||
    session.role === "COMPANY_ADMIN"
  ) {
    return session.userId;
  }

  // For accountants/staff, check if a company context is set
  const cookieStore = await cookies();
  const activeCompanyId = cookieStore.get(COMPANY_CONTEXT_COOKIE)?.value;

  if (activeCompanyId) {
    // Verify the user has access to this company
    const companies = await getUserCompanies(session.userId);
    const hasAccess = companies.some((c) => c.companyId === activeCompanyId);

    if (hasAccess) {
      return activeCompanyId;
    }
  }

  // Default to the user's own ID (if they are also a company owner)
  // or the first company they have access to
  const companies = await getUserCompanies(session.userId);
  if (companies.length > 0) {
    return companies[0].companyId;
  }

  // Fallback to userId (shouldn't happen in practice)
  return session.userId;
}

/**
 * Set the active company context for an accountant
 * 
 * This is called when an accountant switches between companies.
 * Only affects accountants and staff - company owners always see their own data.
 */
export async function setActiveCompanyId(companyId: string): Promise<void> {
  const session = await requireSession();

  // Verify the user has access to this company
  const companies = await getUserCompanies(session.userId);
  const hasAccess = companies.some((c) => c.companyId === companyId);

  if (!hasAccess) {
    throw new Error("U heeft geen toegang tot dit bedrijf.");
  }

  // Set cookie with 30 day expiry
  const cookieStore = await cookies();
  cookieStore.set(COMPANY_CONTEXT_COOKIE, companyId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  });
}

/**
 * Clear the company context
 */
export async function clearActiveCompanyId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COMPANY_CONTEXT_COOKIE);
}

/**
 * Options for requireCompanyContext
 */
export interface CompanyContextOptions {
  /** Optional companyId from route, searchParams, or request body */
  companyId?: string | null;
}

/**
 * Result from requireCompanyContext
 */
export interface CompanyContextResult {
  /** The validated company ID to use in WHERE clauses */
  companyId: string;
  /** Alias for companyId - for backward compatibility with userId-based queries */
  userId: string;
  /** The authenticated user's ID */
  authenticatedUserId: string;
  /** The user's role */
  role: string;
}

/**
 * Multi-tenant isolation helper - CRITICAL for data security
 * 
 * This helper ensures strict tenant isolation by validating that the user
 * has access to the requested company before returning the companyId.
 * 
 * Rules:
 * - ZZP/COMPANY_ADMIN: Can access ONLY their own companies
 * - SUPERADMIN: Can view all but must explicitly select companyId (no implicit fallback)
 * - ACCOUNTANT_*: Can access companies they are members of
 * 
 * @param options - Optional parameters including companyId from route/searchParams/body
 * @returns Validated companyId that belongs to the current user
 * @throws 403 Error if user doesn't have access to the company
 */
export async function requireCompanyContext(
  options?: CompanyContextOptions
): Promise<CompanyContextResult> {
  const session = await requireSession();
  const requestedCompanyId = options?.companyId?.trim();

  // Log the access attempt for audit
  logCompanyContextAccess(session.userId, session.role, requestedCompanyId);

  // SUPERADMIN handling - must explicitly select companyId, no implicit fallback
  if (session.role === "SUPERADMIN") {
    if (!requestedCompanyId) {
      // For SUPERADMIN with no explicit company, use their own userId
      // This enables them to work in their own context
      return {
        companyId: session.userId,
        userId: session.userId,
        authenticatedUserId: session.userId,
        role: session.role,
      };
    }
    // SUPERADMIN can access any company when explicitly specified
    return {
      companyId: requestedCompanyId,
      userId: requestedCompanyId,
      authenticatedUserId: session.userId,
      role: session.role,
    };
  }

  // ZZP/COMPANY_ADMIN handling - can ONLY access their own company
  if (session.role === "ZZP" || session.role === "COMPANY_ADMIN") {
    // If a specific companyId is requested, verify it's their own
    if (requestedCompanyId && requestedCompanyId !== session.userId) {
      logCompanyContextViolation(session.userId, requestedCompanyId, "UNAUTHORIZED_COMPANY_ACCESS");
      throw createForbiddenError("U heeft geen toegang tot dit bedrijf.");
    }
    return {
      companyId: session.userId,
      userId: session.userId,
      authenticatedUserId: session.userId,
      role: session.role,
    };
  }

  // ACCOUNTANT_* and STAFF handling - can access companies they are members of
  if (requestedCompanyId) {
    // Verify the user has access to the requested company
    const companies = await getUserCompanies(session.userId);
    const hasAccess = companies.some((c) => c.companyId === requestedCompanyId);

    if (!hasAccess) {
      logCompanyContextViolation(session.userId, requestedCompanyId, "MEMBER_ACCESS_DENIED");
      throw createForbiddenError("U heeft geen toegang tot dit bedrijf.");
    }

    return {
      companyId: requestedCompanyId,
      userId: requestedCompanyId,
      authenticatedUserId: session.userId,
      role: session.role,
    };
  }

  // No explicit companyId - use active company context from cookie or default
  const activeCompanyId = await getActiveCompanyId();
  return {
    companyId: activeCompanyId,
    userId: activeCompanyId,
    authenticatedUserId: session.userId,
    role: session.role,
  };
}

/**
 * Create a 403 Forbidden error with consistent messaging
 */
function createForbiddenError(message: string): Error {
  const error = new Error(message);
  (error as Error & { status: number }).status = 403;
  return error;
}

/**
 * Log company context access attempts for audit trail
 */
function logCompanyContextAccess(
  userId: string,
  role: string,
  requestedCompanyId?: string
): void {
  if (process.env.NODE_ENV === "production" || process.env.TENANT_DEBUG === "true") {
    console.log("[COMPANY_CONTEXT_ACCESS]", {
      timestamp: new Date().toISOString(),
      userId: userId.slice(-6),
      role,
      requestedCompanyId: requestedCompanyId?.slice(-6) ?? "none",
    });
  }
}

/**
 * Log company context violations for security monitoring
 */
function logCompanyContextViolation(
  userId: string,
  attemptedCompanyId: string,
  reason: string
): void {
  console.error("[COMPANY_CONTEXT_VIOLATION]", {
    timestamp: new Date().toISOString(),
    userId: userId.slice(-6),
    attemptedCompanyId: attemptedCompanyId.slice(-6),
    reason,
    severity: "HIGH",
  });
}
