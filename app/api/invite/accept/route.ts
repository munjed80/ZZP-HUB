import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import AccountantInviteEmail from "@/components/emails/AccountantInviteEmail";
import { createAccountantSession } from "@/lib/auth/accountant-session";
import { logInviteAccepted, logCompanyAccessGranted } from "@/lib/auth/security-audit";
import { AccountantAccessStatus, InviteStatus, UserRole } from "@prisma/client";

// Error codes for clear error handling
const INVITE_ERROR_CODES = {
  INVITE_NOT_FOUND: "INVITE_NOT_FOUND",
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_USED: "INVITE_USED",
  EMAIL_INVALID: "EMAIL_INVALID",
  LINK_FAILED: "LINK_FAILED",
  DB_ERROR: "DB_ERROR",
  MISSING_TOKEN: "MISSING_TOKEN",
} as const;

type InviteErrorCode = (typeof INVITE_ERROR_CODES)[keyof typeof INVITE_ERROR_CODES];

interface AcceptInviteResult {
  success: boolean;
  errorCode?: InviteErrorCode;
  message: string;
  companyName?: string;
  email?: string;
  isNewUser?: boolean;
  userId?: string;
}

function derivePermissions(role: UserRole, permissionsJson?: string | null) {
  if (permissionsJson) {
    try {
      const parsed = JSON.parse(permissionsJson);
      return {
        canRead: parsed.canRead ?? true,
        canEdit: Boolean(parsed.canEdit),
        canExport: Boolean(parsed.canExport),
        canBTW: Boolean(parsed.canBTW),
        permissionsJson: permissionsJson,
      };
    } catch {
      // fall back to role-based mapping
    }
  }

  const canEdit = role === UserRole.ACCOUNTANT_EDIT || role === UserRole.ACCOUNTANT;
  const canBTW = canEdit;
  const canExport = true;
  return {
    canRead: true,
    canEdit,
    canExport,
    canBTW,
    permissionsJson: JSON.stringify({
      canRead: true,
      canEdit,
      canExport,
      canBTW,
    }),
  };
}

async function upsertAccountantAccess(
  accountantUserId: string,
  companyId: string,
  role: UserRole,
  permissionsJson?: string | null,
) {
  const { canRead, canEdit, canExport, canBTW, permissionsJson: finalPermissions } = derivePermissions(role, permissionsJson);
  await prisma.accountantAccess.upsert({
    where: {
      accountantUserId_companyId: {
        accountantUserId,
        companyId,
      },
    },
    update: {
      canRead,
      canEdit,
      canExport,
      canBTW,
      permissions: finalPermissions,
      status: AccountantAccessStatus.ACTIVE,
    },
    create: {
      accountantUserId,
      companyId,
      canRead,
      canEdit,
      canExport,
      canBTW,
      permissions: finalPermissions,
      status: AccountantAccessStatus.ACTIVE,
    },
  });
  console.log("[ACCOUNTANT_ACCESS_GRANTED]", {
    accountantUserId: accountantUserId.slice(-6),
    companyId: companyId.slice(-6),
    role,
  });
}

/**
 * Generate a secure random password using rejection sampling to avoid modulo bias
 */
function generateSecurePassword(): string {
  const length = 16;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  const charsLength = chars.length;
  let password = "";
  
  // Generate enough random bytes (we need 16 chars, request more to account for rejections)
  const randomValues = crypto.randomBytes(32);
  
  let randomIndex = 0;
  while (password.length < length && randomIndex < randomValues.length) {
    const randomValue = randomValues[randomIndex++];
    // Use rejection sampling to avoid modulo bias
    // Only use values that fit evenly into our charset
    const maxUsableValue = 256 - (256 % charsLength);
    if (randomValue < maxUsableValue) {
      password += chars[randomValue % charsLength];
    }
  }
  
  // Fallback: if we somehow didn't get enough chars, use crypto.randomUUID
  while (password.length < length) {
    password += crypto.randomUUID().replace(/-/g, "").charAt(0);
  }
  
  return password;
}

/**
 * Public endpoint to accept an accountant invitation
 * This endpoint does NOT require authentication
 * 
 * Flow:
 * 1. Validate token exists, not used, not expired
 * 2. If email already exists → link directly as accountant
 * 3. If email does NOT exist → auto-create user with random password
 * 4. Send welcome email with credentials if new user
 * 5. Mark invite as used
 * 6. Return success with user info
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.MISSING_TOKEN,
          message: "Token ontbreekt in het verzoek.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the invite by token hash
    const invite = await prisma.accountantInvite.findUnique({
      where: { tokenHash },
      include: {
        company: {
          select: {
            companyProfile: {
              select: {
                companyName: true,
              },
            },
            naam: true,
            email: true,
          },
        },
      },
    });

    // Check if invite exists
    if (!invite) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_NOT_FOUND,
          message: "Uitnodiging niet gevonden. De link is mogelijk ongeldig.",
        },
        { status: 404 }
      );
    }

    // Check if already used
    if (invite.acceptedAt || invite.status === InviteStatus.ACCEPTED) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_USED,
          message: "Deze uitnodiging is al geaccepteerd.",
        },
        { status: 400 }
      );
    }

    // Check if expired
    if (invite.expiresAt < new Date() || invite.status === InviteStatus.REVOKED) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_EXPIRED,
          message: "Deze uitnodiging is verlopen. Vraag een nieuwe uitnodiging aan.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invite.invitedEmail)) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.EMAIL_INVALID,
          message: "Het e-mailadres in de uitnodiging is ongeldig.",
        },
        { status: 400 }
      );
    }

    const companyName =
      invite.company.companyProfile?.companyName ||
      invite.company.naam ||
      invite.company.email ||
      "Bedrijf";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invite.invitedEmail },
    });

    let isNewUser = false;
    let temporaryPassword: string | undefined;

    if (!user) {
      // Create new user with auto-generated password
      isNewUser = true;
      temporaryPassword = generateSecurePassword();
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      user = await prisma.user.create({
        data: {
          email: invite.invitedEmail,
          password: hashedPassword,
          role: invite.role,
          emailVerified: true, // Auto-verify since they came through invite link
          onboardingCompleted: true, // Skip onboarding for accountants
        },
      });
    }

    // Check if already a member of this company
    const existingMember = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: invite.companyId,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      // Already a member, just mark invite as used and create session
      await prisma.accountantInvite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      await upsertAccountantAccess(
        user.id,
        invite.companyId,
        existingMember.role,
        invite.permissions
      );

      // Create accountant session for immediate access
      try {
        await createAccountantSession(
          user.id,
          user.email,
          invite.companyId,
          existingMember.role
        );
      } catch (sessionError) {
        console.error("Failed to create accountant session:", sessionError);
        // Don't fail - they can still log in normally
      }

      return NextResponse.json<AcceptInviteResult>({
        success: true,
        message: `U heeft al toegang tot ${companyName}.`,
        companyName,
        email: invite.invitedEmail,
        isNewUser: false,
        userId: user.id,
      });
    }

    // Create company member link
    try {
      await prisma.companyMember.create({
        data: {
          companyId: invite.companyId,
          userId: user.id,
          role: invite.role,
        },
      });
      await upsertAccountantAccess(
        user.id,
        invite.companyId,
        invite.role,
        invite.permissions
      );
    } catch (linkError) {
      console.error("Failed to create company member link:", linkError);
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.LINK_FAILED,
          message: "Er is een fout opgetreden bij het koppelen van uw account. Probeer het later opnieuw.",
        },
        { status: 500 }
      );
    }

    // Mark invite as accepted
    await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        status: InviteStatus.ACCEPTED,
        acceptedByUserId: user.id,
      },
    });

    // Structured log for invite acceptance
  console.log('[ACCOUNTANT_INVITE_ACCEPTED]', {
    timestamp: new Date().toISOString(),
    userId: user.id.slice(-6), // Only log last 6 chars for privacy
    email: invite.invitedEmail,
    companyId: invite.companyId.slice(-6),
    role: invite.role,
    isNewUser,
    companyName,
  });

    // Log invite acceptance and company access grant for audit
await logInviteAccepted({
  userId: user.id,
  email: invite.invitedEmail,
  companyId: invite.companyId,
  role: invite.role,
  isNewUser,
});

    await logCompanyAccessGranted({
      userId: invite.companyId,
      targetUserId: user.id,
      companyId: invite.companyId,
      role: invite.role,
    });

    // Create accountant session for immediate access (for ALL users - both new and existing)
    // This allows accountants to access the portal immediately after accepting the invite
    // Previously only existing users got immediate access, causing new users to be redirected to login
    try {
      await createAccountantSession(
        user.id,
        user.email,
        invite.companyId,
        invite.role
      );
      
      // Structured log for session creation
      console.log('[ACCOUNTANT_SESSION_COOKIE_SET]', {
        timestamp: new Date().toISOString(),
        userId: user.id.slice(-6), // Only log last 6 chars for privacy
        email: invite.invitedEmail,
        companyId: invite.companyId.slice(-6),
        role: invite.role,
        isNewUser,
      });
    } catch (sessionError) {
      console.error('[ACCOUNTANT_SESSION_COOKIE_SET_FAILED]', {
        timestamp: new Date().toISOString(),
        error: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        userId: user.id.slice(-6),
      });
      // Don't fail - they can still log in normally
    }

    // Send welcome email to new users with their temporary password
    if (isNewUser && temporaryPassword) {
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        process.env.BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
      const loginUrl = `${baseUrl}/login`;

      try {
        await sendEmail({
          to: invite.invitedEmail,
          subject: `Welkom bij Matrixtop - U heeft toegang tot ${companyName}`,
          react: AccountantInviteEmail({
            acceptUrl: loginUrl,
            companyName,
            temporaryPassword,
            isNewUser: true,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the entire operation if email fails
      }
    }

    return NextResponse.json<AcceptInviteResult>({
      success: true,
      message: isNewUser
        ? `Welkom! Uw account is aangemaakt en u heeft nu direct toegang tot ${companyName}.`
        : `U heeft nu toegang tot ${companyName}.`,
      companyName,
      email: invite.invitedEmail,
      isNewUser,
      userId: user.id,
    });
  } catch (error) {
    console.error("Error accepting invite:", error);
    return NextResponse.json<AcceptInviteResult>(
      {
        success: false,
        errorCode: INVITE_ERROR_CODES.DB_ERROR,
        message: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to validate an invitation token without accepting it
 * Used by the frontend to show the invite details before the user accepts
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.MISSING_TOKEN,
          message: "Token ontbreekt in het verzoek.",
        },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Find the invite by token hash
    const invite = await prisma.accountantInvite.findUnique({
      where: { tokenHash },
      include: {
        company: {
          select: {
            companyProfile: {
              select: {
                companyName: true,
              },
            },
            naam: true,
            email: true,
          },
        },
      },
    });

    if (!invite) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_NOT_FOUND,
          message: "Uitnodiging niet gevonden. De link is mogelijk ongeldig.",
        },
        { status: 404 }
      );
    }

    if (invite.acceptedAt || invite.status === InviteStatus.ACCEPTED) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_USED,
          message: "Deze uitnodiging is al geaccepteerd.",
        },
        { status: 400 }
      );
    }

    if (invite.expiresAt < new Date() || invite.status === InviteStatus.REVOKED) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.INVITE_EXPIRED,
          message: "Deze uitnodiging is verlopen. Vraag een nieuwe uitnodiging aan.",
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invite.invitedEmail)) {
      return NextResponse.json<AcceptInviteResult>(
        {
          success: false,
          errorCode: INVITE_ERROR_CODES.EMAIL_INVALID,
          message: "Het e-mailadres in de uitnodiging is ongeldig.",
        },
        { status: 400 }
      );
    }

    const companyName =
      invite.company.companyProfile?.companyName ||
      invite.company.naam ||
      invite.company.email ||
      "Bedrijf";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invite.invitedEmail },
    });

    return NextResponse.json<AcceptInviteResult>({
      success: true,
      message: "Uitnodiging is geldig.",
      companyName,
      email: invite.invitedEmail,
      isNewUser: !existingUser,
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json<AcceptInviteResult>(
      {
        success: false,
        errorCode: INVITE_ERROR_CODES.DB_ERROR,
        message: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw.",
      },
      { status: 500 }
    );
  }
}
