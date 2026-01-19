/**
 * Accountant Session Management
 * 
 * Provides cookie-based session management for accountants who accept invites
 * without creating full user accounts. This allows accountants to access
 * company data without requiring NextAuth login.
 */

import "server-only";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import crypto from "crypto";
import { logAccountantSessionCreated } from "./security-audit";

const ACCOUNTANT_SESSION_COOKIE = "zzp-accountant-session";
const SESSION_EXPIRY_DAYS = 30; // 30 days
// Cookie path scoped to accountant portal only - prevents session confusion with ZZP dashboard
const ACCOUNTANT_COOKIE_PATH = "/accountant-portal";

export interface AccountantSessionData {
  sessionId: string;
  userId: string;
  email: string;
  companyId: string;
  role: UserRole;
  expiresAt: Date;
}

/**
 * Create a new accountant session
 * Called after successful invite acceptance
 */
export async function createAccountantSession(
  userId: string,
  email: string,
  companyId: string,
  role: UserRole
): Promise<AccountantSessionData> {
  // Generate secure session token
  const sessionToken = crypto.randomBytes(32).toString("hex");
  
  // Set expiry
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);
  
  // Create session in database
  const session = await prisma.accountantSession.create({
    data: {
      sessionToken,
      userId,
      email,
      companyId,
      role,
      expiresAt,
    },
  });
  
  // Set secure HTTP-only cookie - scoped to /accountant-portal to prevent session confusion with ZZP dashboard
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNTANT_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // seconds
    path: ACCOUNTANT_COOKIE_PATH,
  });
  
  // Log session creation for audit
  await logAccountantSessionCreated({
    userId,
    email,
    companyId,
    role,
  });
  
  return {
    sessionId: session.id,
    userId: session.userId,
    email: session.email,
    companyId: session.companyId,
    role: session.role,
    expiresAt: session.expiresAt,
  };
}

/**
 * Get the current accountant session if one exists
 * Returns null if no session or session is expired
 */
export async function getAccountantSession(): Promise<AccountantSessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ACCOUNTANT_SESSION_COOKIE)?.value;
    
    if (!sessionToken) {
      return null;
    }
    
    // Find session in database
    const session = await prisma.accountantSession.findUnique({
      where: { sessionToken },
    });
    
    if (!session) {
      // Clean up invalid cookie - structured log for invalid session
      console.log('[ACCOUNTANT_PORTAL_SESSION_INVALID]', {
        timestamp: new Date().toISOString(),
        reason: 'SESSION_NOT_FOUND',
      });
      // Delete cookie with the same path it was set with
      cookieStore.set(ACCOUNTANT_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: ACCOUNTANT_COOKIE_PATH,
      });
      return null;
    }
    
    // Check if expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session - structured log for expired session
      console.log('[ACCOUNTANT_PORTAL_SESSION_INVALID]', {
        timestamp: new Date().toISOString(),
        reason: 'SESSION_EXPIRED',
        userId: session.userId.slice(-6),
        expiredAt: session.expiresAt.toISOString(),
      });
      await prisma.accountantSession.delete({
        where: { id: session.id },
      });
      // Delete cookie with the same path it was set with
      cookieStore.set(ACCOUNTANT_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: ACCOUNTANT_COOKIE_PATH,
      });
      return null;
    }
    
    // Update last access time
    await prisma.accountantSession.update({
      where: { id: session.id },
      data: { lastAccessAt: new Date() },
    });
    
    // Structured log for valid session
    console.log('[ACCOUNTANT_PORTAL_SESSION_VALID]', {
      timestamp: new Date().toISOString(),
      userId: session.userId.slice(-6),
      companyId: session.companyId.slice(-6),
      role: session.role,
    });
    
    return {
      sessionId: session.id,
      userId: session.userId,
      email: session.email,
      companyId: session.companyId,
      role: session.role,
      expiresAt: session.expiresAt,
    };
  } catch (error) {
    console.error('[ACCOUNTANT_PORTAL_SESSION_INVALID]', {
      timestamp: new Date().toISOString(),
      reason: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Require an accountant session - throw if not present
 */
export async function requireAccountantSession(): Promise<AccountantSessionData> {
  const session = await getAccountantSession();
  
  if (!session) {
    throw new Error("Geen accountant sessie gevonden. Gebruik de uitnodigingslink.");
  }
  
  return session;
}

/**
 * Delete the current accountant session (logout)
 * Must use the same Path attribute as when the cookie was set
 */
export async function deleteAccountantSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ACCOUNTANT_SESSION_COOKIE)?.value;
    
    if (sessionToken) {
      // Delete from database
      await prisma.accountantSession.deleteMany({
        where: { sessionToken },
      });
    }
    
    // Delete cookie with the same path it was set with
    cookieStore.set(ACCOUNTANT_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0, // Expire immediately
      path: ACCOUNTANT_COOKIE_PATH,
    });
  } catch (error) {
    console.error("Error deleting accountant session:", error);
  }
}

/**
 * Clean up expired sessions (should be called periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await prisma.accountantSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    
    return result.count;
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error);
    return 0;
  }
}

/**
 * Verify accountant has access to a specific company
 */
export async function verifyAccountantCompanyAccess(
  userId: string,
  companyId: string
): Promise<boolean> {
  try {
    const member = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
    
    return !!member;
  } catch (error) {
    console.error("Error verifying company access:", error);
    return false;
  }
}

/**
 * Clear accountant session cookie when a ZZP/COMPANY_ADMIN user logs in via NextAuth
 * This prevents session confusion where an accountant cookie could affect ZZP user experience.
 * 
 * Note: Since the cookie is path-scoped to /accountant-portal, it won't affect most ZZP pages,
 * but this provides an extra safety measure to clean up any stale sessions.
 */
export async function clearAccountantSessionOnZZPLogin(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ACCOUNTANT_SESSION_COOKIE)?.value;
    
    if (sessionToken) {
      // Log that we're clearing an accountant session due to ZZP login
      console.log('[ACCOUNTANT_SESSION_CLEARED_ON_ZZP_LOGIN]', {
        timestamp: new Date().toISOString(),
      });
      
      // Delete from database
      await prisma.accountantSession.deleteMany({
        where: { sessionToken },
      });
      
      // Clear the cookie with the same path it was set with
      cookieStore.set(ACCOUNTANT_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: ACCOUNTANT_COOKIE_PATH,
      });
    }
  } catch (error) {
    // Don't throw - this is a cleanup operation
    console.error("Error clearing accountant session on ZZP login:", error);
  }
}

/**
 * Export the cookie path constant for use in other modules
 */
export const ACCOUNTANT_SESSION_COOKIE_PATH = ACCOUNTANT_COOKIE_PATH;
