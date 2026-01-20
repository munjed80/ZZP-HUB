"use server";

import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema, type RegisterInput } from "./schema";
import { generateVerificationToken, hashToken, sendEmail } from "@/lib/email";
import VerificationEmail from "@/components/emails/VerificationEmail";
import { getPublicSupportEmail } from "@/lib/publicConfig";

export async function registerCompany(values: RegisterInput) {
  const data = registerSchema.parse(values);

  try {
    const shouldLogAuth = process.env.AUTH_DEBUG === "true" || process.env.NODE_ENV !== "production";
    if (shouldLogAuth) {
      console.log("Register attempt", { emailMasked: data.email.replace(/(.).+(@.*)/, "$1***$2") });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      return { success: false, message: "E-mailadres is al in gebruik." };
    }

    const password = await bcrypt.hash(data.password, 10);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const hashedToken = await hashToken(verificationToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with emailVerified=false
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password,
        naam: data.bedrijfsnaam,
        role: data.role === "ACCOUNTANT" ? UserRole.ACCOUNTANT : UserRole.COMPANY_ADMIN,
        emailVerified: false,
        emailVerificationSentAt: new Date(),
      },
    });
    
    // Create verification token record
    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    if (shouldLogAuth) {
      console.log("Verification link (DEV):", verificationUrl);
    }
    
    const emailResult = await sendEmail({
      to: data.email,
      subject: 'Verifieer je e-mailadres - ZZP Hub',
      react: VerificationEmail({
        verificationUrl,
        userName: data.bedrijfsnaam,
      }),
    });

    if (!emailResult.success) {
      console.error("Verification email send failed", {
        email: data.email,
        error: emailResult.error,
      });
      // Use imported support email for user-friendly error
      const supportEmail = getPublicSupportEmail();
      const errorMessage = emailResult.error?.message || "Unknown error";
      return { 
        success: false, 
        message: `We konden de verificatie-e-mail niet verzenden: ${errorMessage}. Neem contact op met support via ${supportEmail}.`
      };
    }

    if (shouldLogAuth) {
      console.log("Register success - verification email sent", { emailMasked: data.email.replace(/(.).+(@.*)/, "$1***$2") });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Register failed", error);
    return { success: false, message: "Er ging iets mis. Probeer opnieuw." };
  }
}
