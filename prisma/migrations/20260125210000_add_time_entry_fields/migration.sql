-- Add new fields to TimeEntry for enhanced hours tracking
ALTER TABLE "TimeEntry" ADD COLUMN "startTime" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "endTime" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "breakMinutes" INTEGER DEFAULT 0;
ALTER TABLE "TimeEntry" ADD COLUMN "workType" TEXT;
ALTER TABLE "TimeEntry" ADD COLUMN "notes" TEXT;
