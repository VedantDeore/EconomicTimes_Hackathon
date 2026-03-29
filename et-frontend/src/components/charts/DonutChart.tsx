"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface DonutSlice {
  name: string;
  value: number;
  color?: string;
}

const DEFAULT_COLORS = ["#00D09C", "#00D09C", "#f59e0b", "#8b5cf6"];

export interface DonutChartProps {
  data: DonutSlice[];
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="h-[min(22rem,55vh)] w-full rounded-xl bg-gray-50 p-4 text-gray-900">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 108, bottom: 8, left: 8 }}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            stroke="#e5e7eb"
            strokeWidth={2}
            isAnimationActive
            animationDuration={750}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              color: "#1e2330",
            }}
            formatter={(value, _name, item) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              const pct = total ? ((v / total) * 100).toFixed(1) : "0";
              const label = (item.payload as DonutSlice)?.name ?? "";
              return [`${v.toLocaleString("en-IN")} (${pct}%)`, label];
            }}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            formatter={(_value, entry) => {
              const slice = entry.payload as DonutSlice;
              const v = slice?.value ?? 0;
              const pct = total ? ((v / total) * 100).toFixed(1) : "0";
              return `${slice?.name ?? ""} (${pct}%)`;
            }}
            wrapperStyle={{ paddingLeft: 12 }}
          />
          {(centerLabel != null || centerValue != null) && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
              {centerLabel != null && (
                <tspan x="50%" dy={centerValue != null ? "-0.55em" : "0"} fill="#6b7280" fontSize={11}>
                  {centerLabel}
                </tspan>
              )}
              {centerValue != null && (
                <tspan x="50%" dy={centerLabel != null ? "1.15em" : "0"} fill="#1e2330" fontSize={17} fontWeight={600}>
                  {centerValue}
                </tspan>
              )}
            </text>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
