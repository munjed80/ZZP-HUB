import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
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
 * 
 * This function:
 * - Uses prisma.user.findUnique to find the user by the provided email
 * - Compares the password with the stored hash using bcrypt.compare
 * - Returns the user's role and id from the database
 * 
 * The returned user data is designed to be used with NextAuth session and jwt callbacks
 * to include the user's role and id from the database in the session.
 * 
 * Demo session logic has been removed - only real database users can log in.
 */
export async function authorize(
  credentials: Credentials
): Promise<AuthorizeResult | null> {
  if (!credentials?.email || !credentials?.password) {
    return null;
  }

  try {
    // Use Prisma to find the user by email
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

    // Compare password with stored hash using bcrypt
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return null;
    }

    // Return user with role and id from database
    // This data should be included in NextAuth session and jwt callbacks
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
