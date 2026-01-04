"use client";

import {
  Area,
  AreaChart,
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
    <div className="w-full overflow-x-auto">
      <ResponsiveContainer width="100%" height={320} minWidth={300}>
        <AreaChart data={data} margin={{ left: -16 }}>
          <defs>
            <linearGradient id="omzetGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="kostenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatBedrag(value as number)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12 }}
            width={80}
          />
          <Tooltip
            formatter={(value) => formatBedrag(Number(value))}
            labelStyle={{ color: "#334155" }}
            contentStyle={{ borderRadius: 12, borderColor: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="omzet"
            name="Omzet"
            stroke="#16a34a"
            strokeWidth={2.4}
            fill="url(#omzetGradient)"
            activeDot={{ r: 5 }}
          />
          <Area
            type="monotone"
            dataKey="kosten"
            name="Kosten"
            stroke="#f97316"
            strokeWidth={2.4}
            fill="url(#kostenGradient)"
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
