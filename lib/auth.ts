import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { Prisma, type UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { buildAbsoluteUrl, getAppBaseUrl } from "./base-url";

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
  emailVerified: boolean;
  onboardingCompleted: boolean;
}

function isAuthorizeResult(user: unknown): user is AuthorizeResult {
  if (!user || typeof user !== "object") return false;
  const candidate = user as Partial<AuthorizeResult>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.email === "string" &&
    typeof candidate.role === "string" &&
    typeof candidate.isSuspended === "boolean" &&
    typeof candidate.emailVerified === "boolean" &&
    typeof candidate.onboardingCompleted === "boolean"
  );
}

const DEFAULT_ROLE: UserRole = "COMPANY_ADMIN";

function isMissingOnboardingColumns(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2022"
  ) {
    return true;
  }
  return error instanceof Error && /emailVerified|onboarding/i.test(error.message);
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
    const maskedEmail = credentials.email.replace(/(.).+(@.*)/, "$1***$2");
    const shouldLogAuth =
      process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";
    if (shouldLogAuth) {
      console.log("Authorize attempt", { emailMasked: maskedEmail });
    }

    // Use Prisma to find the user by email
    let user:
      | (AuthorizeResult & { password: string })
      | {
          id: string;
          email: string;
          password: string;
          naam: string | null;
          role: UserRole;
          isSuspended: boolean;
        }
      | null = null;

    try {
      user = await prisma.user.findUnique({
        where: {
          email: credentials.email,
        },
        select: {
          id: true,
          email: true,
          password: true,
          naam: true,
          role: true,
          isSuspended: true,
          emailVerified: true,
          onboardingCompleted: true,
        },
      });
    } catch (error) {
      if (isMissingOnboardingColumns(error)) {
        console.warn(
          "[auth] Missing onboarding/email verification columns detected, continuing with safe defaults",
        );
        user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            password: true,
            naam: true,
            role: true,
            isSuspended: true,
          },
        });
      } else {
        throw error;
      }
    }

    if (!user) {
      if (shouldLogAuth) {
        console.log("Authorize failed: user not found", { emailMasked: maskedEmail });
      }
      return null;
    }

    if (user.isSuspended) {
      if (shouldLogAuth) {
        console.log("Authorize blocked: user suspended", { emailMasked: maskedEmail });
      }
      return null;
    }

    if (shouldLogAuth) {
      console.log("Authorize comparing password", {
        user: {
          idSuffix: user.id.slice(-6),
          emailMasked: maskedEmail,
          role: user.role,
          isSuspended: user.isSuspended,
        },
      });
    }

    // Compare password with stored hash using bcrypt
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password
    );

    if (!isPasswordValid) {
      if (shouldLogAuth) {
        console.log("Authorize failed: invalid password", { emailMasked: maskedEmail });
      }
      return null;
    }

    if (shouldLogAuth) {
      console.log("Authorize success", { emailMasked: maskedEmail });
    }

    const emailVerified =
      "emailVerified" in user ? Boolean(user.emailVerified) : false;
    const onboardingCompleted =
      "onboardingCompleted" in user ? Boolean(user.onboardingCompleted) : false;

    // Return user with role and id from database
    // This data should be included in NextAuth session and jwt callbacks
    return {
      id: user.id,
      email: user.email,
      naam: user.naam,
      role: user.role,
      isSuspended: user.isSuspended,
      emailVerified,
      onboardingCompleted,
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
           emailVerified: result.emailVerified,
           onboardingCompleted: result.onboardingCompleted,
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
         token.emailVerified = user.emailVerified;
         token.onboardingCompleted = user.onboardingCompleted;
         }
         token.isSuspended = Boolean(token.isSuspended);
         token.emailVerified = Boolean(token.emailVerified);
         token.onboardingCompleted = Boolean(token.onboardingCompleted);
         return token;
       },
       async session({ session, token }) {
         if (session.user) {
         if (typeof token.id === "string") {
           session.user.id = token.id;
         }
         if (typeof token.role === "string") {
           session.user.role = token.role as UserRole;
         } else {
           session.user.role = session.user.role ?? DEFAULT_ROLE;
         }
         session.user.isSuspended = Boolean(token.isSuspended);
         session.user.emailVerified = Boolean(token.emailVerified);
         session.user.onboardingCompleted = Boolean(token.onboardingCompleted);
         }
         return session;
       },
       async redirect({ url, baseUrl }) {
         const appBaseUrl = getAppBaseUrl();
         const safeBaseUrl = appBaseUrl || baseUrl;

         if (url.startsWith("/")) {
           return buildAbsoluteUrl(url);
         }

         try {
           const target = new URL(url);
           const allowedOrigins = new Set([
             new URL(baseUrl).origin,
             new URL(safeBaseUrl).origin,
           ]);

           if (allowedOrigins.has(target.origin)) {
             return target.toString();
           }
         } catch {
           // Fall through to safe fallback
         }

         return safeBaseUrl;
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
