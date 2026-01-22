"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { APP_BASE_URL } from "@/config/emails";

const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

// Structured logging helper for resend events
function logResend(event: string, details: Record<string, unknown>) {
  const shouldLog = process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";
  if (shouldLog) {
    console.log(JSON.stringify({
      event: `RESEND_VERIFY_${event}`,
      timestamp: new Date().toISOString(),
      ...details,
    }));
  }
}

export async function resendVerificationEmail() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.email) {
      logResend("NO_SESSION", {});
      return { success: false, message: "Je moet ingelogd zijn om een nieuwe verificatie-e-mail aan te vragen." };
    }

    const emailMasked = session.user.email.replace(/(.).+(@.*)/, "$1***$2");
    logResend("ATTEMPT", { emailMasked });

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      logResend("USER_NOT_FOUND", { emailMasked });
      return { success: false, message: "Gebruiker niet gevonden." };
    }

    if (user.emailVerified) {
      logResend("ALREADY_VERIFIED", { userId: user.id });
      return { success: false, message: "Je e-mailadres is al geverifieerd." };
    }

    // Check cooldown
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

    // Generate new token
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    logResend("TOKEN_GENERATED", {
      tokenPrefix: verificationToken.substring(0, 8),
      tokenLength: verificationToken.length,
      hashPrefix: hashedToken.substring(0, 10),
      expiresAt: expiresAt.toISOString(),
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
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logResend("ERROR", { error: errorMessage });
    console.error("Failed to resend verification email:", error);
    return { success: false, message: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
