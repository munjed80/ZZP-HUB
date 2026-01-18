-- Add new roles to UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ZZP';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'ACCOUNTANT';

-- Add permissions column to CompanyMember table
ALTER TABLE "CompanyMember" ADD COLUMN IF NOT EXISTS "permissions" TEXT;

-- Update existing records with default permissions based on role
UPDATE "CompanyMember" 
SET "permissions" = '{"read": true, "edit": false, "export": true, "btw": false}'
WHERE "role" = 'ACCOUNTANT_VIEW' AND "permissions" IS NULL;

UPDATE "CompanyMember" 
SET "permissions" = '{"read": true, "edit": true, "export": true, "btw": true}'
WHERE "role" = 'ACCOUNTANT_EDIT' AND "permissions" IS NULL;

UPDATE "CompanyMember" 
SET "permissions" = '{"read": true, "edit": true, "export": true, "btw": true}'
WHERE "role" IN ('COMPANY_ADMIN', 'STAFF') AND "permissions" IS NULL;
