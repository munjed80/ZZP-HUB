"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/email";

export async function verifyEmailToken(token: string) {
  try {
    if (!token) {
      return { success: false, message: "Geen token opgegeven." };
    }

    // First, find all non-expired tokens (this reduces the search space)
    const now = new Date();
    const tokens = await prisma.emailVerificationToken.findMany({
      where: {
        expiresAt: {
          gte: now,
        },
      },
      include: {
        user: true,
      },
    });

    if (tokens.length === 0) {
      return { success: false, message: "Ongeldige of verlopen verificatielink." };
    }

    // Verify against all tokens in constant time to prevent timing attacks
    let matchedToken = null;
    let hasMatch = false;
    
    for (const dbToken of tokens) {
      const isValid = await verifyToken(token, dbToken.token);
      // Always check all tokens (constant time) but only store the first match
      if (isValid && !hasMatch) {
        matchedToken = dbToken;
        hasMatch = true;
      }
    }

    if (!matchedToken) {
      return { success: false, message: "Ongeldige of verlopen verificatielink." };
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
