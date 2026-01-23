"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { APP_BASE_URL } from "@/config/emails";
import { z } from "zod";

const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

// Debug flag for enhanced email verification logging
const DEBUG_EMAIL_VERIFY = process.env.DEBUG_EMAIL_VERIFY === "1";

// Structured logging helper for resend events
// Always log resend events for debugging (server-side only, safe output)
function logResend(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `RESEND_VERIFY_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

// Enhanced debug logging for token creation (only when DEBUG_EMAIL_VERIFY=1)
function debugLogTokenCreation(details: Record<string, unknown>) {
  if (!DEBUG_EMAIL_VERIFY) return;
  console.log(JSON.stringify({
    event: "DEBUG_RESEND_TOKEN_CREATE",
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

// Helper function to mask email for safe logging
function maskEmail(email: string): string {
  return email.replace(/(.).+(@.*)/, "$1***$2");
}

// Schema for public resend verification (email only)
const publicResendSchema = z.object({
  email: z.string().email("Ongeldig e-mailadres"),
});

/**
 * Internal helper to create a token and send verification email
 * Used by both session-based and email-based resend functions
 */
async function createAndSendVerificationToken(user: {
  id: string;
  email: string;
  naam: string | null;
  emailVerified: boolean;
  emailVerificationSentAt: Date | null;
}): Promise<{ success: boolean; message?: string }> {
  const emailMasked = maskEmail(user.email);

  // Check if already verified (idempotent - return success)
  if (user.emailVerified) {
    logResend("ALREADY_VERIFIED", { userId: user.id });
    return { success: true, message: "Je e-mailadres is al geverifieerd." };
  }

  // Check cooldown using emailVerificationSentAt
  if (user.emailVerificationSentAt) {
    const timeSinceLastSend = Date.now() - user.emailVerificationSentAt.getTime();
    if (timeSinceLastSend < RESEND_COOLDOWN_MS) {
      const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSend) / 1000);
      logResend("COOLDOWN", { secondsLeft });
      return { 
        success: false, 
        message: `Wacht nog ${secondsLeft} seconden voordat je opnieuw een e-mail aanvraagt.` 
      };
    }
  }

  // Delete old tokens for this user
  const deletedTokens = await prisma.emailVerificationToken.deleteMany({
    where: { userId: user.id },
  });

  logResend("OLD_TOKENS_DELETED", { count: deletedTokens.count });

  // Generate new token with correct expiration
  const verificationToken = generateVerificationToken();
  const hashedToken = await hashToken(verificationToken);
  const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TTL_MS);

  logResend("TOKEN_GENERATED", {
    tokenPrefix: verificationToken.substring(0, 8),
    tokenLength: verificationToken.length,
    hashPrefix: hashedToken.substring(0, 10),
    expiresAt: expiresAt.toISOString(),
  });

  // Enhanced debug logging for diagnosing expiration issues
  debugLogTokenCreation({
    nowIso: now.toISOString(),
    nowTimestamp: now.getTime(),
    expiresAtIso: expiresAt.toISOString(),
    expiresAtTimestamp: expiresAt.getTime(),
    ttlMs: TTL_MS,
    ttlSeconds: TTL_MS / 1000,
    diffMs: expiresAt.getTime() - now.getTime(),
    emailMasked,
    tokenHashPrefix: hashedToken.substring(0, 10),
  });

  // Create new verification token
  const tokenRecord = await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      token: hashedToken,
      expiresAt,
    },
  });

  logResend("TOKEN_STORED", {
    tokenRecordId: tokenRecord.id,
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  // Update last sent timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerificationSentAt: new Date() },
  });

  // Send verification email
  const baseUrl = APP_BASE_URL;
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  
  logResend("EMAIL_SENDING", {
    baseUrl,
    urlPreview: `${baseUrl}/verify-email?token=${verificationToken.substring(0, 8)}...`,
  });
  
  const emailResult = await sendEmail({
    to: user.email,
    subject: 'ZZP Hub – Email verification',
    react: VerificationEmail({
      verificationUrl,
      userName: user.naam || undefined,
    }),
  });

  if (!emailResult.success) {
    logResend("EMAIL_FAILED", {
      userId: user.id,
      emailMasked,
      error: emailResult.error?.message,
    });
    const errorMessage = emailResult.error?.message || "Unknown error";
    return { 
      success: false, 
      message: `Het versturen van de verificatie-e-mail is mislukt: ${errorMessage}. Probeer het later opnieuw.`
    };
  }

  logResend("SUCCESS", { userId: user.id, emailMasked, messageId: emailResult.messageId });

  return { success: true };
}

/**
 * Resend verification email for logged-in users (session-based)
 * Kept for backwards compatibility with existing UI flows
 */
export async function resendVerificationEmail() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.email) {
      logResend("NO_SESSION", {});
      return { success: false, message: "Je moet ingelogd zijn om een nieuwe verificatie-e-mail aan te vragen." };
    }

    const emailMasked = maskEmail(session.user.email);
    logResend("SESSION_ATTEMPT", { emailMasked });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      logResend("USER_NOT_FOUND", { emailMasked });
      return { success: false, message: "Gebruiker niet gevonden." };
    }

    return await createAndSendVerificationToken(user);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logResend("ERROR", { error: errorMessage });
    console.error("Failed to resend verification email:", error);
    return { success: false, message: "Er ging iets mis. Probeer het later opnieuw." };
  }
}

/**
 * Public resend verification email endpoint (email-based, no session required)
 * This allows users who haven't logged in to request a new verification email
 * 
 * Security:
 * - Rate limited by emailVerificationSentAt (1 minute cooldown per user)
 * - Does not reveal whether email exists (always returns success-like message)
 * - Validates email format
 */
export async function resendVerificationEmailPublic(email: string) {
  try {
    // Validate email format
    const result = publicResendSchema.safeParse({ email });
    if (!result.success) {
      logResend("PUBLIC_INVALID_EMAIL", {});
      return { success: false, message: "Ongeldig e-mailadres." };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailMasked = maskEmail(normalizedEmail);
    logResend("PUBLIC_ATTEMPT", { emailMasked });

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // For security, don't reveal if email doesn't exist
    // Return a generic success message in all cases
    if (!user) {
      logResend("PUBLIC_USER_NOT_FOUND", { emailMasked });
      // Return success to avoid email enumeration
      return { 
        success: true, 
        message: "Als dit e-mailadres bij ons bekend is, ontvang je binnenkort een verificatie-e-mail." 
      };
    }

    const sendResult = await createAndSendVerificationToken(user);
    
    // Always return success-like message to avoid email enumeration
    // (except for cooldown which is rate limiting, not enumeration)
    if (!sendResult.success && sendResult.message?.includes("Wacht nog")) {
      return sendResult; // Show cooldown message
    }

    return { 
      success: true, 
      message: sendResult.success && sendResult.message 
        ? sendResult.message  // Already verified message
        : "Als dit e-mailadres bij ons bekend is, ontvang je binnenkort een verificatie-e-mail." 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logResend("PUBLIC_ERROR", { error: errorMessage });
    console.error("Failed to resend verification email (public):", error);
    return { success: false, message: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
