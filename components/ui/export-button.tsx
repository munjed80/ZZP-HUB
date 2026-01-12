"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export type ExportResource = "invoices" | "quotations" | "clients" | "expenses" | "time-entries" | "companies";

export interface ExportButtonProps {
  resource: ExportResource;
  searchQuery?: string;
  statusFilter?: string;
  className?: string;
}

export function ExportButton({ resource, searchQuery = "", statusFilter = "", className }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "pdf" | "xlsx" | "csv") => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("format", format);
      if (searchQuery) params.set("search", searchQuery);
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/export/${resource}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `export-${resource}.${format}`;

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

      toast.success(`Export als ${format.toUpperCase()} geslaagd!`);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Export mislukt. Probeer het opnieuw.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          disabled={isExporting}
          className={className}
        >
          <Download className="h-4 w-4" />
          {isExporting ? "Exporteren..." : "Exporteren"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("pdf")}>
          <FileText className="mr-2 h-4 w-4" />
          Exporteer als PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("xlsx")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Exporteer als Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileText className="mr-2 h-4 w-4" />
          Exporteer als CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
