"use client";

import { useState, useEffect } from "react";
import { Euro, TrendingUp, TrendingDown, FileText, Download } from "lucide-react";
import { toast } from "sonner";

interface BTWData {
  tePay: number;
  toReceive: number;
  difference: number;
  quarter: number;
  year: number;
}

interface BTWFocusWidgetProps {
  companyId: string;
  companyName: string;
}

export function BTWFocusWidget({ companyId, companyName }: BTWFocusWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [btwData, setBtwData] = useState<BTWData | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadBTWData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const loadBTWData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/btw/summary?companyId=${companyId}`);
      const data = await response.json();
      
      if (data.success) {
        setBtwData(data.data);
      } else {
        toast.error("Fout bij laden BTW-gegevens");
      }
    } catch (error) {
      console.error("Error loading BTW data:", error);
      toast.error("Fout bij laden BTW-gegevens");
    } finally {
      setLoading(false);
    }
  };

  const generateBTWReport = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/btw/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("BTW-rapport gegenereerd");
        // Download the report
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      } else {
        toast.error(data.message || "Fout bij genereren rapport");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Fout bij genereren rapport");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  if (!btwData) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground text-center">
          Geen BTW-gegevens beschikbaar
        </p>
      </div>
    );
  }

  const isDue = btwData.difference > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">BTW Overzicht</h3>
        <p className="text-sm text-muted-foreground">
          {companyName} - Q{btwData.quarter} {btwData.year}
        </p>
      </div>

      {/* BTW Summary Cards */}
      <div className="space-y-3">
        {/* BTW to Pay */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BTW te betalen</p>
                <p className="text-lg font-semibold text-foreground">
                  € {(btwData.tePay / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BTW to Receive */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BTW te ontvangen</p>
                <p className="text-lg font-semibold text-foreground">
                  € {(btwData.toReceive / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Difference */}
        <div className={`rounded-lg p-4 ${isDue ? "bg-amber-500/10 border border-amber-500/20" : "bg-green-500/10 border border-green-500/20"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isDue ? "bg-amber-500/20" : "bg-green-500/20"}`}>
                <Euro className={`h-5 w-5 ${isDue ? "text-amber-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${isDue ? "text-amber-600" : "text-green-600"}`}>
                  {isDue ? "Verschuldigd" : "Terug te ontvangen"}
                </p>
                <p className={`text-xl font-bold ${isDue ? "text-amber-700" : "text-green-700"}`}>
                  € {Math.abs(btwData.difference / 100).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Report Button */}
      <button
        onClick={generateBTWReport}
        disabled={generating}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {generating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent"></div>
            <span>Genereren...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Genereer BTW-rapport</span>
          </>
        )}
      </button>

      {/* Quick Link to Full BTW Page */}
      <div className="pt-4 border-t border-border">
        <a
          href="/btw-aangifte"
          className="text-sm text-primary hover:underline flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          Volledige BTW-aangifte bekijken
        </a>
      </div>
    </div>
  );
}
