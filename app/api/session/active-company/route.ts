import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CompanyUserStatus } from "@prisma/client";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/auth/company-context";

/** UUID v4 validation regex */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUUID(value: string | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Structured logging helper for active company events
 */
function logActiveCompanyEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `ACTIVE_COMPANY_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * POST /api/session/active-company
 * 
 * Sets the active company cookie for the current user.
 * This endpoint is used by the company switcher and accept-invite flow.
 * 
 * Request body: { companyId: string }
 * Response: { success: true } with Set-Cookie header
 */
export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  
  if (!session?.user?.id) {
    logActiveCompanyEvent("NO_SESSION", {});
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  const body = await request.json().catch(() => null) as { companyId?: unknown } | null;
  const companyId = typeof body?.companyId === "string" ? body.companyId : undefined;

  if (!isValidUUID(companyId)) {
    logActiveCompanyEvent("INVALID_COMPANY_ID", { 
      companyId: companyId ? String(companyId).slice(-6) : undefined,
      userId: session.user.id.slice(-6),
    });
    return NextResponse.json({ error: "Ongeldig bedrijf ID" }, { status: 400 });
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

  // Also allow if the user is the company owner (companyId === userId)
  const isOwnCompany = companyId === session.user.id;

  if (!membership && !isOwnCompany) {
    logActiveCompanyEvent("NO_ACCESS", {
      userId: session.user.id.slice(-6),
      companyId: companyId.slice(-6),
    });
    return NextResponse.json({ error: "Geen toegang tot dit bedrijf" }, { status: 403 });
  }

  // Create response with cookie
  const response = NextResponse.json({ success: true });
  
  response.cookies.set(ACTIVE_COMPANY_COOKIE, companyId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Cookie expires in 1 year
    maxAge: 60 * 60 * 24 * 365,
  });

  logActiveCompanyEvent("SET_SUCCESS", {
    userId: session.user.id.slice(-6),
    companyId: companyId.slice(-6),
    role: membership?.role || "OWNER",
    isOwnCompany,
  });

  return response;
}

/**
 * GET /api/session/active-company
 * 
 * Gets the current active company context for the authenticated user.
 * 
 * Response: { companyId: string | null, memberships: Array<{id, name, role}> }
 */
export async function GET() {
  const session = await getServerAuthSession();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  // Get memberships
  const memberships = await prisma.companyUser.findMany({
    where: {
      userId: session.user.id,
      status: CompanyUserStatus.ACTIVE,
    },
    select: {
      companyId: true,
      role: true,
      company: {
        select: {
          companyProfile: {
            select: { companyName: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    userId: session.user.id,
    memberships: memberships.map((m) => ({
      id: m.companyId,
      name: m.company?.companyProfile?.companyName || "Bedrijf",
      role: m.role,
    })),
  });
}
