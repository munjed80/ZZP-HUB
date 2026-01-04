"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { formatBedrag } from "@/lib/utils";

type Props = {
  revenue: number;
  expenses: number;
  profit: number;
};

const COLORS = ["#1b6b7a", "#4a6fa5", "#2f9e7c"];

export function DistributionDonut({ revenue, expenses, profit }: Props) {
  const safeRevenue = Math.max(0, revenue);
  const safeExpenses = Math.max(0, expenses);
  const safeProfit = Math.max(0, profit);

  const data = [
    { name: "Omzet", value: safeRevenue, color: COLORS[0] },
    { name: "Kosten", value: safeExpenses, color: COLORS[1] },
    { name: "Winst", value: safeProfit, color: COLORS[2] },
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Tooltip
            formatter={(value: number, name: string) => [`${formatBedrag(value)} (${((value / total) * 100).toFixed(0)}%)`, name]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #d6e1e7",
              boxShadow: "0 16px 50px -30px rgba(15, 47, 58, 0.35)",
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
