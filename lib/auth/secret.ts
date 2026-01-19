const DEFAULT_DEV_SECRET_SEED = "http://localhost:3000";
const HASH_MULTIPLIER = 31;

function deriveDevFallbackSecret(): string {
  const seed =
    process.env.AUTH_DEV_SECRET ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL ||
    DEFAULT_DEV_SECRET_SEED;

  // Simple deterministic string hash (inspired by the classic 31x hash) to avoid
  // a hardcoded dev secret while keeping middleware and API aligned
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * HASH_MULTIPLIER + seed.charCodeAt(i)) | 0; // force 32-bit int to avoid overflow
  }

  return `dev-${Math.abs(hash)}-zzp-hub`;
}

const DEV_FALLBACK_SECRET = deriveDevFallbackSecret();

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
