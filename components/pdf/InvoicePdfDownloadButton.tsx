"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Share2 } from "lucide-react";
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
    "inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white ring-1 ring-slate-900 hover:bg-slate-800";
  const linkClass = className ?? defaultClass;
  const documentLabel = documentType === "OFFERTE" ? "Offerte" : "Factuur";
  const companyName = invoice.companyProfile?.companyName ?? "je bedrijf";
  const shareTitle = `${documentLabel} ${invoice.invoiceNum}`;
  const shareText = `Hier is de ${documentLabel.toLowerCase()} van ${companyName}`;
  const buttonLabel = label ?? "Delen / Downloaden";

  const downloadBlob = (blob: Blob) => {
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
  };

  const handleShareOrDownload = async () => {
    let blob: Blob | null = null;
    try {
      setIsGenerating(true);
      blob = await pdf(<InvoicePDF invoice={invoice} documentType={documentType} />).toBlob();
      const pdfFile = new File([blob], downloadName, { type: "application/pdf" });
      const shareData = {
        title: shareTitle,
        text: shareText,
        files: [pdfFile],
      };
      const canUseShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        (!navigator.canShare || navigator.canShare({ files: shareData.files }));

      if (canUseShare) {
        await navigator.share(shareData);
        return;
      }

      downloadBlob(blob);
    } catch (error) {
      console.error("PDF share/download failed", error);
      if (blob) {
        downloadBlob(blob);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button type="button" onClick={handleShareOrDownload} className={linkClass} disabled={isGenerating}>
      {isGenerating ? (
        "PDF genereren..."
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden />
          {buttonLabel}
        </>
      )}
    </button>
  );
}
