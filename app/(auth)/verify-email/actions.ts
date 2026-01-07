"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/email";

export async function verifyEmailToken(token: string) {
  try {
    if (!token) {
      return { success: false, message: "Geen token opgegeven." };
    }

    // Find all verification tokens and check which one matches
    const tokens = await prisma.emailVerificationToken.findMany({
      include: {
        user: true,
      },
    });

    let matchedToken = null;
    for (const dbToken of tokens) {
      const isValid = await verifyToken(token, dbToken.token);
      if (isValid) {
        matchedToken = dbToken;
        break;
      }
    }

    if (!matchedToken) {
      return { success: false, message: "Ongeldige of verlopen verificatielink." };
    }

    // Check if token is expired
    if (matchedToken.expiresAt < new Date()) {
      await prisma.emailVerificationToken.delete({
        where: { id: matchedToken.id },
      });
      return { success: false, message: "Deze verificatielink is verlopen." };
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: {
        emailVerified: true,
      },
    });

    // Delete the used token
    await prisma.emailVerificationToken.delete({
      where: { id: matchedToken.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Email verification failed:", error);
    return { success: false, message: "Er ging iets mis bij het verifiëren." };
  }
}
