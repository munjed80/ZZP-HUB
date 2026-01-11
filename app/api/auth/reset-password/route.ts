import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/email";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Token is verplicht" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Wachtwoord is verplicht" },
        { status: 400 }
      );
    }

    // Validate password policy
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn` },
        { status: 400 }
      );
    }

    // Find all non-used, non-expired tokens
    const now = new Date();
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: { gte: now },
        usedAt: null,
      },
      include: {
        user: true,
      },
    });

    // Find the matching token by verifying hash
    let matchedToken = null;
    for (const resetToken of resetTokens) {
      const isValid = await verifyToken(token, resetToken.tokenHash);
      if (isValid) {
        matchedToken = resetToken;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        { error: "Ongeldige of verlopen resetlink" },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    // Clean up old/expired tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: matchedToken.userId,
        OR: [
          { expiresAt: { lt: now } },
          { usedAt: { not: null } },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      message: "Wachtwoord succesvol gewijzigd",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
