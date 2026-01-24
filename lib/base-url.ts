const FALLBACK_LOCAL_URL = "http://localhost:3000";
// Production fallback URL - used when env vars are missing or invalid in production
const PRODUCTION_FALLBACK_URL = "https://zzpershub.nl";

// Patterns that indicate non-production URLs (should only be used in development)
const NON_PRODUCTION_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /:\d+$/, // URLs with any port (e.g., :80, :443, :3000, :8080)
];

function sanitize(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Check if a URL looks like a non-production URL (localhost, 0.0.0.0, or has a port).
 */
export function isNonProductionUrl(url: string): boolean {
  return NON_PRODUCTION_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Check if a URL uses https protocol.
 */
function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Structured logging for base URL events.
 */
function logBaseUrlEvent(event: string, details: Record<string, unknown>): void {
  console.log(JSON.stringify({
    event: `BASE_URL_${event}`,
    timestamp: new Date().toISOString(),
    ...details,
  }));
}

/**
 * Log a warning when base URL has issues in production.
 */
function logBaseUrlWarning(reason: string, url?: string): void {
  if (process.env.NODE_ENV === "production") {
    // Only log the domain/host part for security (avoid exposing full URL/paths)
    let domain = "unknown";
    if (url) {
      try {
        const parsed = new URL(url);
        domain = parsed.host;
      } catch {
        domain = "unparseable";
      }
    }
    console.warn(`[BASE_URL_WARNING] ${reason}`, {
      domain,
      timestamp: new Date().toISOString(),
      hint: "Set NEXT_PUBLIC_APP_URL or APP_URL environment variable in deployment",
    });
  }
}

export function getAppBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (envUrl) {
    const sanitized = sanitize(envUrl);
    
    // In production, warn if the configured URL looks like a dev URL
    if (process.env.NODE_ENV === "production" && isNonProductionUrl(sanitized)) {
      logBaseUrlWarning("Configured URL looks like a development URL", sanitized);
    }
    
    return sanitized;
  }

  // On the client side, use the browser's origin
  if (typeof window !== "undefined" && window.location.origin) {
    return sanitize(window.location.origin);
  }

  // In production without a configured URL, this is a critical misconfiguration
  if (process.env.NODE_ENV === "production") {
    logBaseUrlWarning("No APP_URL configured in production, falling back to localhost");
  }

  return FALLBACK_LOCAL_URL;
}

/**
 * Get a validated base URL for server-side redirects.
 * 
 * This function ensures the returned URL is safe for redirects by:
 * 1. Preferring env vars (NEXT_PUBLIC_APP_URL, APP_URL, NEXTAUTH_URL)
 * 2. In production: validating the URL is https and not a dev URL (localhost/0.0.0.0)
 * 3. Falling back to https://zzpershub.nl in production if validation fails
 * 4. Falling back to localhost in development
 * 
 * IMPORTANT: Use this function for server-side redirects in Route Handlers.
 * NEVER use request.url or request.nextUrl.origin for redirect base URLs
 * as these can be spoofed on mobile (iOS/Capacitor) or via proxy headers.
 */
export function getSecureAppBaseUrl(): string {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  const isProduction = process.env.NODE_ENV === "production";

  if (envUrl) {
    const sanitized = sanitize(envUrl);
    
    // In production, validate the URL is secure and not a dev URL
    if (isProduction) {
      const isSecure = isHttpsUrl(sanitized);
      const isDevUrl = isNonProductionUrl(sanitized);
      
      if (!isSecure || isDevUrl) {
        // Only log when validation fails - this is a misconfiguration
        logBaseUrlEvent("VALIDATION_FAILED", {
          reason: !isSecure ? "not_https" : "non_production_url",
          configuredUrl: sanitized,
          fallbackUrl: PRODUCTION_FALLBACK_URL,
        });
        // Fall back to production URL
        return PRODUCTION_FALLBACK_URL;
      }
    }
    
    return sanitized;
  }

  // In production without a configured URL, use production fallback
  if (isProduction) {
    // Only log the first time this happens (warning level)
    logBaseUrlEvent("NO_ENV_URL_FALLBACK", {
      fallbackUrl: PRODUCTION_FALLBACK_URL,
    });
    return PRODUCTION_FALLBACK_URL;
  }

  // In development, fall back to localhost
  return FALLBACK_LOCAL_URL;
}

export function buildAbsoluteUrl(path: string): string {
  try {
    const candidate = new URL(path);
    if (candidate.protocol === "http:" || candidate.protocol === "https:") {
      return candidate.toString();
    }
    return path;
  } catch {
    // not an absolute URL, continue
  }

  const baseUrl = getAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

/**
 * Build an absolute URL using the secure base URL for server-side redirects.
 * Use this in Route Handlers for redirect URLs.
 */
export function buildSecureRedirectUrl(path: string): string {
  const baseUrl = getSecureAppBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const fullUrl = `${baseUrl}${normalizedPath}`;
  
  return fullUrl;
}
