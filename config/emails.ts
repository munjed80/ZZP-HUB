/**
 * Single source of truth for all email addresses used in the application.
 *
 * Defaults are matrixtop.com - NEVER use resend.dev or zzp-hub.nl
 */

const APP_NAME = "ZZP Hub";
// Hard defaults - matrixtop.com addresses
export const SUPPORT_EMAIL = "support@matrixtop.com";
export const NO_REPLY_EMAIL = "no-reply@matrixtop.com";
export const FROM_EMAIL = `${APP_NAME} <${NO_REPLY_EMAIL}>`;
const FROM_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate RFC-compliant "Name <email@domain>" format
 * Ensures from address has proper format to avoid email delivery issues
 * @throws Error if format is invalid
 */
export function validateFromEmail(email: string): void {
  const match = email.match(/<([^>]+)>/);
  if (!match) {
    console.error("INVALID_FROM_EMAIL", { reason: "missing-bracketed-address" });
    throw new Error("Invalid FROM email format. Must contain valid email inside angle brackets.");
  }

  const extracted = match[1].trim();
  const hasValidEmail = FROM_EMAIL_PATTERN.test(extracted);
  if (!hasValidEmail) {
    console.error("INVALID_FROM_EMAIL", { reason: "invalid-email-address" });
    throw new Error("Invalid FROM email format. Email address inside angle brackets is invalid.");
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
  
  const envFromEmail = process.env.RESEND_FROM_EMAIL?.trim();
  if (!envFromEmail) {
    const message = "RESEND_FROM_EMAIL is not configured";
    if (process.env.NODE_ENV === "production") {
      console.error("MISSING_RESEND_FROM_EMAIL", { reason: "missing-env" });
      throw new Error(message);
    }
    console.warn("RESEND_FROM_EMAIL missing; falling back to default no-reply address");
    validateFromEmail(FROM_EMAIL);
    return FROM_EMAIL;
  }

  const fromEmail = `${APP_NAME} <${envFromEmail}>`;
  validateFromEmail(fromEmail);
  return fromEmail;
}
