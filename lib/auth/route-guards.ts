/**
 * Route Guard Utilities
 * 
 * Server-side guards for protecting routes based on membership and permissions.
 * Use these guards in page.tsx files and API routes.
 */

import "server-only";
import { redirect } from "next/navigation";
import { getActiveCompanyContext, requirePermission, type ActiveCompanyContext } from "./company-context";
import { CompanyRole } from "@prisma/client";

/**
 * Log guard events for debugging and auditing
 */
function logGuardEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `ROUTE_GUARD_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * Guard for owner-only pages.
 * Redirects to /dashboard if the user is in accountant mode.
 * 
 * Use in page.tsx files:
 * ```
 * export default async function SettingsPage() {
 *   await requireOwnerPage();
 *   // ... render page
 * }
 * ```
 */
export async function requireOwnerPage(): Promise<ActiveCompanyContext> {
  const context = await getActiveCompanyContext();
  
  if (!context.isOwnerContext) {
    logGuardEvent("BLOCKED_OWNER_ONLY", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
      membershipRole: context.activeMembership?.role,
    });
    redirect("/dashboard");
  }
  
  return context;
}

/**
 * Guard for pages that require read permission.
 * Redirects to /dashboard if user doesn't have canRead permission.
 */
export async function requireReadPage(): Promise<ActiveCompanyContext> {
  try {
    return await requirePermission("canRead");
  } catch {
    redirect("/dashboard");
  }
}

/**
 * Guard for pages that require edit permission.
 * Redirects to /dashboard if user doesn't have canEdit permission.
 */
export async function requireEditPage(): Promise<ActiveCompanyContext> {
  try {
    return await requirePermission("canEdit");
  } catch {
    redirect("/dashboard");
  }
}

/**
 * Guard for pages that require BTW permission.
 * Redirects to /dashboard if user doesn't have canBTW permission.
 */
export async function requireBTWPage(): Promise<ActiveCompanyContext> {
  try {
    return await requirePermission("canBTW");
  } catch {
    redirect("/dashboard");
  }
}

/**
 * Guard for pages that require export permission.
 * Redirects to /dashboard if user doesn't have canExport permission.
 */
export async function requireExportPage(): Promise<ActiveCompanyContext> {
  try {
    return await requirePermission("canExport");
  } catch {
    redirect("/dashboard");
  }
}

/**
 * Guard for API routes that should only be accessible by owners.
 * Returns 403 if user is in accountant mode.
 * 
 * Use in API routes:
 * ```
 * export async function POST(request: Request) {
 *   const guardResult = await guardOwnerOnly();
 *   if (guardResult.error) return guardResult.error;
 *   // ... handle request
 * }
 * ```
 */
export async function guardOwnerOnly(): Promise<{ context: ActiveCompanyContext; error?: never } | { context?: never; error: Response }> {
  const context = await getActiveCompanyContext();
  
  if (!context.isOwnerContext) {
    logGuardEvent("API_BLOCKED_OWNER_ONLY", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
      membershipRole: context.activeMembership?.role,
    });
    
    return {
      error: new Response(
        JSON.stringify({ error: "Alleen de eigenaar kan deze actie uitvoeren" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { context };
}

/**
 * Guard for API routes that require read permission.
 */
export async function guardReadPermission(): Promise<{ context: ActiveCompanyContext; error?: never } | { context?: never; error: Response }> {
  const context = await getActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return { context };
  }
  
  if (!context.activeMembership?.permissions.canRead) {
    logGuardEvent("API_BLOCKED_NO_READ", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
    });
    
    return {
      error: new Response(
        JSON.stringify({ error: "Geen toestemming om data te lezen" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { context };
}

/**
 * Guard for API routes that require edit permission.
 */
export async function guardEditPermission(): Promise<{ context: ActiveCompanyContext; error?: never } | { context?: never; error: Response }> {
  const context = await getActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return { context };
  }
  
  if (!context.activeMembership?.permissions.canEdit) {
    logGuardEvent("API_BLOCKED_NO_EDIT", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
    });
    
    return {
      error: new Response(
        JSON.stringify({ error: "Geen toestemming om data te bewerken" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { context };
}

/**
 * Guard for API routes that require BTW permission.
 */
export async function guardBTWPermission(): Promise<{ context: ActiveCompanyContext; error?: never } | { context?: never; error: Response }> {
  const context = await getActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return { context };
  }
  
  if (!context.activeMembership?.permissions.canBTW) {
    logGuardEvent("API_BLOCKED_NO_BTW", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
    });
    
    return {
      error: new Response(
        JSON.stringify({ error: "Geen toestemming voor BTW-acties" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { context };
}

/**
 * Guard for API routes that require export permission.
 */
export async function guardExportPermission(): Promise<{ context: ActiveCompanyContext; error?: never } | { context?: never; error: Response }> {
  const context = await getActiveCompanyContext();
  
  // Owners have all permissions
  if (context.isOwnerContext) {
    return { context };
  }
  
  if (!context.activeMembership?.permissions.canExport) {
    logGuardEvent("API_BLOCKED_NO_EXPORT", {
      userId: context.session.userId.slice(-6),
      activeCompanyId: context.activeCompanyId.slice(-6),
    });
    
    return {
      error: new Response(
        JSON.stringify({ error: "Geen toestemming om data te exporteren" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      ),
    };
  }
  
  return { context };
}

/**
 * Check if user is viewing another company (as ACCOUNTANT or STAFF, not as OWNER)
 * Returns true when user is accessing a company they don't own
 */
export async function isNonOwnerViewing(): Promise<boolean> {
  const context = await getActiveCompanyContext();
  return !context.isOwnerContext;
}

/**
 * Check if user is in accountant mode specifically (not OWNER or STAFF)
 */
export async function isAccountantViewing(): Promise<boolean> {
  const context = await getActiveCompanyContext();
  return !context.isOwnerContext && context.activeMembership?.role === CompanyRole.ACCOUNTANT;
}
