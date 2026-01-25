import { NextRequest, NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/auth/company-context";
import { buildSecureRedirectUrl } from "@/lib/base-url";

/**
 * Structured logging helper for clear-company events
 */
function logClearCompanyEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `CLEAR_COMPANY_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * POST /api/context/clear-company
 * 
 * Clears the active company cookie, effectively exiting accountant context.
 * After clearing, the user can be redirected to the accountant portal to select
 * a new client company.
 * 
 * Query params:
 *   - redirect: "true" | "false" (default: "false")
 *   - next: string (default: "/accountant") - redirect destination if redirect=true
 * 
 * Response:
 *   - If redirect=false: JSON { ok: true }
 *   - If redirect=true: 302 redirect to next URL
 */
export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();
  
  if (!session?.user?.id) {
    logClearCompanyEvent("NO_SESSION", {});
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const shouldRedirect = searchParams.get("redirect") === "true";
  const nextPath = searchParams.get("next") || "/accountant";

  // Log the event
  logClearCompanyEvent("REQUEST", {
    userId: session.user.id.slice(-6),
    shouldRedirect,
    nextPath,
  });

  // Create response - either redirect or JSON
  let response: NextResponse;
  
  if (shouldRedirect) {
    const redirectUrl = buildSecureRedirectUrl(nextPath);
    logClearCompanyEvent("REDIRECT", {
      userId: session.user.id.slice(-6),
      redirectUrl,
    });
    response = NextResponse.redirect(redirectUrl);
  } else {
    response = NextResponse.json({ ok: true });
  }

  // Clear the active company cookie by setting it to empty with immediate expiration
  response.cookies.set(ACTIVE_COMPANY_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    // Expire immediately
    maxAge: 0,
    expires: new Date(0),
  });

  logClearCompanyEvent("SUCCESS", {
    userId: session.user.id.slice(-6),
    cookieCleared: true,
  });

  return response;
}
