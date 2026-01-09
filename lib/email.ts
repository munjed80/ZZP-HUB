import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getFromEmail } from "@/config/emails";

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
  if (subject.includes("Verifieer")) return "verification";
  if (subject.includes("Factuur")) return "invoice";
  return "support";
}

/**
 * Log email send attempt
 */
function logEmailAttempt(type: string, to: string, from: string, subject: string) {
  console.log(JSON.stringify({
    event: "email_send_attempt",
    type,
    to,
    from,
    subject,
  }));
}

/**
 * Log email send success
 */
export function logEmailSuccess(messageId: string, to: string, subject: string, from: string) {
  console.log(JSON.stringify({
    event: "email_send_success",
    messageId,
    to,
    subject,
    from,
  }));
}

/**
 * Log email send failure
 */
function logEmailFailure(error: Error | EmailError, to: string, from: string, subject: string) {
  const logData: Record<string, unknown> = {
    event: "email_send_failure",
    to,
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
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<SendEmailResult> {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const isProd = process.env.NODE_ENV === "production";
  const from = formatFromAddress();
  const type = getEmailType(subject);
  
  // Log send attempt
  logEmailAttempt(type, to, from, subject);

  try {
    const html = await render(react);

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
      console.log("HTML Preview:", html.substring(0, 500));
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
    });

    // Check for Resend API errors (result.error is set when API returns an error)
    if (result.error) {
      logEmailFailure(result.error, to, from, subject);
      return { 
        success: false, 
        error: new Error(result.error.message || "Email send failed") 
      };
    }

    // Verify we have a valid message ID
    if (!result.data?.id) {
      const error = new Error("Email send failed: no message ID returned");
      logEmailFailure(error, to, from, subject);
      return { success: false, error };
    }

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
