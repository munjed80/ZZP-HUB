"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBedrag } from "@/lib/utils";

export type ChartPoint = {
  month: string;
  omzet: number;
  kosten: number;
};

export function RevenueExpensesChart({ data }: { data: ChartPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickFormatter={(value) => formatBedrag(value as number)} tickLine={false} axisLine={false} />
        <Tooltip
          formatter={(value) => formatBedrag(Number(value))}
          labelStyle={{ color: "#334155" }}
          contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
        />
        <Legend />
        <Bar dataKey="omzet" name="Omzet" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="kosten" name="Kosten" fill="#ef4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
