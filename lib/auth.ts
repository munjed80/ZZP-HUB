import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

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

/**
 * NextAuth configuration options
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const result = await authorize({
          email: credentials.email,
          password: credentials.password
        });
        
        if (!result) {
          return null;
        }
        
        return {
          id: result.id,
          email: result.email,
          name: result.naam,
          role: result.role
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  }
};

/**
 * Get the current user's ID from the session
 * @returns The user ID or undefined if not authenticated
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id as string | undefined;
}

/**
 * Get the current session
 * @returns The session object or null if not authenticated
 */
export async function getDemoSessie() {
  return await getServerSession(authOptions);
}
