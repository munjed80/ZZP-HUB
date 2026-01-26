-- CreateEnum
CREATE TYPE "TimeEntryStatus" AS ENUM ('RUNNING', 'COMPLETED');

-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "billedAt" TIMESTAMP(3),
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "status" "TimeEntryStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "timerStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "TimeEntry_userId_status_idx" ON "TimeEntry"("userId", "status");
