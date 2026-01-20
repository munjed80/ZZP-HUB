-- Add new status for revoked invites
ALTER TYPE "InviteStatus" ADD VALUE IF NOT EXISTS 'REVOKED';

-- Ensure invitedEmail is populated for existing rows
UPDATE "AccountantInvite"
SET "invitedEmail" = COALESCE("invitedEmail", "email")
WHERE "invitedEmail" IS NULL;

-- Backfill tokenHash using md5 (avoids storing plaintext tokens)
UPDATE "AccountantInvite"
SET "tokenHash" = md5("token")
WHERE "tokenHash" IS NULL AND "token" IS NOT NULL;

-- Fallback tokenHash for any remaining nulls
UPDATE "AccountantInvite"
SET "tokenHash" = md5(random()::text)
WHERE "tokenHash" IS NULL;

-- Drop legacy token constraint/column if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccountantInvite_token_key') THEN
    ALTER TABLE "AccountantInvite" DROP CONSTRAINT "AccountantInvite_token_key";
  END IF;
END$$;

ALTER TABLE "AccountantInvite" DROP COLUMN IF EXISTS "token";

-- Enforce hashed token and invited email presence
ALTER TABLE "AccountantInvite" ALTER COLUMN "tokenHash" SET NOT NULL;
ALTER TABLE "AccountantInvite" ALTER COLUMN "invitedEmail" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AccountantInvite_tokenHash_key') THEN
    ALTER TABLE "AccountantInvite" ADD CONSTRAINT "AccountantInvite_tokenHash_key" UNIQUE ("tokenHash");
  END IF;
END$$;
