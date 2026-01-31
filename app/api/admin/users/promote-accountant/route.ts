import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

/**
 * PATCH /api/admin/users/promote-accountant
 * 
 * Development/testing endpoint to promote a user to ACCOUNTANT role.
 * Requires SUPERADMIN role.
 * 
 * Body: { email: string }
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    // Only SUPERADMIN can promote users
    if (session.user.role !== UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: "Niet geautoriseerd. Alleen admins kunnen rollen aanpassen." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-mailadres is verplicht" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, naam: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    // Prevent promoting SUPERADMIN
    if (user.role === UserRole.SUPERADMIN) {
      return NextResponse.json(
        { error: "Kan SUPERADMIN rol niet wijzigen" },
        { status: 400 }
      );
    }

    // Update user role to ACCOUNTANT
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ACCOUNTANT },
      select: { id: true, email: true, naam: true, role: true },
    });

    console.log("[ADMIN] User promoted to ACCOUNTANT:", {
      userId: updatedUser.id.slice(-6),
      previousRole: user.role,
      newRole: updatedUser.role,
    });

    return NextResponse.json({
      success: true,
      message: `Gebruiker ${updatedUser.email} is nu een accountant`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.naam,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error("[ADMIN] Error promoting user:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
