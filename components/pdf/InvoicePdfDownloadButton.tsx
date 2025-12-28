"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { InvoicePDF, type InvoicePdfData } from "./InvoicePDF";

type Props = {
  invoice: InvoicePdfData;
};

export function InvoicePdfDownloadButton({ invoice }: Props) {
  const fileName = `factuur-${invoice.invoiceNum}.pdf`;

  return (
    <PDFDownloadLink
      document={<InvoicePDF invoice={invoice} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-slate-900 hover:bg-slate-800"
    >
      {({ loading }) => (loading ? "PDF genereren..." : "Download PDF")}
    </PDFDownloadLink>
  );
}
