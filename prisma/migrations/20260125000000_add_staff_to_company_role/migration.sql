-- Add STAFF to CompanyRole enum (safe operation - only adds new value)
ALTER TYPE "CompanyRole" ADD VALUE IF NOT EXISTS 'STAFF';
