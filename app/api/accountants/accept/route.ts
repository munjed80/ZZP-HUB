import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerAuthSession } from "@/lib/auth";
import { normalizeEmail } from "@/lib/utils";
import { CompanyUserStatus } from "@prisma/client";
import crypto from "crypto";
import { logInviteAccepted } from "@/lib/auth/security-audit";

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Mask an email address for safe logging (e.g., "j***n@example.com")
 */
function maskEmail(email: string): string {
  return email.replace(/(.).+(@.*)/, "$1***$2");
}

/**
 * Structured logging helper for accept flow events
 */
function logAcceptEvent(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `ACCEPT_INVITE_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * Extract Prisma error code from an error object
 */
function getPrismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

export async function POST(request: Request) {
  // Extract origin from request URL for logging
  let origin = "unknown";
  try {
    const url = new URL(request.url);
    origin = url.origin;
  } catch {
    // URL parsing can fail in edge cases (malformed URLs); log as unknown
  }

  const session = await getServerAuthSession();
  if (!session?.user) {
    logAcceptEvent("NO_SESSION", { origin });
    return NextResponse.json({ error: "Niet geauthenticeerd" }, { status: 401 });
  }

  const sessionUserId = session.user.id;
  const sessionEmail = session.user.email;

  logAcceptEvent("START", {
    origin,
    sessionUserId: sessionUserId?.slice(-6),
    sessionEmailMasked: sessionEmail ? maskEmail(sessionEmail) : "missing",
  });

  const body = await request.json().catch(() => null) as { token?: unknown; email?: unknown } | null;
  if (!body?.token) {
    logAcceptEvent("TOKEN_MISSING", { origin, sessionUserId: sessionUserId?.slice(-6) });
    return NextResponse.json({ error: "Token vereist" }, { status: 400 });
  }

  // Determine email to use for matching
  let email: string;
  try {
    if (!body.email && !sessionEmail) {
      throw new Error("EMAIL_REQUIRED");
    }
    const sourceEmail = body.email ?? sessionEmail;
    email = normalizeEmail(sourceEmail);
  } catch (error) {
    const message =
      error instanceof Error && (error.message === "EMAIL_REQUIRED" || error.message === "EMAIL_INVALID")
        ? "Ongeldig e-mailadres"
        : "Ongeldige aanvraag";
    logAcceptEvent("EMAIL_INVALID", { sessionUserId: sessionUserId?.slice(-6) });
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const tokenHash = hashToken(String(body.token));

  // Find the invite by token
  const companyUser = await prisma.companyUser.findUnique({
    where: { tokenHash },
  });

  // IDEMPOTENT: If token not found, fallback to check if user is already linked
  // This handles cases where:
  // 1. Token was already used (cleared after successful accept)
  // 2. Token expired but user manually linked
  // 3. Double-click on accept link
  if (!companyUser) {
    logAcceptEvent("TOKEN_NOT_FOUND_FALLBACK", {
      sessionUserId: sessionUserId?.slice(-6),
      emailMasked: maskEmail(email),
    });

    // Check if there's an existing active link for this user/email
    const existingLink = await prisma.companyUser.findFirst({
      where: {
        OR: [
          { userId: sessionUserId },
          { invitedEmail: email },
        ],
        status: CompanyUserStatus.ACTIVE,
      },
    });

    if (existingLink) {
      logAcceptEvent("FALLBACK_ALREADY_LINKED", {
        sessionUserId: sessionUserId?.slice(-6),
        emailMasked: maskEmail(email),
        companyId: existingLink.companyId.slice(-6),
      });

      // Return success - user is already linked (idempotent behavior)
      const companies = await prisma.companyUser.findMany({
        where: {
          userId: sessionUserId,
          status: CompanyUserStatus.ACTIVE,
        },
        select: {
          companyId: true,
          company: {
            select: {
              companyProfile: { select: { companyName: true } },
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        alreadyLinked: true,
        companyUserId: existingLink.id,
        companies: companies.map((c) => ({
          id: c.companyId,
          name: c.company?.companyProfile?.companyName || "Bedrijf",
        })),
      });
    }

    // No active link found - token truly invalid
    logAcceptEvent("TOKEN_NOT_FOUND", {
      sessionUserId: sessionUserId?.slice(-6),
      emailMasked: maskEmail(email),
    });
    return NextResponse.json({ error: "Ongeldige of verlopen uitnodiging" }, { status: 400 });
  }

  logAcceptEvent("INVITE_FOUND", {
    inviteId: companyUser.id.slice(-6),
    companyId: companyUser.companyId.slice(-6),
    inviteStatus: companyUser.status,
    invitedEmailMasked: companyUser.invitedEmail ? maskEmail(companyUser.invitedEmail) : "none",
    sessionEmailMasked: maskEmail(email),
  });

  // Check if already accepted (idempotent: return success for double-click)
  if (companyUser.status === CompanyUserStatus.ACTIVE) {
    logAcceptEvent("ALREADY_ACCEPTED", {
      inviteId: companyUser.id.slice(-6),
      companyId: companyUser.companyId.slice(-6),
    });
    // Return success - invite was already accepted
    const companies = await prisma.companyUser.findMany({
      where: {
        userId: companyUser.userId,
        status: CompanyUserStatus.ACTIVE,
      },
      select: {
        companyId: true,
        company: {
          select: {
            companyProfile: { select: { companyName: true } },
          },
        },
      },
    });
    return NextResponse.json({
      success: true,
      alreadyAccepted: true,
      companyUserId: companyUser.id,
      companies: companies.map((c) => ({
        id: c.companyId,
        name: c.company?.companyProfile?.companyName || "Bedrijf",
      })),
    });
  }

  // Check if invite is in a valid state for acceptance
  if (companyUser.status !== CompanyUserStatus.PENDING) {
    logAcceptEvent("INVALID_STATUS", {
      inviteId: companyUser.id.slice(-6),
      status: companyUser.status,
    });
    return NextResponse.json({ error: "Ongeldige of gebruikte uitnodiging" }, { status: 400 });
  }

  // Verify email matches the invite
  if (companyUser.invitedEmail && companyUser.invitedEmail !== email) {
    logAcceptEvent("EMAIL_MISMATCH", {
      inviteId: companyUser.id.slice(-6),
      invitedEmailMasked: maskEmail(companyUser.invitedEmail),
      sessionEmailMasked: maskEmail(email),
    });
    return NextResponse.json({ error: "E-mailadres komt niet overeen met uitnodiging" }, { status: 400 });
  }

  // CRITICAL: Verify the session user exists in the database before updating CompanyUser
  // This prevents P2003 FK constraint violation
  const userExists = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, email: true },
  });

  if (!userExists) {
    logAcceptEvent("USER_NOT_FOUND", {
      sessionUserId: sessionUserId?.slice(-6),
      inviteId: companyUser.id.slice(-6),
    });
    // Session contains invalid userId - force re-login
    return NextResponse.json(
      { error: "Uw sessie is ongeldig. Log opnieuw in." },
      { status: 401 }
    );
  }

  // Additional safety check: verify session email matches user email in database
  const normalizedDbEmail = normalizeEmail(userExists.email);
  if (normalizedDbEmail !== email) {
    logAcceptEvent("SESSION_EMAIL_DB_MISMATCH", {
      sessionUserId: sessionUserId?.slice(-6),
      dbEmailMasked: maskEmail(normalizedDbEmail),
      sessionEmailMasked: maskEmail(email),
    });
    return NextResponse.json({ error: "E-mailadres komt niet overeen met uw account" }, { status: 400 });
  }

  logAcceptEvent("USER_VERIFIED", {
    userId: userExists.id.slice(-6),
    emailMasked: maskEmail(userExists.email),
    inviteId: companyUser.id.slice(-6),
  });

  // Now safe to update CompanyUser with the verified userId
  try {
    const updated = await prisma.companyUser.update({
      where: { id: companyUser.id },
      data: {
        userId: userExists.id,
        invitedEmail: email,
        status: CompanyUserStatus.ACTIVE,
        tokenHash: null, // Clear token - single use
      },
    });

    logAcceptEvent("SUCCESS", {
      inviteId: updated.id.slice(-6),
      companyId: updated.companyId.slice(-6),
      userId: userExists.id.slice(-6),
    });

    const companies = await prisma.companyUser.findMany({
      where: {
        userId: userExists.id,
        status: CompanyUserStatus.ACTIVE,
      },
      select: {
        companyId: true,
        company: {
          select: {
            companyProfile: { select: { companyName: true } },
          },
        },
      },
    });

    await logInviteAccepted({
      userId: userExists.id,
      email,
      companyId: companyUser.companyId,
      role: "ACCOUNTANT",
      isNewUser: false,
    });

    return NextResponse.json({
      success: true,
      companyUserId: updated.id,
      companies: companies.map((c) => ({
        id: c.companyId,
        name: c.company?.companyProfile?.companyName || "Bedrijf",
      })),
    });
  } catch (error) {
    // Log any unexpected errors during update
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorCode = getPrismaErrorCode(error);
    
    logAcceptEvent("UPDATE_ERROR", {
      inviteId: companyUser.id.slice(-6),
      userId: userExists.id.slice(-6),
      errorCode,
      error: errorMsg,
    });
    
    // Re-throw to let Next.js handle it
    throw error;
  }
}
