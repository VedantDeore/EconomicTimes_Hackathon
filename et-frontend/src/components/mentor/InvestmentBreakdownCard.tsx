"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

const COLORS = [
  "#00D09C",
  "#00D09C",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#00D09C",
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
      <div className="mt-2 rounded-xl border border-violet-500/20 bg-gray-100 p-4 text-center text-xs text-gray-500">
        No investment data available
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-violet-500/20 bg-gradient-to-br from-gray-50 to-violet-50/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-violet-700">
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
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#1e2330",
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
                <span className="text-[11px] text-gray-600">{item.name}</span>
              </div>
              <span className="text-[11px] font-medium text-gray-700">
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-gray-200 pt-3">
        <div className="text-center">
          <p className="text-[9px] text-gray-400 uppercase">Total Value</p>
          <p className="text-xs font-bold text-gray-900">
            {formatCurrency(totalValue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-400 uppercase">Holdings</p>
          <p className="text-xs font-bold text-gray-900">{numInvestments}</p>
        </div>
        <div className="text-center">
          <p className="text-[9px] text-gray-400 uppercase">Monthly SIP</p>
          <p className="text-xs font-bold text-gray-900">
            {formatCurrency(totalSip)}
          </p>
        </div>
      </div>
    </div>
  );
}
