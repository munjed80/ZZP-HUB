import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, generateVerificationToken, hashToken } from "@/lib/email";
import PasswordResetEmail from "@/components/emails/PasswordResetEmail";
import { APP_BASE_URL } from "@/config/emails";

// Simple in-memory rate limiting
// Note: This is suitable for single-instance deployments or development.
// For production with multiple instances, consider using Redis or database-backed rate limiting.
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_REQUESTS_PER_EMAIL = 3;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_EMAIL) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting per email
    if (!checkRateLimit(normalizedEmail)) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 }
      );
    }

    // Find user by email (case-insensitive)
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
    });

    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we return the same message
    if (!user) {
      // Add delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
      return NextResponse.json({
        success: true,
        message: "Als het e-mailadres bestaat, hebben we een resetlink verzonden.",
      });
    }

    // Generate random token
    const token = generateVerificationToken();
    const tokenHash = await hashToken(token);

    // Store token in database with 60 minute expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // Send email with reset link
    const baseUrl = APP_BASE_URL;
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailResult = await sendEmail({
      to: user.email,
      subject: "ZZP Hub – Password reset",
      react: PasswordResetEmail({
        resetUrl,
        userName: user.naam || undefined,
      }),
    });

    if (!emailResult.success) {
      console.error("Failed to send password reset email:", emailResult.error);
      // Don't reveal email send failure to prevent enumeration
    }

    return NextResponse.json({
      success: true,
      message: "Als het e-mailadres bestaat, hebben we een resetlink verzonden.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
