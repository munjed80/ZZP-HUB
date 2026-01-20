import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InviteStatus } from "@prisma/client";
import crypto from "crypto";

// Error codes for clear error handling
const ERROR_CODES = {
  INVITE_NOT_FOUND: "INVITE_NOT_FOUND",
  INVITE_EXPIRED: "INVITE_EXPIRED",
  INVITE_USED: "INVITE_USED",
  MISSING_TOKEN: "MISSING_TOKEN",
  DB_ERROR: "DB_ERROR",
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

interface ValidateResult {
  success: boolean;
  errorCode?: ErrorCode;
  message: string;
  companyName?: string;
  email?: string;
}

/**
 * GET endpoint to validate an accountant access token
 * Returns invite details if valid
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json<ValidateResult>(
        {
          success: false,
          errorCode: ERROR_CODES.MISSING_TOKEN,
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
      return NextResponse.json<ValidateResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_NOT_FOUND,
          message: "Uitnodiging niet gevonden. De link is mogelijk ongeldig.",
        },
        { status: 404 }
      );
    }

    // Check if already accepted
    if (invite.status === InviteStatus.ACCEPTED) {
      return NextResponse.json<ValidateResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_USED,
          message: "Deze uitnodiging is al geaccepteerd.",
        },
        { status: 400 }
      );
    }

    // Check if expired or revoked
    if (
      invite.status === InviteStatus.EXPIRED ||
      invite.status === InviteStatus.REVOKED ||
      invite.expiresAt < new Date()
    ) {
      return NextResponse.json<ValidateResult>(
        {
          success: false,
          errorCode: ERROR_CODES.INVITE_EXPIRED,
          message: "Deze uitnodiging is verlopen. Vraag een nieuwe uitnodiging aan.",
        },
        { status: 400 }
      );
    }

    const companyName =
      invite.company.companyProfile?.companyName ||
      invite.company.naam ||
      invite.company.email ||
      "Bedrijf";

    return NextResponse.json<ValidateResult>({
      success: true,
      message: "Uitnodiging is geldig.",
      companyName,
      email: invite.invitedEmail,
    });
  } catch (error) {
    console.error("Error validating invite:", error);
    return NextResponse.json<ValidateResult>(
      {
        success: false,
        errorCode: ERROR_CODES.DB_ERROR,
        message: "Er is een onverwachte fout opgetreden. Probeer het later opnieuw.",
      },
      { status: 500 }
    );
  }
}
