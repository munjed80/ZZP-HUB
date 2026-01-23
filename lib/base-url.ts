const FALLBACK_LOCAL_URL = "http://localhost:3000";

// Patterns that indicate non-production URLs (should only be used in development)
const NON_PRODUCTION_PATTERNS = [
  /localhost/i,
  /127\.0\.0\.1/,
  /0\.0\.0\.0/,
  /:\d{4,5}$/, // URLs with ports like :3000, :8080
];

function sanitize(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Check if a URL looks like a non-production URL (localhost, 0.0.0.0, or has a port).
 */
function isNonProductionUrl(url: string): boolean {
  return NON_PRODUCTION_PATTERNS.some((pattern) => pattern.test(url));
}

/**
 * Log a warning when base URL has issues in production.
 */
function logBaseUrlWarning(reason: string, url?: string): void {
  if (process.env.NODE_ENV === "production") {
    console.warn(`[BASE_URL_WARNING] ${reason}`, {
      url: url?.substring(0, 50),
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
