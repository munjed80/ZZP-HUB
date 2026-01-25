"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export interface BtwReportDownloadButtonProps {
  year: number;
  quarter: number;
  className?: string;
}

export function BtwReportDownloadButton({ year, quarter, className }: BtwReportDownloadButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "pdf" | "xlsx") => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      params.set("year", String(year));
      params.set("quarter", String(quarter));

      const response = await fetch(`/api/export/btw-report?${params.toString()}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `btw-rapport-Q${quarter}-${year}.${format}`;
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

      toast.success(`BTW-rapport als ${format.toUpperCase()} gedownload!`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export mislukt. Probeer het opnieuw.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu
      trigger={
        <Button
          variant="secondary"
          disabled={isExporting}
          className={className}
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Downloaden..." : "BTW-rapport"}
        </Button>
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
