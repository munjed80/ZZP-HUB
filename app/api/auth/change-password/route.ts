import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireTenantContext } from "@/lib/auth/tenant";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    // Require authenticated session
    const { userId } = await requireTenantContext();

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== "string") {
      return NextResponse.json(
        { error: "Huidig wachtwoord is verplicht" },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== "string") {
      return NextResponse.json(
        { error: "Nieuw wachtwoord is verplicht" },
        { status: 400 }
      );
    }

    // Validate password policy
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Wachtwoord moet minimaal ${MIN_PASSWORD_LENGTH} tekens zijn` },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Huidig wachtwoord is onjuist" },
        { status: 400 }
      );
    }

    // Hash new password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: "Wachtwoord succesvol gewijzigd",
    });
  } catch (error) {
    console.error("Change password error:", error);
    
    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: "Je moet ingelogd zijn om je wachtwoord te wijzigen" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Er is een fout opgetreden. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}
