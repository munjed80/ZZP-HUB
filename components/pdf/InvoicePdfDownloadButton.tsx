"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { Share2 } from "lucide-react";
import { InvoicePDF, type InvoicePdfData } from "./InvoicePDF";
import { Button } from "@/components/ui/button";

const DOWNLOAD_CLEANUP_DELAY_MS = 100;
const DEFAULT_COMPANY_NAME = "Je bedrijf";
const hasWebShareSupport = () => typeof navigator !== "undefined" && typeof navigator.share === "function";
const canShareFiles = (data: ShareData) => {
  try {
    return typeof navigator.canShare === "function" ? navigator.canShare(data) : false;
  } catch (shareSupportError) {
    console.error("Share API support check failed for PDF data", shareSupportError);
    return false;
  }
};

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
  const documentLabel = documentType === "OFFERTE" ? "Offerte" : "Factuur";
  const companyName = invoice.companyProfile?.companyName ?? DEFAULT_COMPANY_NAME;
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
    try {
      setIsGenerating(true);
      const blob = await pdf(<InvoicePDF invoice={invoice} documentType={documentType} />).toBlob();
      const pdfFile = new File([blob], downloadName, { type: "application/pdf" });
      const shareData = {
        title: shareTitle,
        text: shareText,
        files: [pdfFile],
      };
      const hasWebShare = hasWebShareSupport();

      if (hasWebShare && canShareFiles(shareData)) {
        try {
          await navigator.share(shareData);
          return;
        } catch (shareError) {
          if (shareError instanceof DOMException && shareError.name === "AbortError") {
            return;
          }
          console.error("Sharing invoice PDF failed", shareError);
        }
      }

      downloadBlob(blob);
    } catch (error) {
      console.error("Invoice PDF generation or download failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleShareOrDownload} disabled={isGenerating} className={className}>
      {isGenerating ? (
        "PDF genereren..."
      ) : (
        <>
          <Share2 className="h-4 w-4" aria-hidden="true" />
          {buttonLabel}
        </>
      )}
    </Button>
  );
}
