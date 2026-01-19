const DEV_FALLBACK_SECRET = "zzp-hub-dev-secret";

let hasWarnedAboutSecret = false;

export function resolveAuthSecret(): string | undefined {
  const explicitSecret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;

  if (explicitSecret) {
    return explicitSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    if (!hasWarnedAboutSecret) {
      console.warn("[AUTH] NEXTAUTH_SECRET missing - using development fallback secret");
      hasWarnedAboutSecret = true;
    }
    return DEV_FALLBACK_SECRET;
  }

  if (!hasWarnedAboutSecret) {
    console.error("[AUTH] NEXTAUTH_SECRET is missing; authentication will fail until it is set");
    hasWarnedAboutSecret = true;
  }

  return undefined;
}
