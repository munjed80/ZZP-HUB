import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeNextUrl } from "@/lib/auth/safe-next";

// UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SearchParams = { companyId?: string; next?: string };

function isValidUUID(value: string | undefined): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Switch Company Page
 * 
 * Sets the active company for the user and redirects to the dashboard.
 * Used after accepting accountant invites or switching between companies.
 * 
 * Query parameters:
 * - companyId: UUID of the company to switch to
 * - next: URL to redirect to after switching (default: /dashboard)
 */
export default async function SwitchCompanyPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedParams = await searchParams;
  const companyId = resolvedParams?.companyId;
  const nextParam = resolvedParams?.next;

  // Validate and sanitize the next URL
  const nextUrl = safeNextUrl(nextParam, "/dashboard");

  // Log for debugging in development
  if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true") {
    console.log("[SWITCH_COMPANY]", {
      companyId: companyId?.slice(-6),
      nextParam,
      nextUrl,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate companyId is a valid UUID
  if (!isValidUUID(companyId)) {
    console.warn("[SWITCH_COMPANY] Invalid or missing companyId");
    redirect("/dashboard");
  }

  // TypeScript now knows companyId is a valid string
  const validCompanyId = companyId;

  // Get the authenticated session
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    // Not logged in - redirect to login with return URL
    const returnUrl = encodeURIComponent(`/switch-company?companyId=${validCompanyId}&next=${encodeURIComponent(nextUrl)}`);
    redirect(`/login?next=${returnUrl}`);
  }

  // Verify user has access to this company
  const membership = await prisma.companyUser.findFirst({
    where: {
      userId: session.user.id,
      companyId: validCompanyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      companyId: true,
      role: true,
    },
  });

  if (!membership) {
    // User doesn't have access to this company
    console.warn("[SWITCH_COMPANY] User lacks access to company", {
      userId: session.user.id.slice(-6),
      companyId: validCompanyId.slice(-6),
    });
    redirect("/dashboard");
  }

  // Set the active company cookie
  const cookieStore = await cookies();
  cookieStore.set("zzp-hub-active-company", validCompanyId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    // Cookie expires in 1 year
    maxAge: 60 * 60 * 24 * 365,
  });

  if (process.env.NODE_ENV !== "production" || process.env.AUTH_DEBUG === "true") {
    console.log("[SWITCH_COMPANY] Success", {
      userId: session.user.id.slice(-6),
      companyId: validCompanyId.slice(-6),
      role: membership.role,
      redirectTo: nextUrl,
    });
  }

  // Redirect to the target URL
  redirect(nextUrl);
}
