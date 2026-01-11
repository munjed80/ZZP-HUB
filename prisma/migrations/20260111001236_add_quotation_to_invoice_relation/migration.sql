-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "convertedFromQuotationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_convertedFromQuotationId_key" ON "Invoice"("convertedFromQuotationId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_convertedFromQuotationId_fkey" FOREIGN KEY ("convertedFromQuotationId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
