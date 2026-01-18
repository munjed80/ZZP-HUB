"use client";

import { useState } from "react";
import { exportForAccountant } from "@/app/actions/export-actions";
import { toast } from "sonner";
import { Download, FileDown } from "lucide-react";

export function ExportButton({ companyId }: { companyId: string }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    // Default to start of current quarter
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => {
    // Default to today
    return new Date().toISOString().split("T")[0];
  });

  async function handleExport() {
    setIsExporting(true);

    try {
      const result = await exportForAccountant(companyId, startDate, endDate);

      if (result.success && result.data) {
        // Download files
        const { invoicesCSV, expensesCSV, vatSummaryJSON, vatCSV } = result.data;

        // Helper to download a file
        const downloadFile = (content: string, filename: string, type: string) => {
          const blob = new Blob([content], { type });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        };

        // Download all files
        const dateRange = `${startDate}_${endDate}`;
        downloadFile(invoicesCSV, `facturen_${dateRange}.csv`, "text/csv");
        downloadFile(expensesCSV, `uitgaven_${dateRange}.csv`, "text/csv");
        downloadFile(vatSummaryJSON, `btw_overzicht_${dateRange}.json`, "application/json");
        downloadFile(vatCSV, `btw_overzicht_${dateRange}.csv`, "text/csv");

        toast.success("Export voltooid! 4 bestanden gedownload.");
        setShowDatePicker(false);
      } else {
        toast.error(result.message || "Export mislukt");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Er is een fout opgetreden bij het exporteren");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
      >
        <FileDown className="h-4 w-4" />
        <span>Export voor accountant</span>
      </button>

      {showDatePicker && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDatePicker(false)}
          />

          {/* Date picker panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-lg border border-border bg-card shadow-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Selecteer periode
            </h3>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="export-start-date"
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  Startdatum
                </label>
                <input
                  type="date"
                  id="export-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label
                  htmlFor="export-end-date"
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  Einddatum
                </label>
                <input
                  type="date"
                  id="export-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporteren..." : "Exporteren"}
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Er worden 4 bestanden gedownload: facturen, uitgaven, en BTW-overzichten (CSV en JSON).
            </p>
          </div>
        </>
      )}
    </div>
  );
}
