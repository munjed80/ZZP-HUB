"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { formatBedrag } from "@/lib/utils";

type Props = {
  revenue: number;
  expenses: number;
  profit: number;
};

const COLORS = {
  revenue: "#1b6b7a",
  expenses: "#4a6fa5",
  profit: "#2f9e7c",
  loss: "#e77975",
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
      <div className="rounded-xl border border-[var(--border)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--muted)]">
        Nog geen gegevens voor omzet, kosten of winst.
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Tooltip
            formatter={(value: number | string | undefined, name: string | undefined): [string, string] => {
              const toFiniteNumber = (input: number | string | undefined) => {
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
              const safeName = name ?? "Onbekend";

              if (numericValue === undefined) {
                return ["-", safeName];
              }

              return [`${formatBedrag(numericValue)} (${((numericValue / total) * 100).toFixed(0)}%)`, safeName];
            }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--border)",
              boxShadow: "0 16px 50px -30px var(--shadow-muted, rgba(15, 47, 58, 0.35))",
              background: "#ffffff",
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={64}
            outerRadius={96}
            paddingAngle={4}
            stroke="#f7fbff"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--muted)]">
        {data.map((item) => (
          <div key={item.name} className="rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color }}
                aria-hidden
              />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{item.name}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">{formatBedrag(item.value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
