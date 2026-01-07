import { Resend } from "resend";
import { render } from "@react-email/render";
import type { ReactElement } from "react";

const DEFAULT_FROM = "Matrixtop <no-reply@matrixtop.com>";
const DEFAULT_FROM_EMAIL = DEFAULT_FROM.match(/<([^>]+)>/)?.[1] || "no-reply@matrixtop.com";
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
let resendClient: Resend | null = null;

export function resolveFromEmail() {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.EMAIL_FROM?.trim() ||
    DEFAULT_FROM
  );
}

export function formatFromAddress(senderName?: string) {
  const base = resolveFromEmail();
  if (!senderName) return base;

  const normalizedBase =
    EMAIL_PATTERN.test(base) || base.includes("<") ? base : DEFAULT_FROM_EMAIL;
  const match = normalizedBase.match(/<([^>]+)>/);
  const candidateEmail = match ? match[1] : normalizedBase;
  const email = EMAIL_PATTERN.test(candidateEmail)
    ? candidateEmail
    : DEFAULT_FROM_EMAIL;

  return `${senderName} <${email}>`;
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

/**
 * Send an email using Resend or log to console in development
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const hasApiKey = Boolean(process.env.RESEND_API_KEY);
  const isProd = process.env.NODE_ENV === "production";
  const from = resolveFromEmail();

  try {
    const html = await render(react);

    if (!hasApiKey) {
      if (isProd) {
        console.error(
          "[email] RESEND_API_KEY missing in production. Email not sent.",
          { to, subject }
        );
        return { success: false, error: new Error("RESEND_API_KEY missing") };
      }

      console.log("\n================== EMAIL (DEV MODE) ==================");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`From: ${from}`);
      console.log("HTML Preview:", html.substring(0, 500));
      console.log("======================================================\n");
      return { success: true, messageId: "dev-mode" };
    }

    const resend = getResendClient();
    if (!resend) {
      return { success: false, error: new Error("RESEND client unavailable") };
    }

    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error("[email] Failed to send email", { to, subject, error });
    return { success: false, error };
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
