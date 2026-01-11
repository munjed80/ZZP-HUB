-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "convertedFromOfferteId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_convertedFromOfferteId_key" ON "Invoice"("convertedFromOfferteId");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_convertedFromOfferteId_fkey" FOREIGN KEY ("convertedFromOfferteId") REFERENCES "Quotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
