import { InvoicePDF, type InvoicePdfData } from "./InvoicePDF";

export function QuotationPDF({ quotation }: { quotation: InvoicePdfData }) {
  return <InvoicePDF invoice={quotation} documentType="OFFERTE" />;
}
