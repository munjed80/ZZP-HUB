import { UserRole } from "@prisma/client";

/**
 * Extended role type that includes ACCOUNTANT for session handling.
 * The ACCOUNTANT role is used for accountants accessing client companies
 * but is not part of the core UserRole enum in the database schema.
 */
export type ExtendedUserRole = UserRole | "ACCOUNTANT";
