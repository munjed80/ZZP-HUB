/**
 * Combined Authentication Helpers
 * 
 * Provides utilities to check for both NextAuth sessions and accountant sessions,
 * allowing seamless authentication for both regular users and accountants.
 */

import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const ACCOUNTANT_SESSION_COOKIE = "zzp-accountant-session";

export interface CombinedSession {
  userId: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  onboardingCompleted: boolean;
  isAccountantSession: boolean;
  companyId?: string; // For accountant sessions
}

/**
 * Get any valid session (NextAuth or accountant session)
 * For use in middleware and server components
 */
export async function getAnyCombinedSession(
  request?: NextRequest
): Promise<CombinedSession | null> {
  // First, try to get NextAuth session
  if (request) {
    try {
      const token = await getToken({ 
        req: request, 
        secret: process.env.NEXTAUTH_SECRET 
      });
      
      if (token && token.id && token.email) {
        return {
          userId: token.id as string,
          email: token.email as string,
          role: (token.role as UserRole) || "COMPANY_ADMIN",
          emailVerified: Boolean(token.emailVerified),
          onboardingCompleted: Boolean(token.onboardingCompleted),
          isAccountantSession: false,
        };
      }
    } catch (error) {
      console.error("Error getting NextAuth token:", error);
    }
  }
  
  // Try to get accountant session
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ACCOUNTANT_SESSION_COOKIE)?.value;
    
    if (sessionToken) {
      const session = await prisma.accountantSession.findUnique({
        where: { sessionToken },
      });
      
      if (session && session.expiresAt > new Date()) {
        return {
          userId: session.userId,
          email: session.email,
          role: session.role,
          emailVerified: true, // Accountant sessions are pre-verified
          onboardingCompleted: true, // Accountants skip onboarding
          isAccountantSession: true,
          companyId: session.companyId,
        };
      }
    }
  } catch (error) {
    console.error("Error getting accountant session:", error);
  }
  
  return null;
}

/**
 * Check if a request has any valid session
 * Lightweight check for middleware
 */
export async function hasAnySession(request: NextRequest): Promise<boolean> {
  const session = await getAnyCombinedSession(request);
  return session !== null;
}

/**
 * Get the active company ID for the current session
 * For regular users, this is their userId
 * For accountant sessions, this is the companyId from the session
 */
export async function getSessionCompanyId(
  request?: NextRequest
): Promise<string | null> {
  const session = await getAnyCombinedSession(request);
  
  if (!session) {
    return null;
  }
  
  // For accountant sessions, use the companyId from the session
  if (session.isAccountantSession && session.companyId) {
    return session.companyId;
  }
  
  // For regular users, use their userId
  return session.userId;
}
