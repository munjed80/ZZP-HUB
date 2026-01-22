import { UserRole } from "@prisma/client";

/**
 * Extended role type that includes ACCOUNTANT for session handling.
 * The ACCOUNTANT role is now part of the core UserRole enum in the database schema.
 * This type alias is kept for backward compatibility with existing code.
 */
export type ExtendedUserRole = UserRole;

/**
 * Valid UserRole values for runtime validation.
 */
export const VALID_USER_ROLES: readonly UserRole[] = [
  "SUPERADMIN",
  "COMPANY_ADMIN",
  "STAFF",
  "ACCOUNTANT",
] as const;

/**
 * Default fallback role for invalid role strings.
 */
export const DEFAULT_ROLE: UserRole = "STAFF";

/**
 * Validates and normalizes a role string, falling back to STAFF if invalid.
 * Logs a warning server-side when an invalid role is encountered.
 * 
 * @param role - The role string to validate
 * @returns A valid UserRole, defaulting to STAFF if the input is invalid
 */
export function validateUserRole(role: unknown): UserRole {
  if (typeof role === "string" && VALID_USER_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  
  // Only log on server-side to prevent client-side console noise
  if (typeof window === "undefined") {
    console.warn(`[ROLE_GUARD] Invalid role received: "${role}", falling back to ${DEFAULT_ROLE}`);
  }
  
  return DEFAULT_ROLE;
}

/**
 * Type guard to check if a value is a valid UserRole.
 * 
 * @param role - The value to check
 * @returns True if the value is a valid UserRole
 */
export function isValidUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && VALID_USER_ROLES.includes(role as UserRole);
}
