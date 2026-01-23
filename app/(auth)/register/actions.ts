"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "./schema";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { getPublicSupportEmail } from "@/lib/publicConfig";
import { APP_BASE_URL } from "@/config/emails";

// Debug flag for enhanced email verification logging
const DEBUG_EMAIL_VERIFY = process.env.DEBUG_EMAIL_VERIFY === "1";

// Structured logging helper for registration events
// Always log registration events for debugging (server-side only, safe output)
function logRegistration(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `REGISTER_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

// Enhanced debug logging for token creation (only when DEBUG_EMAIL_VERIFY=1)
function debugLogTokenCreation(details: Record<string, unknown>) {
  if (!DEBUG_EMAIL_VERIFY) return;
  console.log(JSON.stringify({
    event: "DEBUG_TOKEN_CREATE",
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

export async function registerCompany(values: RegisterInput) {
  const data = registerSchema.parse(values);

  try {
    const emailMasked = data.email.replace(/(.).+(@.*)/, "$1***$2");
    logRegistration("ATTEMPT", { emailMasked });

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      logRegistration("USER_EXISTS", { emailMasked });
      return { success: false, message: "E-mailadres is al in gebruik." };
    }

    const password = await bcrypt.hash(data.password, 10);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = new Date();
    const expiresAt = new Date(now.getTime() + TTL_MS);

    // Log token generation (prefix only for security)
    logRegistration("TOKEN_GENERATED", {
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
      emailMasked: data.email.replace(/(.).+(@.*)/, "$1***$2"),
      tokenHashPrefix: hashedToken.substring(0, 10),
    });

    // Create user with emailVerified=false
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        naam: data.bedrijfsnaam,
        role: UserRole.COMPANY_ADMIN,
        emailVerified: false,
        emailVerificationSentAt: new Date(),
      },
    });

    logRegistration("USER_CREATED", { userId: user.id, emailMasked });
    
    // Create verification token record
    const tokenRecord = await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    logRegistration("TOKEN_STORED", {
      tokenRecordId: tokenRecord.id,
      userId: user.id,
      expiresAt: expiresAt.toISOString(),
    });

    // Send verification email
    const baseUrl = APP_BASE_URL;
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    logRegistration("EMAIL_SENDING", {
      baseUrl,
      urlPreview: `${baseUrl}/verify-email?token=${verificationToken.substring(0, 8)}...`,
    });
    
    const emailResult = await sendEmail({
      to: data.email,
      subject: 'ZZP Hub – Email verification',
      react: VerificationEmail({
        verificationUrl,
        userName: data.bedrijfsnaam,
      }),
    });

    if (!emailResult.success) {
      logRegistration("EMAIL_FAILED", {
        emailMasked,
        error: emailResult.error?.message,
      });
      // Use imported support email for user-friendly error
      const supportEmail = getPublicSupportEmail();
      const errorMessage = emailResult.error?.message || "Unknown error";
      return { 
        success: false, 
        message: `We konden de verificatie-e-mail niet verzenden: ${errorMessage}. Neem contact op met support via ${supportEmail}.`
      };
    }

    logRegistration("SUCCESS", { emailMasked, messageId: emailResult.messageId });
    
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logRegistration("ERROR", { error: errorMessage });
    console.error("Register failed", error);
    return { success: false, message: "Er ging iets mis. Probeer opnieuw." };
  }
}
