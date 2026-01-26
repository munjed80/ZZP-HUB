"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export interface ClientBtwDownloadButtonProps {
  companyId: string;
  className?: string;
}

/**
 * BTW Report download button for accountant client cards.
 * Downloads BTW report for the current quarter without switching company context.
 */
export function ClientBtwDownloadButton({ companyId, className }: ClientBtwDownloadButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  // Get current quarter as default
  const currentYear = new Date().getFullYear();
  const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;

  const handleExport = async (format: "pdf" | "xlsx") => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("companyId", companyId);
      params.set("format", format);
      params.set("year", String(currentYear));
      params.set("quarter", String(currentQuarter));

      const response = await fetch(`/api/accountant/btw-export?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `btw-rapport-Q${currentQuarter}-${currentYear}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=["']?([^"';]+)["']?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`BTW-rapport Q${currentQuarter} ${currentYear} gedownload!`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export mislukt. Controleer uw rechten.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu
      trigger={
        <button
          type="button"
          disabled={isExporting}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 ${className || ""}`}
        >
          <Download className="h-3.5 w-3.5" aria-hidden />
          {isExporting ? "..." : "BTW-rapport"}
          <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
        </button>
      }
    >
      <DropdownMenuItem onClick={() => handleExport("pdf")}>
        <FileText className="h-4 w-4" />
        Download als PDF
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleExport("xlsx")}>
        <FileSpreadsheet className="h-4 w-4" />
        Download als Excel
      </DropdownMenuItem>
    </DropdownMenu>
  );
}
