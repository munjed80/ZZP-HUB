import { InvoicePDF, calculateInvoiceTotals, type InvoicePdfData, type InvoicePdfLine } from "@/components/pdf/InvoicePDF";

export type InvoiceTemplateData = InvoicePdfData;
export type InvoiceTemplateLine = InvoicePdfLine;

export { calculateInvoiceTotals };

export function InvoiceTemplate({ invoice }: { invoice: InvoiceTemplateData }) {
  return <InvoicePDF invoice={invoice} />;
}
