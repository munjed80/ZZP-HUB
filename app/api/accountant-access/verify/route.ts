import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { InviteStatus } from "@prisma/client";
import { createAccountantSession } from "@/lib/auth/accountant-session";
import { logInviteAccepted, logCompanyAccessGranted } from "@/lib/auth/security-audit";

// Error codes for clear error handling
const ERROR_CODES = {
  INVITE_NOT_FOUND: "INVITE_NOT_FOUND",
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_USED: "INVITE_USED",
  OTP_EXPIRED: "OTP_EXPIRED",
  OTP_INVALID: "OTP_INVALID",
  MISSING_TOKEN: "MISSING_TOKEN",
  MISSING_OTP: "MISSING_OTP",
  SESSION_FAILED: "SESSION_FAILED",
  DB_ERROR: "DB_ERROR",
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

interface VerifyResult {
  success: boolean;
  errorCode?: ErrorCode;
  message: string;
  companyName?: string;
}

/**
 * POST endpoint to verify OTP and grant accountant access
 * 
 * Flow:
 * 1. Validate token exists, not expired, status PENDING
 * 2. Verify OTP hash matches and not expired
 * 3. Mark invite ACCEPTED (idempotent)
 * 4. Create or get user
 * 5. Create CompanyMember link
 * 6. Create accountant session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, otpCode } = body;

    // Validate inputs
    if (!token || typeof token !== "string") {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.MISSING_TOKEN,
          message: "Token ontbreekt in het verzoek.",
        },
        { status: 400 }
      );
    }

    if (!otpCode || typeof otpCode !== "string" || otpCode.length !== 6) {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.MISSING_OTP,
          message: "Verificatiecode ontbreekt of is ongeldig.",
        },
        { status: 400 }
      );
    }

    // Find the invite by token
    const invite = await prisma.accountantInvite.findUnique({
      where: { token },
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
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_NOT_FOUND,
          message: "Uitnodiging niet gevonden. De link is mogelijk ongeldig.",
        },
        { status: 404 }
      );
    }

    // Check if already accepted (idempotent check)
    if (invite.status === InviteStatus.ACCEPTED) {
      // If already accepted, check if we have an existing session and user
      const existingUser = await prisma.user.findUnique({
        where: { email: invite.email },
      });

      if (existingUser) {
        // Create a new session for the user (idempotent re-login)
        try {
          await createAccountantSession(
            existingUser.id,
            existingUser.email,
            invite.companyId,
            invite.role
          );

          const companyName =
            invite.company.companyProfile?.companyName ||
            invite.company.naam ||
            invite.company.email ||
            "Bedrijf";

          return NextResponse.json<VerifyResult>({
            success: true,
            message: `U heeft al toegang tot ${companyName}. Sessie vernieuwd.`,
            companyName,
          });
        } catch (sessionError) {
          console.error("Failed to refresh session:", sessionError);
        }
      }

      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_USED,
          message: "Deze uitnodiging is al geaccepteerd.",
        },
        { status: 400 }
      );
    }

    // Check if invite expired (status or date)
    if (invite.status === InviteStatus.EXPIRED || invite.expiresAt < new Date()) {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_EXPIRED,
          message: "Deze uitnodiging is verlopen. Vraag een nieuwe uitnodiging aan.",
        },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (!invite.otpExpiresAt || invite.otpExpiresAt < new Date()) {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.OTP_EXPIRED,
          message: "De verificatiecode is verlopen. Vraag een nieuwe code aan.",
        },
        { status: 400 }
      );
    }

    // Verify OTP hash
    if (!invite.otpHash) {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.OTP_INVALID,
          message: "Er is geen verificatiecode geconfigureerd voor deze uitnodiging.",
        },
        { status: 400 }
      );
    }

    const otpValid = await bcrypt.compare(otpCode, invite.otpHash);
    if (!otpValid) {
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.OTP_INVALID,
          message: "Ongeldige verificatiecode. Controleer de code en probeer opnieuw.",
        },
        { status: 400 }
      );
    }

    // OTP verified! Now create/get user and grant access
    const companyName =
      invite.company.companyProfile?.companyName ||
      invite.company.naam ||
      invite.company.email ||
      "Bedrijf";

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: invite.email },
    });

    const isNewUser = !user;

    if (!user) {
      // Create minimal user account (no password needed for accountant-only access)
      // Generate a random secure password they'll never use
      const randomPassword = await bcrypt.hash(crypto.randomUUID(), 10);

      user = await prisma.user.create({
        data: {
          email: invite.email,
          password: randomPassword,
          role: invite.role,
          emailVerified: true, // Auto-verify since they verified via OTP
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

    if (!existingMember) {
      // Create company member link
      await prisma.companyMember.create({
        data: {
          companyId: invite.companyId,
          userId: user.id,
          role: invite.role,
        },
      });
    }

    // Mark invite as accepted
    await prisma.accountantInvite.update({
      where: { id: invite.id },
      data: {
        status: InviteStatus.ACCEPTED,
        acceptedAt: new Date(),
      },
    });

    // Log invite acceptance and company access grant for audit
    await logInviteAccepted({
      userId: user.id,
      email: invite.email,
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

    // Create accountant session for immediate access
    try {
      await createAccountantSession(
        user.id,
        user.email,
        invite.companyId,
        invite.role
      );
    } catch (sessionError) {
      console.error("Failed to create accountant session:", sessionError);
      return NextResponse.json<VerifyResult>(
        {
          success: false,
          errorCode: ERROR_CODES.SESSION_FAILED,
          message: "Er is een fout opgetreden bij het aanmaken van uw sessie. Probeer opnieuw.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json<VerifyResult>({
      success: true,
      message: `Welkom! U heeft nu toegang tot ${companyName}.`,
      companyName,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json<VerifyResult>(
      {
        success: false,
        errorCode: ERROR_CODES.DB_ERROR,
        message: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw.",
      },
      { status: 500 }
    );
  }
}
