import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/me
 * 
 * Returns the current authenticated user's profile data including:
 * - id, email, full_name, role, is_email_verified
 * 
 * This endpoint reads directly from the database to ensure
 * fresh data rather than relying on potentially stale JWT claims.
 */
export async function GET() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Niet geauthenticeerd" },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        naam: true,
        role: true,
        emailVerified: true,
        isSuspended: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Gebruiker niet gevonden" },
        { status: 404 }
      );
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: "Account is geblokkeerd" },
        { status: 403 }
      );
    }

    // Log for debugging (server-side only, safe output)
    console.log("[AUTH_ME] User profile fetched:", {
      userId: user.id.slice(-6),
      role: user.role,
      emailVerified: user.emailVerified,
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      full_name: user.naam,
      role: user.role,
      is_email_verified: user.emailVerified,
      onboarding_completed: user.onboardingCompleted,
      created_at: user.createdAt,
    });
  } catch (error) {
    console.error("[AUTH_ME] Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Er ging iets mis" },
      { status: 500 }
    );
  }
}
