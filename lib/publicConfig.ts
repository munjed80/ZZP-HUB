/**
 * Client-safe configuration values
 * These can be used in client components
 */

import { SUPPORT_EMAIL } from "@/config/emails";

/**
 * Get support email for client-side usage (mailto links, display text, etc.)
 * Can be overridden via NEXT_PUBLIC_SUPPORT_EMAIL env var
 */
export function getPublicSupportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || SUPPORT_EMAIL;
}
