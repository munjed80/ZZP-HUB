-- Drop the old 'email' column from AccountantInvite table
-- This column was replaced by 'invitedEmail' but was never dropped,
-- causing P2011 null constraint violations when creating new invites.

ALTER TABLE "AccountantInvite" DROP COLUMN IF EXISTS "email";

-- Remove the old email index if it exists
DROP INDEX IF EXISTS "AccountantInvite_email_idx";
