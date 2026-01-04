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
              <stop offset="5%" stopColor="#1b6b7a" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#1b6b7a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="kostenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4a6fa5" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#4a6fa5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#d6e1e7" vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#547189" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatBedrag(value as number)}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#547189" }}
            width={80}
          />
          <Tooltip
            formatter={(value) => formatBedrag(Number(value))}
            labelStyle={{ color: "#0f2f3a", fontWeight: 600 }}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #d6e1e7",
              boxShadow: "0 16px 50px -30px rgba(15, 47, 58, 0.35)",
              background: "#ffffff",
            }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 12, color: "#4a6076" }}
            iconType="line"
          />
          <Area
            type="monotone"
            dataKey="omzet"
            name="Omzet"
            stroke="#1b6b7a"
            strokeWidth={2.5}
            fill="url(#omzetGradient)"
            activeDot={{ r: 4, fill: "#1b6b7a", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="kosten"
            name="Kosten"
            stroke="#4a6fa5"
            strokeWidth={2.5}
            fill="url(#kostenGradient)"
            activeDot={{ r: 4, fill: "#4a6fa5", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
