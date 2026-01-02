import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Sessie } from "./utils";
import type { UserRole } from "@prisma/client";

interface Credentials {
  email: string;
  password: string;
}

interface AuthorizeResult {
  id: string;
  email: string;
  naam: string | null;
  role: UserRole;
}

/**
 * Authorize function for credentials-based authentication.
 * Fetches user from Prisma database and verifies password with bcrypt.
 * Returns user with their role from the database.
 */
export async function authorize(
  credentials: Credentials
): Promise<AuthorizeResult | null> {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  try {
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: {
        email: credentials.email,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        naam: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return null;
    }

    // Return user with role from database
    return {
      id: user.id,
      email: user.email,
      naam: user.naam,
      role: user.role,
    };
  } catch (error) {
    console.error("Error during authorization:", error);
    return null;
  }
}

// Legacy functions - TODO: Replace with proper session management
export function getDemoSessie(): Sessie {
  return {
    gebruiker: "Demo gebruiker",
    abonnement: "Maandelijks - proefperiode actief",
  };
}

export function isIngelogd(): boolean {
  // TODO: Replace with real session validation
  return true;
}

export function getCurrentUserId(): string {
  // TODO: Replace with authenticated user from session
  return "00000000-0000-0000-0000-000000000001";
}
