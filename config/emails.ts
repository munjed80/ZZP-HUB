/**
 * Single source of truth for all email addresses used in the application.
 * 
 * Server-side components can override via environment variables:
 * - SUPPORT_EMAIL (server) or NEXT_PUBLIC_SUPPORT_EMAIL (client)
 * - NO_REPLY_EMAIL (server only)
 * 
 * Defaults are matrixtop.com - NEVER use resend.dev or zzp-hub.nl
 */

// Hard defaults - matrixtop.com addresses
export const SUPPORT_EMAIL = "support@matrixtop.com";
export const NO_REPLY_EMAIL = "no-reply@matrixtop.com";
export const FROM_EMAIL = `ZZP Hub <${NO_REPLY_EMAIL}>`;

/**
 * Get support email with optional server-side override
 * Server: Can be overridden via SUPPORT_EMAIL env var
 */
export function getSupportEmail(): string {
  if (typeof window === 'undefined') {
    // Server-side: check env
    return process.env.SUPPORT_EMAIL || SUPPORT_EMAIL;
  }
  // Client-side: use default (public config will handle client override)
  return SUPPORT_EMAIL;
}

/**
 * Get no-reply email with optional server-side override
 * Server-only: Can be overridden via NO_REPLY_EMAIL env var
 */
export function getNoReplyEmail(): string {
  if (typeof window !== 'undefined') {
    throw new Error('getNoReplyEmail() is server-side only');
  }
  return process.env.NO_REPLY_EMAIL || NO_REPLY_EMAIL;
}

/**
 * Get FROM email address for sending emails
 * Server-only: Uses NO_REPLY_EMAIL (with optional override)
 */
export function getFromEmail(): string {
  if (typeof window !== 'undefined') {
    throw new Error('getFromEmail() is server-side only');
  }
  const noReply = getNoReplyEmail();
  return `ZZP Hub <${noReply}>`;
}
