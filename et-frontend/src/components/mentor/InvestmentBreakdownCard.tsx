"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

const COLORS = [
  "#10b981",
  "#06b6d4",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#6366f1",
];

export default function InvestmentBreakdownCard({ data }: Props) {
  const breakdown = (data.breakdown ?? {}) as Record<string, number>;
  const totalValue = Number(data.total_value ?? 0);
  const numInvestments = Number(data.num_investments ?? 0);
  const totalSip = Number(data.total_monthly_sip ?? 0);

  const chartData = Object.entries(breakdown).map(([name, value]) => ({
    name,
    value,
  }));

  if (chartData.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-violet-500/20 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
        No investment data available
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-violet-500/20 bg-gradient-to-br from-slate-950/80 to-violet-950/30 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-violet-300/80">
          Portfolio Breakdown
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={28}
                outerRadius={48}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((_, idx) => (
                  <Cell
                    key={idx}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => formatCurrency(v)}
                contentStyle={{
                  background: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-1.5">
          {chartData.map((item, idx) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-[11px] text-slate-300">{item.name}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-200">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-700/40 pt-3">
        <div className="text-center">
          <p className="text-[9px] text-slate-500 uppercase">Total Value</p>
          <p className="text-xs font-bold text-white">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-500 uppercase">Holdings</p>
          <p className="text-xs font-bold text-white">{numInvestments}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-slate-500 uppercase">Monthly SIP</p>
          <p className="text-xs font-bold text-white">
            {formatCurrency(totalSip)}
          </p>
        </div>
      </div>
    </div>
  );
}
