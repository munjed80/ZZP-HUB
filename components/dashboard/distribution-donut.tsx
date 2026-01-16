"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import type { Formatter, NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { formatBedrag } from "@/lib/utils";

type Props = {
  revenue: number;
  expenses: number;
  profit: number;
};

const COLORS = {
  revenue: "#1E40AF", // Deep blue for Omzet
  expenses: "#F97316", // Orange for Kosten
  profit: "#059669", // Strong green for Winst
  loss: "#DC2626", // Red for Verlies
};

export function DistributionDonut({ revenue, expenses, profit }: Props) {
  const safeRevenue = Math.max(0, revenue);
  const safeExpenses = Math.max(0, expenses);
  const profitLabel = profit >= 0 ? "Winst" : "Verlies";
  const safeProfit = Math.abs(profit);

  const data = [
    { name: "Omzet", value: safeRevenue, color: COLORS.revenue },
    { name: "Kosten", value: safeExpenses, color: COLORS.expenses },
    { name: profitLabel, value: safeProfit, color: profit >= 0 ? COLORS.profit : COLORS.loss },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        Nog geen gegevens voor omzet, kosten of winst.
      </div>
    );
  }

  const tooltipFormatter: Formatter<ValueType, NameType> = (value, name): [string, string] => {
    const toFiniteNumber = (input: ValueType | undefined) => {
      if (input === undefined) return undefined;
      if (Array.isArray(input)) return undefined;
      if (typeof input === "number" && Number.isFinite(input)) {
        return input;
      }
      if (typeof input === "string") {
        const parsed = Number(input);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
      return undefined;
    };

    const numericValue = toFiniteNumber(value);
    const safeName = typeof name === "string" ? name : "Onbekend";

    if (numericValue === undefined) {
      return ["-", safeName];
    }

    return [`${formatBedrag(numericValue)} (${((numericValue / total) * 100).toFixed(0)}%)`, safeName];
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid rgb(var(--border))",
              boxShadow: "0 16px 50px -30px rgba(15, 47, 58, 0.35)",
              background: "rgb(var(--card))",
              color: "rgb(var(--card-foreground))",
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={96}
            paddingAngle={4}
            stroke="rgb(var(--border))"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        {data.map((item) => (
          <div key={item.name} className="rounded-xl border border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.name}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-foreground">{formatBedrag(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
