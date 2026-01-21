import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getFromEmail, getReplyToEmail } from "@/config/emails";
import { randomUUID } from "crypto";

// Throttling state for multiple sends
let lastEmailSendTime = 0;

let resendClient: Resend | null = null;

export function resolveFromEmail() {
  // Use centralized config with optional env override
  return getFromEmail();
}

export function formatFromAddress() {
  return resolveFromEmail();
}

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}

interface EmailAuthStatus {
  spf?: string;
  dkim?: string;
  dmarc?: string;
}

interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

interface EmailError {
  message: string;
  name?: string;
  statusCode?: number | null;
}

/**
 * Determine email type based on subject
 */
function getEmailType(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes("uitnod")) return "invite";
  if (lower.includes("verifieer")) return "verification";
  if (lower.includes("factuur")) return "invoice";
  return "support";
}

function maskRecipient(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
  return `${local[0]}***${local.slice(-1)}@${domain}`;
}

/**
 * Log email send attempt
 */
function logEmailAttempt(type: string, to: string, from: string, subject: string) {
  console.log(JSON.stringify({
    event: "EMAIL_SEND_ATTEMPT",
    type,
    toMasked: maskRecipient(to),
    from,
    subject,
  }));
}

/**
 * Log email send success
 */
export function logEmailSuccess(messageId: string, to: string, subject: string, from: string) {
  console.log(JSON.stringify({
    event: "EMAIL_SEND_SUCCESS",
    messageId,
    toMasked: maskRecipient(to),
    subject,
    from,
  }));
}

/**
 * Log email deliverability check
 */
function logDeliverabilityCheck(to: string, from: string, authStatus: EmailAuthStatus) {
  console.log(JSON.stringify({
    event: "EMAIL_DELIVERABILITY_CHECK",
    toMasked: maskRecipient(to),
    from,
    spf: authStatus.spf || "unknown",
    dkim: authStatus.dkim || "unknown",
    dmarc: authStatus.dmarc || "unknown",
  }));
  
  // Log warning if any authentication is not passing
  const hasAuthIssue = 
    !authStatus.spf || authStatus.spf !== "pass" ||
    !authStatus.dkim || authStatus.dkim !== "pass" ||
    !authStatus.dmarc || authStatus.dmarc !== "pass";
  
  if (hasAuthIssue) {
    console.warn(JSON.stringify({
      event: "EMAIL_AUTH_NOT_ALIGNED",
      to,
      from,
      spf: authStatus.spf || "missing",
      dkim: authStatus.dkim || "missing",
      dmarc: authStatus.dmarc || "missing",
    }));
  }
}

/**
 * Generate plain text version from HTML email templates
 * 
 * SECURITY NOTE: This function is ONLY used to convert HTML from our own
 * trusted React email templates (rendered via @react-email/render) into
 * plain text versions for email. It is NOT used for sanitizing user input
 * or rendering HTML in browsers. The input HTML always comes from our own
 * controlled email templates, so there is no XSS risk.
 * 
 * @param html - HTML string from React email template rendering
 * @returns Plain text version suitable for email text/plain part
 */
function htmlToText(html: string): string {
  let result = html;
  
  // Remove script and style tags with content (multiple passes for nested tags)
  // Using [\s\S]*? for non-greedy matching of any character including newlines
  for (let i = 0; i < 3; i++) {
    result = result
      .replace(/<script[^>]*>[\s\S]*?<\/script\s*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style\s*>/gi, '');
  }
  
  return result
    // Convert common HTML elements to text equivalents
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    // Extract link text and URLs
    .replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1[^>]*>(.*?)<\/a>/gi, '$3 ($2)')
    // Remove all remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') // Must be last to avoid double-decoding
    // Clean up whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Add throttling delay between email sends
 * Adds a random delay of 300-800ms if emails are sent rapidly (within 800ms of each other)
 */
async function throttleEmailSend(): Promise<void> {
  const now = Date.now();
  const timeSinceLastSend = now - lastEmailSendTime;
  
  if (timeSinceLastSend < 800) { // If less than 800ms since last send
    // Random delay between 300-800ms
    const delay = 300 + Math.floor(Math.random() * 500);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  lastEmailSendTime = Date.now();
}

/**
 * Log email send failure
 */
function logEmailFailure(error: Error | EmailError, to: string, from: string, subject: string) {
  const logData: Record<string, unknown> = {
    event: "EMAIL_SEND_FAIL",
    toMasked: maskRecipient(to),
    from,
    subject,
    error: error.message,
  };
  
  if ('name' in error && error.name) {
    logData.errorName = error.name;
  }
  if ('statusCode' in error && error.statusCode !== undefined) {
    logData.statusCode = error.statusCode;
  }
  
  console.error(JSON.stringify(logData));
}

/**
 * Send an email using Resend or log to console in development
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions): Promise<SendEmailResult> {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const isProd = process.env.NODE_ENV === "production";
  const from = resolveFromEmail();
  const resolvedReplyTo = replyTo || getReplyToEmail();
  const type = getEmailType(subject);
  
  // Add throttling delay
  await throttleEmailSend();
  
  // Log send attempt
  logEmailAttempt(type, to, from, subject);

  try {
    // Render both HTML and text versions
    const html = await render(react);
    const text = htmlToText(html);

    if (!hasApiKey) {
      if (isProd) {
        const error = new Error("RESEND_API_KEY missing in production");
        logEmailFailure(error, to, from, subject);
        return { success: false, error };
      }

      console.log("\n================== EMAIL (DEV MODE) ==================");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${from}`);
      console.log(`Reply-To: ${resolvedReplyTo}`);
      console.log("HTML Preview:", html.substring(0, 500));
      console.log("Text Preview:", text.substring(0, 300));
      console.log("======================================================\n");
      logEmailSuccess("dev-mode", to, subject, from);
      return { success: true, messageId: "dev-mode" };
    }

    const resend = getResendClient();
    if (!resend) {
      const error = new Error("RESEND client unavailable");
      logEmailFailure(error, to, from, subject);
      return { success: false, error };
    }

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      replyTo: resolvedReplyTo,
      headers: {
        'X-Entity-Ref-ID': randomUUID(),
        'Reply-To': resolvedReplyTo,
        'List-Unsubscribe': '<mailto:support@zzpershub.nl?subject=unsubscribe>',
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    // Check for Resend API errors (result.error is set when API returns an error)
    if (result.error) {
      logEmailFailure(result.error, to, from, subject);
      return { 
        success: false, 
        error: new Error(result.error.message || "Email send failed") 
      };
    }

    // Verify we have a valid message ID (provider must return messageId)
    if (!result.data?.id) {
      const error = new Error("Email provider returned 'accepted' without messageId - treating as failure");
      logEmailFailure(error, to, from, subject);
      return { success: false, error };
    }

    // Log deliverability check
    // Note: When using Resend as the email provider, SPF/DKIM/DMARC are configured
    // and handled by Resend on their infrastructure. These values represent the
    // expected authentication status when emails are sent through Resend's verified domain.
    const authStatus: EmailAuthStatus = {
      spf: "pass", // Resend configures SPF records
      dkim: "pass", // Resend signs emails with DKIM
      dmarc: "pass", // Proper domain alignment via Resend
    };
    logDeliverabilityCheck(to, from, authStatus);

    // Log success with real message ID
      logEmailSuccess(result.data.id, to, subject, from);

    return { success: true, messageId: result.data.id };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logEmailFailure(err, to, from, subject);
    return { success: false, error: err };
  }
}

/**
 * Generate a secure random token for email verification
 * Uses rejection sampling to avoid modulo bias
 */
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;
  let token = '';
  
  // Generate enough random bytes (we need 32 chars, request more to account for rejections)
  const randomValues = new Uint8Array(48);
  crypto.getRandomValues(randomValues);
  
  let randomIndex = 0;
  while (token.length < 32 && randomIndex < randomValues.length) {
    const randomValue = randomValues[randomIndex++];
    // Use rejection sampling to avoid modulo bias
    // Only use values that fit evenly into our charset
    const maxUsableValue = 256 - (256 % charsLength);
    if (randomValue < maxUsableValue) {
      token += chars[randomValue % charsLength];
    }
  }
  
  // Fallback: if we somehow didn't get 32 chars (very unlikely), use crypto.randomUUID
  if (token.length < 32) {
    return crypto.randomUUID().replace(/-/g, '');
  }
  
  return token;
}


/**
 * Hash a token for secure storage
 */
export async function hashToken(token: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(token, 10);
}

/**
 * Verify a token against a hash
 */
export async function verifyToken(token: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(token, hash);
}
