"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { normalizePeriod } from "@/lib/period.js";

type PeriodOption = "month" | "quarter" | "year" | "custom";

interface PeriodFilterProps {
  className?: string;
  defaultPeriod?: PeriodOption;
}

export function PeriodFilter({ className, defaultPeriod = "month" }: PeriodFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.replace(`?${params.toString()}`);
  };

  const selectedPeriod = (searchParams.get("period") as PeriodOption) || defaultPeriod;
  const selectedYear = searchParams.get("year") || currentYear.toString();
  const selectedMonth = searchParams.get("month") || currentMonth.toString();
  const selectedQuarter = searchParams.get("quarter") || `${Math.floor((Number(selectedMonth) - 1) / 3) + 1}`;

  const normalizedRange = useMemo(() => normalizePeriod(searchParams), [searchParams]);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {(["month", "quarter", "year", "custom"] as PeriodOption[]).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setParam("period", option)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
              selectedPeriod === option
                ? "border-primary/50 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {option === "month" && "Maand"}
            {option === "quarter" && "Kwartaal"}
            {option === "year" && "Jaar"}
            {option === "custom" && "Aangepast"}
          </button>
        ))}
      </div>

      {selectedPeriod === "month" && (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            Jaar
            <select
              value={selectedYear}
              onChange={(e) => setParam("year", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Maand
            <select
              value={selectedMonth}
              onChange={(e) => setParam("month", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(0, month - 1).toLocaleString("nl-NL", { month: "long" })}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selectedPeriod === "quarter" && (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            Jaar
            <select
              value={selectedYear}
              onChange={(e) => setParam("year", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            Kwartaal
            <select
              value={selectedQuarter}
              onChange={(e) => setParam("quarter", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[1, 2, 3, 4].map((quarter) => (
                <option key={quarter} value={quarter}>
                  Q{quarter}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selectedPeriod === "year" && (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            Jaar
            <select
              value={selectedYear}
              onChange={(e) => setParam("year", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {selectedPeriod === "custom" && (
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <label className="flex items-center gap-2">
            Van
            <input
              type="date"
              defaultValue={searchParams.get("from") || ""}
              onChange={(e) => setParam("from", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <label className="flex items-center gap-2">
            Tot
            <input
              type="date"
              defaultValue={searchParams.get("to") || ""}
              onChange={(e) => setParam("to", e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Bereik:{" "}
        <span className="font-semibold">
          {normalizedRange.from.toLocaleDateString("nl-NL")} – {normalizedRange.to.toLocaleDateString("nl-NL")}
        </span>
      </p>
    </div>
  );
}
