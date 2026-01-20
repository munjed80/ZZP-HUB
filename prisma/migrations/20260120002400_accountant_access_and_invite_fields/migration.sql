-- CreateEnum
CREATE TYPE "AccountantAccessStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable AccountantInvite
ALTER TABLE "AccountantInvite"
ADD COLUMN     "invitedEmail" TEXT,
ADD COLUMN     "acceptedByUserId" TEXT,
ADD COLUMN     "inviteType" TEXT NOT NULL DEFAULT 'ACCOUNTANT_ACCESS',
ADD COLUMN     "permissions" TEXT;

-- CreateTable AccountantAccess
CREATE TABLE "AccountantAccess" (
    "id" TEXT NOT NULL,
    "accountantUserId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "canRead" BOOLEAN NOT NULL DEFAULT true,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canExport" BOOLEAN NOT NULL DEFAULT false,
    "canBTW" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT,
    "status" "AccountantAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AccountantAccess_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey for AccountantInvite acceptedByUserId
ALTER TABLE "AccountantInvite" ADD CONSTRAINT "AccountantInvite_acceptedByUserId_fkey" FOREIGN KEY ("acceptedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKeys for AccountantAccess
ALTER TABLE "AccountantAccess" ADD CONSTRAINT "AccountantAccess_accountantUserId_fkey" FOREIGN KEY ("accountantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountantAccess" ADD CONSTRAINT "AccountantAccess_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "AccountantAccess_accountantUserId_companyId_key" ON "AccountantAccess"("accountantUserId", "companyId");
CREATE INDEX "AccountantAccess_companyId_idx" ON "AccountantAccess"("companyId");
CREATE INDEX "AccountantAccess_accountantUserId_idx" ON "AccountantAccess"("accountantUserId");
CREATE INDEX "AccountantInvite_invitedEmail_idx" ON "AccountantInvite"("invitedEmail");
