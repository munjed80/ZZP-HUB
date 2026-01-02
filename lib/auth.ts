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
  isSuspended: boolean;
}

function isAuthorizeResult(user: unknown): user is AuthorizeResult {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Partial<AuthorizeResult>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.isSuspended === "boolean"
  );
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
        isSuspended: true,
      },
    });

    if (!user) {
      return null;
    }

    if (user.isSuspended) {
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("Authorize debug: comparing password", {
        user,
        providedPassword: credentials.password,
        passwordHash: user.passwordHash,
      });
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
      isSuspended: user.isSuspended,
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
           role: result.role,
           isSuspended: result.isSuspended,
         };
       }
     })
   ],
   callbacks: {
     async jwt({ token, user }) {
       if (user && isAuthorizeResult(user)) {
        token.id = user.id;
        token.role = user.role;
        token.isSuspended = user.isSuspended;
       }
       return token;
     },
     async session({ session, token }) {
       if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isSuspended = Boolean(token.isSuspended);
       }
       return session;
     }
  },
  pages: {
    signIn: "/login",
  }
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId(): Promise<string | undefined> {
  const session = await getServerAuthSession();
  if (session?.user?.isSuspended) {
    return undefined;
  }
  return session?.user?.id;
}

export async function requireUser() {
  const session = await getServerAuthSession();
  if (!session?.user) {
    throw new Error("Niet geauthenticeerd. Log in om door te gaan.");
  }
  if (session.user.isSuspended) {
    throw new Error("Dit account is geblokkeerd. Neem contact op met support.");
  }
  return { id: session.user.id, role: session.user.role };
}
