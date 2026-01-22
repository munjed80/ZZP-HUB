-- Migration: add_company_user_permissions
-- This migration is idempotent and safe to run on existing production DBs.

-- Create CompanyUserStatus enum if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyUserStatus') THEN
    CREATE TYPE "CompanyUserStatus" AS ENUM ('PENDING', 'ACTIVE');
  END IF;
END$$;

-- Create CompanyRole enum if missing (as defined in schema.prisma)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CompanyRole') THEN
    CREATE TYPE "CompanyRole" AS ENUM ('OWNER', 'ACCOUNTANT');
  END IF;
END$$;

-- Create CompanyUser table if missing
CREATE TABLE IF NOT EXISTS "CompanyUser" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "userId" TEXT,
  "invitedEmail" TEXT,
  "role" "CompanyRole" NOT NULL,
  "status" "CompanyUserStatus" NOT NULL DEFAULT 'PENDING',
  "tokenHash" TEXT,
  "canRead" BOOLEAN NOT NULL DEFAULT true,
  "canEdit" BOOLEAN NOT NULL DEFAULT false,
  "canExport" BOOLEAN NOT NULL DEFAULT false,
  "canBTW" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyUser_pkey" PRIMARY KEY ("id")
);

-- Add permission columns if table already existed but columns are missing
ALTER TABLE "CompanyUser" ADD COLUMN IF NOT EXISTS "canRead" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "CompanyUser" ADD COLUMN IF NOT EXISTS "canEdit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompanyUser" ADD COLUMN IF NOT EXISTS "canExport" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CompanyUser" ADD COLUMN IF NOT EXISTS "canBTW" BOOLEAN NOT NULL DEFAULT false;

-- Add foreign keys if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUser_companyId_fkey') THEN
    ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_fkey"
      FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUser_userId_fkey') THEN
    ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;

-- Add unique constraints if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUser_companyId_userId_key') THEN
    ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_companyId_userId_key" UNIQUE ("companyId", "userId");
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CompanyUser_tokenHash_key') THEN
    ALTER TABLE "CompanyUser" ADD CONSTRAINT "CompanyUser_tokenHash_key" UNIQUE ("tokenHash");
  END IF;
END$$;

-- Add indexes if not exist
CREATE INDEX IF NOT EXISTS "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");
CREATE INDEX IF NOT EXISTS "CompanyUser_userId_idx" ON "CompanyUser"("userId");
CREATE INDEX IF NOT EXISTS "CompanyUser_invitedEmail_idx" ON "CompanyUser"("invitedEmail");
