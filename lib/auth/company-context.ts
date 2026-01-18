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
 * Get tenant context with company awareness
 * 
 * This replaces requireTenantContext for queries that need company scoping.
 * It returns the active company ID instead of always using userId.
 */
export async function requireCompanyContext(): Promise<{ userId: string }> {
  const companyId = await getActiveCompanyId();
  return { userId: companyId };
}
