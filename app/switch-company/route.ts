import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeNextUrl } from "@/lib/auth/safe-next";
import { CompanyUserStatus } from "@prisma/client";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Cookie name for active company
const COOKIE_NAME = "zzp-hub-active-company";

function isValidUUID(value: string | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Log switch-company events for debugging (non-production only)
 */
function logSwitchEvent(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true") {
    console.log(`[SWITCH_COMPANY_ROUTE] ${event}`, {
      ...details,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Switch Company Route Handler
 *
 * GET /switch-company?companyId=<uuid>&next=<path>
 *
 * Sets the active company cookie and redirects to the target URL.
 * Used after accepting accountant invites or switching between companies.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const companyId = searchParams.get("companyId") ?? undefined;
  const nextParam = searchParams.get("next") ?? undefined;

  // Validate and sanitize the next URL (prevent open redirects)
  const nextUrl = safeNextUrl(nextParam, "/dashboard");

  logSwitchEvent("REQUEST", {
    companyId: companyId?.slice(-6),
    nextParam,
    nextUrl,
  });

  // Validate companyId is a valid UUID
  if (!isValidUUID(companyId)) {
    logSwitchEvent("INVALID_COMPANY_ID", { companyId: companyId ? String(companyId).slice(-6) : undefined });
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Get the authenticated session
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    // Not logged in - redirect to login with return URL
    const returnUrl = encodeURIComponent(
      `/switch-company?companyId=${companyId}&next=${encodeURIComponent(nextUrl)}`
    );
    logSwitchEvent("NO_SESSION", { redirectTo: "login" });
    return NextResponse.redirect(new URL(`/login?next=${returnUrl}`, request.url));
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
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Set the active company cookie via NextResponse redirect
  const response = NextResponse.redirect(new URL(nextUrl, request.url));
  response.cookies.set(COOKIE_NAME, companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Cookie expires in 1 year
    maxAge: 60 * 60 * 24 * 365,
  });

  logSwitchEvent("SUCCESS", {
    userId: session.user.id.slice(-6),
    companyId: companyId.slice(-6),
    role: membership.role,
    redirectTo: nextUrl,
  });

  return response;
}
