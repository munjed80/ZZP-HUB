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
import { logAccountantSessionCreated, logSecurityEvent } from "./security-audit";

const ACCOUNTANT_SESSION_COOKIE = "zzp-accountant-session";
const SESSION_EXPIRY_DAYS = 30; // 30 days

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
  
  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(ACCOUNTANT_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60, // seconds
    path: "/",
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
      // Clean up invalid cookie
      cookieStore.delete(ACCOUNTANT_SESSION_COOKIE);
      return null;
    }
    
    // Check if expired
    if (session.expiresAt < new Date()) {
      // Clean up expired session
      await prisma.accountantSession.delete({
        where: { id: session.id },
      });
      cookieStore.delete(ACCOUNTANT_SESSION_COOKIE);
      return null;
    }
    
    // Update last access time
    await prisma.accountantSession.update({
      where: { id: session.id },
      data: { lastAccessAt: new Date() },
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
    console.error("Error getting accountant session:", error);
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
 */
export async function deleteAccountantSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ACCOUNTANT_SESSION_COOKIE)?.value;
    
    if (sessionToken) {
      // Get session details for logging, then delete in one operation
      const session = await prisma.accountantSession.findUnique({
        where: { sessionToken },
      });
      
      if (session) {
        // Delete from database
        await prisma.accountantSession.delete({
          where: { sessionToken },
        });
        
        // Log session deletion for audit
        await logSecurityEvent({
          userId: session.userId,
          eventType: "ACCOUNTANT_SESSION_DELETED",
          companyId: session.companyId,
          targetEmail: session.email,
          metadata: { role: session.role },
        });
      }
    }
    
    // Delete cookie
    cookieStore.delete(ACCOUNTANT_SESSION_COOKIE);
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
