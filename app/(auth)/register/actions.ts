"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "./schema";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { getPublicSupportEmail } from "@/lib/publicConfig";
import { APP_BASE_URL } from "@/config/emails";

// Structured logging helper for registration events
function logRegistration(event: string, details: Record<string, unknown>) {
  const shouldLog = process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";
  if (shouldLog) {
    console.log(JSON.stringify({
      event: `REGISTER_${event}`,
      timestamp: new Date().toISOString(),
      ...details,
    }));
  }
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Log token generation (prefix only for security)
    logRegistration("TOKEN_GENERATED", {
      tokenPrefix: verificationToken.substring(0, 8),
      tokenLength: verificationToken.length,
      hashPrefix: hashedToken.substring(0, 10),
      expiresAt: expiresAt.toISOString(),
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
