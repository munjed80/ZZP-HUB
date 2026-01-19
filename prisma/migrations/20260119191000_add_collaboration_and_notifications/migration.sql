-- Add review status fields to Invoice table
ALTER TABLE "Invoice" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Invoice" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "reviewStatus" TEXT DEFAULT 'pending';

-- Add OCR and review status fields to Expense table
ALTER TABLE "Expense" ADD COLUMN "ocrStatus" TEXT;
ALTER TABLE "Expense" ADD COLUMN "ocrData" TEXT;
ALTER TABLE "Expense" ADD COLUMN "extractedData" TEXT;
ALTER TABLE "Expense" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "Expense" ADD COLUMN "reviewedBy" TEXT;
ALTER TABLE "Expense" ADD COLUMN "reviewStatus" TEXT DEFAULT 'pending';

-- Create InvoiceNote table
CREATE TABLE "InvoiceNote" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceNote_pkey" PRIMARY KEY ("id")
);

-- Create ExpenseNote table
CREATE TABLE "ExpenseNote" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpenseNote_pkey" PRIMARY KEY ("id")
);

-- Create Notification table
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Create indexes for InvoiceNote
CREATE INDEX "InvoiceNote_invoiceId_idx" ON "InvoiceNote"("invoiceId");
CREATE INDEX "InvoiceNote_userId_idx" ON "InvoiceNote"("userId");
CREATE INDEX "InvoiceNote_createdAt_idx" ON "InvoiceNote"("createdAt");

-- Create indexes for ExpenseNote
CREATE INDEX "ExpenseNote_expenseId_idx" ON "ExpenseNote"("expenseId");
CREATE INDEX "ExpenseNote_userId_idx" ON "ExpenseNote"("userId");
CREATE INDEX "ExpenseNote_createdAt_idx" ON "ExpenseNote"("createdAt");

-- Create indexes for Notification
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- Add foreign key constraints
ALTER TABLE "InvoiceNote" ADD CONSTRAINT "InvoiceNote_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InvoiceNote" ADD CONSTRAINT "InvoiceNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExpenseNote" ADD CONSTRAINT "ExpenseNote_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExpenseNote" ADD CONSTRAINT "ExpenseNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
