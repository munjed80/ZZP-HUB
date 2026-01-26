-- Add billable fields to TimeEntry for professional hours tracking
ALTER TABLE "TimeEntry" ADD COLUMN "billable" BOOLEAN DEFAULT true NOT NULL;
ALTER TABLE "TimeEntry" ADD COLUMN "hourlyRate" DECIMAL(10, 2);
ALTER TABLE "TimeEntry" ADD COLUMN "projectTag" TEXT;
