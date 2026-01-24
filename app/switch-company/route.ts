import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeNextUrl } from "@/lib/auth/safe-next";
import { buildSecureRedirectUrl, isNonProductionUrl } from "@/lib/base-url";
import { CompanyUserStatus } from "@prisma/client";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Cookie name for active company
const COOKIE_NAME = "zzp-hub-active-company";

function isValidUUID(value: string | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Log switch-company events for debugging.
 * Always logs in production for critical redirect flows.
 */
function logSwitchEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `SWITCH_COMPANY_${event}`,
    ...details,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Switch Company Route Handler
 *
 * GET /switch-company?companyId=<uuid>&next=<path>
 *
 * Sets the active company cookie and redirects to the target URL.
 * Used after accepting accountant invites or switching between companies.
 * 
 * IMPORTANT: This handler uses buildSecureRedirectUrl() to ensure redirects
 * always go to the trusted production domain, not to request origin
 * (which can be spoofed on mobile/iOS as 0.0.0.0:3000).
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId") ?? undefined;
  const nextParam = searchParams.get("next") ?? undefined;
  const requestOrigin = request.nextUrl.origin;

  // Validate and sanitize the next URL (prevent open redirects)
  const nextPath = safeNextUrl(nextParam, "/dashboard");

  // Detect if request origin looks like a dev/mobile URL (e.g., 0.0.0.0:3000)
  const isUntrustedOrigin = isNonProductionUrl(requestOrigin);

  logSwitchEvent("REQUEST", {
    requestOrigin,
    isUntrustedOrigin,
    companyId: companyId?.slice(-6),
    nextParam,
    nextPath,
  });

  // Build secure redirect URL using trusted base URL from env
  const buildRedirectUrl = (path: string): string => {
    return buildSecureRedirectUrl(path);
  };

  // Validate companyId is a valid UUID
  if (!isValidUUID(companyId)) {
    logSwitchEvent("INVALID_COMPANY_ID", { companyId: companyId ? String(companyId).slice(-6) : undefined });
    const redirectUrl = buildRedirectUrl("/dashboard");
    logSwitchEvent("REDIRECT", { to: redirectUrl, reason: "invalid_company_id" });
    return NextResponse.redirect(redirectUrl);
  }

  // Get the authenticated session
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    // Not logged in - redirect to login with return URL
    const returnUrl = encodeURIComponent(
      `/switch-company?companyId=${companyId}&next=${encodeURIComponent(nextPath)}`
    );
    const loginRedirect = buildRedirectUrl(`/login?next=${returnUrl}`);
    logSwitchEvent("NO_SESSION", { redirectTo: loginRedirect });
    return NextResponse.redirect(loginRedirect);
  }

  // Verify user has access to this company
  const membership = await prisma.companyUser.findFirst({
    where: {
      userId: session.user.id,
      companyId: companyId,
      status: CompanyUserStatus.ACTIVE,
    },
    select: {
      id: true,
      companyId: true,
      role: true,
    },
  });

  if (!membership) {
    // User doesn't have access to this company
    logSwitchEvent("NO_ACCESS", {
      userId: session.user.id.slice(-6),
      companyId: companyId.slice(-6),
    });
    const redirectUrl = buildRedirectUrl("/dashboard");
    logSwitchEvent("REDIRECT", { to: redirectUrl, reason: "no_access" });
    return NextResponse.redirect(redirectUrl);
  }

  // Build final redirect URL using trusted base URL
  const finalRedirectUrl = buildRedirectUrl(nextPath);

  // Set the active company cookie via NextResponse redirect
  const response = NextResponse.redirect(finalRedirectUrl);
  response.cookies.set(COOKIE_NAME, companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Cookie expires in 1 year
    maxAge: 60 * 60 * 24 * 365,
  });

  logSwitchEvent("SUCCESS", {
    requestOrigin,
    finalRedirectUrl,
    userId: session.user.id.slice(-6),
    companyId: companyId.slice(-6),
    role: membership.role,
    redirectTo: nextPath,
    cookieSet: true,
  });

  return response;
}
