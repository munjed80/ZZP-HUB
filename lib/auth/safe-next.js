/**
 * Safe Next URL Helper
 * 
 * Prevents redirect loops by ensuring `next` parameters are:
 * 1. Relative paths only (no absolute URLs, protocols, or XSS attempts)
 * 2. Free of nested `next` parameters
 * 3. Not pointing to auth routes (which would cause loops)
 * 4. Reasonable length (< 512 chars)
 * 
 * This helper is used by BOTH middleware and login/redirect utilities
 * to maintain consistency and prevent exponentially growing redirect chains.
 */

const MAX_NEXT_URL_LENGTH = 512;

// Auth routes that should not be used as redirect targets (would cause loops)
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/accountant-invite',
  '/accountant-verify',
];

/**
 * Log when a next URL is blocked for security/loop prevention
 */
function logBlockedNextUrl(reason, length) {
  const shouldLogAuth = process.env.AUTH_DEBUG === 'true' || process.env.NODE_ENV !== 'production';
  if (shouldLogAuth || process.env.SECURITY_DEBUG === 'true') {
    console.log('[NEXT_URL_BLOCKED]', {
      reason,
      length,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Strip any nested `next` query parameters from a URL path
 * Example: "/setup?next=/dashboard" -> "/setup"
 */
function stripNestedNext(path) {
  try {
    const url = new URL(path, 'http://dummy.local');
    url.searchParams.delete('next');
    url.searchParams.delete('callbackUrl');
    
    // Return pathname + remaining search params
    const search = url.search;
    return `${url.pathname}${search}`;
  } catch {
    // If URL parsing fails, try simple string replacement
    return path.replace(/[?&]next=[^&]*/, '').replace(/[?&]callbackUrl=[^&]*/, '');
  }
}

/**
 * Validate and sanitize a `next` redirect URL
 * 
 * @param {string | null | undefined} next - The requested next URL (from query param or user input)
 * @param {string} fallback - Default path to use if next is invalid
 * @returns {string} A safe, validated redirect path
 */
export function safeNextUrl(next, fallback) {
  // Missing or empty next -> use fallback
  if (!next || typeof next !== 'string' || next.trim() === '') {
    return fallback;
  }

  const trimmed = next.trim();

  // Too long -> reject (prevents DOS via huge URLs)
  if (trimmed.length > MAX_NEXT_URL_LENGTH) {
    logBlockedNextUrl('URL_TOO_LONG', trimmed.length);
    return fallback;
  }

  // Decode once (but not recursively, to prevent double-encoding attacks)
  let decoded;
  try {
    decoded = decodeURIComponent(trimmed);
  } catch {
    logBlockedNextUrl('DECODE_ERROR', trimmed.length);
    return fallback;
  }

  // Must be a relative path starting with /
  if (!decoded.startsWith('/')) {
    logBlockedNextUrl('NOT_RELATIVE', decoded.length);
    return fallback;
  }

  // Block protocol-based URLs (http:, https:, javascript:, data:, etc.)
  if (decoded.includes(':')) {
    logBlockedNextUrl('CONTAINS_PROTOCOL', decoded.length);
    return fallback;
  }

  // Block double-slash (//example.com style protocol-relative URLs)
  if (decoded.startsWith('//')) {
    logBlockedNextUrl('PROTOCOL_RELATIVE', decoded.length);
    return fallback;
  }

  // Block auth routes (would cause redirect loops)
  const pathWithoutQuery = decoded.split('?')[0];
  for (const authRoute of AUTH_ROUTES) {
    if (pathWithoutQuery === authRoute || pathWithoutQuery.startsWith(`${authRoute}/`)) {
      logBlockedNextUrl('AUTH_ROUTE', decoded.length);
      return fallback;
    }
  }

  // Strip any nested `next` or `callbackUrl` parameters to prevent loop
  const cleaned = stripNestedNext(decoded);

  return cleaned;
}
