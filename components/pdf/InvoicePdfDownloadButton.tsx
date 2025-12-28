"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF, type InvoicePdfData } from "./InvoicePDF";

type Props = {
  invoice: InvoicePdfData;
  documentType?: "FACTUUR" | "OFFERTE";
  fileName?: string;
};

export function InvoicePdfDownloadButton({ invoice, documentType = "FACTUUR", fileName }: Props) {
  const downloadName = fileName ?? `${documentType === "OFFERTE" ? "offerte" : "factuur"}-${invoice.invoiceNum}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} documentType={documentType} />}
      fileName={downloadName}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-slate-900 hover:bg-slate-800"
    >
      {({ loading }) => (loading ? "PDF genereren..." : "Download PDF")}
    </PDFDownloadLink>
  );
}
