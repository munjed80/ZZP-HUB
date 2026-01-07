import { Resend } from 'resend';
import { render } from '@react-email/render';
import type { ReactElement } from 'react';

const resend = new Resend(process.env.RESEND_API_KEY || 'demo-key');

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
      from: process.env.EMAIL_FROM || 'ZZP-HUB <noreply@zzp-hub.nl>',
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
 */
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const randomValues = new Uint8Array(32);
  crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 32; i++) {
    token += chars[randomValues[i] % chars.length];
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
