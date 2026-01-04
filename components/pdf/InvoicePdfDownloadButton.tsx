"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF, type InvoicePdfData } from "./InvoicePDF";

const DOWNLOAD_CLEANUP_DELAY_MS = 100;

type Props = {
  invoice: InvoicePdfData;
  documentType?: "FACTUUR" | "OFFERTE";
  fileName?: string;
  label?: string;
  className?: string;
};

export function InvoicePdfDownloadButton({ invoice, documentType = "FACTUUR", fileName, label, className }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const downloadName = fileName ?? `${documentType === "OFFERTE" ? "offerte" : "factuur"}-${invoice.invoiceNum}.pdf`;
  const defaultClass =
    "inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-slate-900 hover:bg-slate-800";
  const linkClass = className ?? defaultClass;
  const buttonLabel = label ?? "Download PDF";

  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      const blob = await pdf(<InvoicePDF invoice={invoice} documentType={documentType} />).toBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => {
        anchor.remove();
        URL.revokeObjectURL(url);
      }, DOWNLOAD_CLEANUP_DELAY_MS);
    } catch (error) {
      console.error("PDF download failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button type="button" onClick={handleDownload} className={linkClass} disabled={isGenerating}>
      {isGenerating ? "PDF genereren..." : buttonLabel}
    </button>
  );
}
