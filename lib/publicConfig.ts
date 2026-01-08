/**
 * Client-safe configuration values
 * These can be used in client components
 */

import { getSupportEmail, SUPPORT_EMAIL } from "@/config/emails";

// Track if we've logged the domain warning (only log once at startup)
let domainWarningLogged = false;

/**
 * Mask email address for logging (keeps first char, domain visible)
 */
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  if (local.length === 0) return `***@${domain}`;
  return `${local[0]}***@${domain}`;
}

/**
 * Get support email for client-side usage (mailto links, display text, etc.)
 * Can be overridden via NEXT_PUBLIC_SUPPORT_EMAIL env var
 * Validates that override is under expected domain (matrixtop.com)
 */
export function getPublicSupportEmail(): string {
  const envOverride = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  
  // Use centralized config as default
  const defaultEmail = typeof window === 'undefined' 
    ? getSupportEmail() 
    : SUPPORT_EMAIL;
  
  // If no override, use default
  if (!envOverride) {
    return defaultEmail;
  }
  
  // Validate override domain
  const expectedDomain = 'matrixtop.com';
  if (!envOverride.includes(`@${expectedDomain}`)) {
    // Log warning once at startup (server-side only)
    if (typeof window === 'undefined' && !domainWarningLogged) {
      console.warn(JSON.stringify({
        event: 'config_warning',
        message: `NEXT_PUBLIC_SUPPORT_EMAIL is not under expected domain (${expectedDomain}). Using default.`,
        overrideMasked: maskEmail(envOverride),
        defaultMasked: maskEmail(defaultEmail),
      }));
      domainWarningLogged = true;
    }
    return defaultEmail;
  }
  
  return envOverride;
}
