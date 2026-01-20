/**
 * Single source of truth for all email addresses used in the application.
 *
 * Official domain: zzpershub.nl
 */

// Centralized branding + email configuration
export const PRODUCT_NAME = process.env.PRODUCT_NAME?.trim() || "ZZP Hub";
export const APP_BASE_URL = process.env.APP_BASE_URL?.trim() || "https://zzpershub.nl";

// Official email addresses - zzpershub.nl domain
export const EMAIL_FROM_ADDRESS =
  process.env.EMAIL_FROM_ADDRESS?.trim() || "no-reply@zzpershub.nl";
export const EMAIL_FROM_NAME =
  process.env.EMAIL_FROM_NAME?.trim() || PRODUCT_NAME;
export const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() || `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`;
export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO?.trim() || "support@zzpershub.nl";

export const SUPPORT_EMAIL = EMAIL_REPLY_TO;
export const NO_REPLY_EMAIL = EMAIL_FROM_ADDRESS;
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
  if (typeof window === "undefined") {
    // Server-side: check env
    return process.env.SUPPORT_EMAIL?.trim() || SUPPORT_EMAIL;
  }
  // Client-side: use default (public config will handle client override)
  return SUPPORT_EMAIL;
}

/**
 * Get FROM email address for sending emails
 * Server-only: Uses NO_REPLY_EMAIL (with optional override)
 */
export function getFromEmail(): string {
  if (typeof window !== "undefined") {
    throw new Error("getFromEmail() is server-side only");
  }

  // RESEND_FROM_EMAIL lets ops override only the address while keeping display name
  const envResendFrom = process.env.RESEND_FROM_EMAIL?.trim();
  const chosenFrom =
    envResendFrom && envResendFrom !== EMAIL_FROM_ADDRESS
      ? `${EMAIL_FROM_NAME} <${envResendFrom}>`
      : EMAIL_FROM;

  validateFromEmail(chosenFrom);
  return chosenFrom;
}

export function getReplyToEmail(): string {
  return EMAIL_REPLY_TO;
}
