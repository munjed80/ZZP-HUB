/**
 * Single source of truth for all email addresses used in the application.
 *
 * Defaults are matrixtop.com - NEVER use resend.dev or zzp-hub.nl
 */

// Hard defaults - matrixtop.com addresses
export const SUPPORT_EMAIL = "support@matrixtop.com";
export const NO_REPLY_EMAIL = "no-reply@matrixtop.com";
export const FROM_EMAIL = `ZZP Hub <${NO_REPLY_EMAIL}>`;

/**
 * Validate RFC-compliant "Name <email@domain>" format
 * Ensures from address has proper format to avoid email delivery issues
 * @throws Error if format is invalid
 */
export function validateFromEmail(email: string): void {
  // Check for required pattern: "Name <email@domain>"
  if (!email.includes('<') || !email.includes('>')) {
    if (!email.includes('@')) {
      console.error("INVALID_FROM_EMAIL", { email });
    }
    throw new Error(`Invalid FROM email format: "${email}". Must be "Name <email@domain>" format.`);
  }
  
  // Extract email from brackets
  const match = email.match(/<([^>]+)>/);
  if (!match || !match[1]?.includes('@')) {
    console.error("INVALID_FROM_EMAIL", { email });
    throw new Error(`Invalid FROM email format: "${email}". Must contain valid email inside angle brackets.`);
  }
}

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
 * Get FROM email address for sending emails
 * Server-only: Uses NO_REPLY_EMAIL (with optional override)
 */
export function getFromEmail(): string {
  if (typeof window !== 'undefined') {
    throw new Error('getFromEmail() is server-side only');
  }
  
  const fromEmail = FROM_EMAIL;
  validateFromEmail(fromEmail);
  return fromEmail;
}
