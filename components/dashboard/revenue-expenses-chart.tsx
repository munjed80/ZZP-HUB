"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { formatBedrag } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type ChartPoint = {
  month: string;
  omzet: number;
  kosten: number;
};

export function RevenueExpensesChart({ data }: { data: ChartPoint[] }) {
  // Calculate max values once for performance and accurate scaling
  const maxOmzet = Math.max(...data.map(d => d.omzet), 1);
  const maxKosten = Math.max(...data.map(d => d.kosten), 1);
  const maxValue = Math.max(maxOmzet, maxKosten);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-50/30 dark:from-blue-950/20 dark:to-blue-950/5 p-4 border border-blue-100 dark:border-blue-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Totaal Omzet</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300 tabular-nums">
            {formatBedrag(data.reduce((sum, item) => sum + item.omzet, 0))}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-50/30 dark:from-orange-950/20 dark:to-orange-950/5 p-4 border border-orange-100 dark:border-orange-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400 mb-1">Totaal Kosten</p>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-300 tabular-nums">
            {formatBedrag(data.reduce((sum, item) => sum + item.kosten, 0))}
          </p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-50/30 dark:from-emerald-950/20 dark:to-emerald-950/5 p-4 border border-emerald-100 dark:border-emerald-900/30">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">Totaal Winst</p>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-300 tabular-nums">
            {formatBedrag(data.reduce((sum, item) => sum + (item.omzet - item.kosten), 0))}
          </p>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="space-y-3">
        {data.map((item, index) => {
          const profit = item.omzet - item.kosten;
          const isProfit = profit >= 0;
          const hasData = item.omzet > 0 || item.kosten > 0;

          return (
            <div
              key={index}
              className={cn(
                "rounded-xl border transition-all duration-200",
                hasData
                  ? "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:shadow-md"
                  : "bg-slate-50/50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-900/30 opacity-60"
              )}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.month}
                    </span>
                    {hasData && (
                      <div className={cn(
                        "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
                        isProfit
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                      )}>
                        {isProfit ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {formatBedrag(Math.abs(profit))}
                      </div>
                    )}
                  </div>
                </div>

                {hasData ? (
                  <div className="space-y-2">
                    {/* Revenue Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-blue-700 dark:text-blue-400">Omzet</span>
                        <span className="font-bold text-blue-900 dark:text-blue-300 tabular-nums">
                          {formatBedrag(item.omzet)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (item.omzet / maxValue) * 100)}%`
                          }}
                        />
                      </div>
                    </div>

                    {/* Expenses Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-orange-700 dark:text-orange-400">Kosten</span>
                        <span className="font-bold text-orange-900 dark:text-orange-300 tabular-nums">
                          {formatBedrag(item.kosten)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (item.kosten / maxValue) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-600 text-center py-2">
                    Geen gegevens
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
