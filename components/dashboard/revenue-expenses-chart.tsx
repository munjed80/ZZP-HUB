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
              <stop offset="5%" stopColor="#0d9488" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="kostenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#64748b" stopOpacity={0.08} />
              <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatBedrag(value as number)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            width={80}
          />
          <Tooltip
            formatter={(value) => formatBedrag(Number(value))}
            labelStyle={{ color: "#0f172a", fontWeight: 500 }}
            contentStyle={{ 
              borderRadius: 8, 
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12, color: "#64748b" }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="omzet"
            name="Omzet"
            stroke="#0d9488"
            strokeWidth={2}
            fill="url(#omzetGradient)"
            activeDot={{ r: 4, fill: "#0d9488" }}
          />
          <Area
            type="monotone"
            dataKey="kosten"
            name="Kosten"
            stroke="#64748b"
            strokeWidth={2}
            fill="url(#kostenGradient)"
            activeDot={{ r: 4, fill: "#64748b" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
