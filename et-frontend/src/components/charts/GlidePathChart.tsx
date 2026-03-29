"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface GlidePathRow {
  year: number;
  equity: number;
  debt: number;
  gold: number;
  cash: number;
}

export interface GlidePathChartProps {
  data: GlidePathRow[];
}

export default function GlidePathChart({ data }: GlidePathChartProps) {
  return (
    <div className="h-[min(24rem,60vh)] w-full rounded-xl bg-gray-50 p-4 text-gray-700">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gpEquity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="gpDebt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00D09C" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#00a882" stopOpacity={0.5} />
            </linearGradient>
            <linearGradient id="gpGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.85} />
              <stop offset="100%" stopColor="#d97706" stopOpacity={0.55} />
            </linearGradient>
            <linearGradient id="gpCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d1d5db" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#9ca3af" stopOpacity={0.65} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={{ fill: "#4b5563", fontSize: 11 }}
            tickLine={{ stroke: "#d1d5db" }}
          />
          <YAxis
            tick={{ fill: "#4b5563", fontSize: 11 }}
            tickLine={{ stroke: "#d1d5db" }}
            tickFormatter={(v) => `${v}%`}
            domain={[0, 100]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#1e2330",
            }}
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value);
              return [`${Number.isFinite(v) ? v.toFixed(1) : "0"}%`, ""];
            }}
          />
          <Area
            type="monotone"
            dataKey="equity"
            stackId="gp"
            stroke="#a5b4fc"
            strokeWidth={1}
            fill="url(#gpEquity)"
            isAnimationActive
            animationDuration={700}
          />
          <Area
            type="monotone"
            dataKey="debt"
            stackId="gp"
            stroke="#00D09C"
            strokeWidth={1}
            fill="url(#gpDebt)"
            isAnimationActive
            animationDuration={700}
          />
          <Area
            type="monotone"
            dataKey="gold"
            stackId="gp"
            stroke="#fde68a"
            strokeWidth={1}
            fill="url(#gpGold)"
            isAnimationActive
            animationDuration={700}
          />
          <Area
            type="monotone"
            dataKey="cash"
            stackId="gp"
            stroke="#e5e7eb"
            strokeWidth={1}
            fill="url(#gpCash)"
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
