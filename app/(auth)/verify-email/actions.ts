"use server";

import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/email";

// Structured logging helper for verification events
// Always log verification events for debugging (server-side only, safe output)
function logVerification(event: string, details: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: `EMAIL_VERIFY_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

export async function verifyEmailToken(token: string) {
  try {
    // Validate token exists and normalize it
    if (!token || typeof token !== 'string') {
      logVerification("MISSING_TOKEN", {});
      return { success: false, message: "Geen token opgegeven." };
    }

    const cleanToken = token.trim();
    
    if (!cleanToken) {
      logVerification("EMPTY_TOKEN", {});
      return { success: false, message: "Geen token opgegeven." };
    }

    // Log token prefix for debugging (safe - only first 8 chars)
    const tokenPrefix = cleanToken.substring(0, 8);
    const hadWhitespace = token.length !== cleanToken.length;
    logVerification("ATTEMPT", { 
      tokenPrefix, 
      tokenLength: cleanToken.length,
      originalLength: token.length,
      hadWhitespace,
    });

    // First, find all non-expired tokens (this reduces the search space)
    const now = new Date();
    
    // Also count total tokens for diagnostics
    const totalTokenCount = await prisma.emailVerificationToken.count();
    const expiredTokenCount = await prisma.emailVerificationToken.count({
      where: { expiresAt: { lt: now } },
    });
    
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

    // Log details about found tokens (without exposing full hashes)
    const tokenInfo = tokens.map((t) => ({
      id: t.id,
      userId: t.userId,
      hashPrefix: t.token.substring(0, 10),
      hashLength: t.token.length,
      expiresAt: t.expiresAt.toISOString(),
      createdAt: t.createdAt.toISOString(),
    }));

    logVerification("TOKEN_LOOKUP", {
      totalTokensInDb: totalTokenCount,
      expiredTokens: expiredTokenCount,
      validTokensFound: tokens.length,
      now: now.toISOString(),
      tokens: tokenInfo,
    });

    if (tokens.length === 0) {
      logVerification("NO_VALID_TOKENS", {
        reason: totalTokenCount === 0 ? "no_tokens_exist" : "all_tokens_expired",
      });
      return { success: false, message: "Ongeldige of verlopen verificatielink." };
    }

    // Verify against all tokens in constant time to prevent timing attacks
    let matchedToken = null;
    let hasMatch = false;
    let comparisonCount = 0;
    
    for (const dbToken of tokens) {
      comparisonCount++;
      const isValid = await verifyToken(cleanToken, dbToken.token);
      // Always check all tokens (constant time) but only store the first match
      if (isValid && !hasMatch) {
        matchedToken = dbToken;
        hasMatch = true;
      }
    }

    logVerification("COMPARISON_COMPLETE", {
      tokensCompared: comparisonCount,
      matchFound: hasMatch,
    });

    if (!matchedToken) {
      logVerification("NO_MATCH", {
        reason: "token_hash_mismatch",
        tokensChecked: comparisonCount,
      });
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

    logVerification("SUCCESS", {
      userId: matchedToken.userId,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logVerification("ERROR", { error: errorMessage });
    console.error("Email verification failed:", error);
    return { success: false, message: "Er ging iets mis bij het verifiëren." };
  }
}
