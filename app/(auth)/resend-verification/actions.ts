"use server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";

const RESEND_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

export async function resendVerificationEmail() {
  try {
    const session = await getServerAuthSession();
    
    if (!session?.user?.email) {
      return { success: false, message: "Je moet ingelogd zijn om een nieuwe verificatie-e-mail aan te vragen." };
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return { success: false, message: "Gebruiker niet gevonden." };
    }

    if (user.emailVerified) {
      return { success: false, message: "Je e-mailadres is al geverifieerd." };
    }

    // Check cooldown
    if (user.emailVerificationSentAt) {
      const timeSinceLastSend = Date.now() - user.emailVerificationSentAt.getTime();
      if (timeSinceLastSend < RESEND_COOLDOWN_MS) {
        const secondsLeft = Math.ceil((RESEND_COOLDOWN_MS - timeSinceLastSend) / 1000);
        return { 
          success: false, 
          message: `Wacht nog ${secondsLeft} seconden voordat je opnieuw een e-mail aanvraagt.` 
        };
      }
    }

    // Delete old tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new token
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new verification token
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Update last sent timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationSentAt: new Date() },
    });

    // Send verification email
    const baseUrl = process.env.APP_BASE_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    const shouldLogAuth = process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";
    if (shouldLogAuth) {
      console.log("Verification link (DEV):", verificationUrl);
    }
    
    await sendEmail({
      to: user.email,
      subject: 'Verifieer je e-mailadres - ZZP-HUB',
      react: VerificationEmail({
        verificationUrl,
        userName: user.naam || undefined,
      }),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to resend verification email:", error);
    return { success: false, message: "Er ging iets mis. Probeer het later opnieuw." };
  }
}
