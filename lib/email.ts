import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY || 'demo-key');
const EMAIL_FROM = process.env.EMAIL_FROM || 'Matrixtop <no-reply@matrixtop.com>';

interface SendEmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
}

/**
 * Send an email using Resend or log to console in development
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  const isDev = process.env.NODE_ENV === 'development' || !process.env.RESEND_API_KEY;

  try {
    const html = await render(react);

    if (isDev) {
      console.log('\n================== EMAIL (DEV MODE) ==================');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('HTML Preview:', html.substring(0, 500));
      console.log('======================================================\n');
      return { success: true, messageId: 'dev-mode' };
    }

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
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
