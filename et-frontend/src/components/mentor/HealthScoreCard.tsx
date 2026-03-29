"use client";

import { Heart } from "lucide-react";

interface Props {
  data: Record<string, unknown>;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#00D09C";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Critical";
}

export default function HealthScoreCard({ data }: Props) {
  const overallScore = Number(
    data.overall_score ?? data.score ?? data.health_score ?? 0
  );
  const dimensions = (data.dimensions ??
    data.recommendations ??
    {}) as Record<string, { score?: number; max?: number; status?: string }>;

  const color = scoreColor(overallScore);
  const label = scoreLabel(overallScore);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (overallScore / 100) * circumference;

  const dimensionEntries = Object.entries(dimensions).filter(
    ([, v]) => v && typeof v === "object" && "score" in v
  );

  return (
    <div className="mt-2 rounded-xl border border-pink-500/20 bg-gradient-to-br from-gray-50 to-pink-50/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={13} className="text-pink-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-pink-800">
          Financial Health
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-gray-900">
              {Math.round(overallScore)}
            </span>
            <span className="text-[9px] text-gray-500">/ 100</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color }}>
            {label}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Your financial health score across 6 dimensions
          </p>

          {dimensionEntries.length > 0 && (
            <div className="mt-2 space-y-1">
              {dimensionEntries.slice(0, 4).map(([key, dim]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${dim.score ?? 0}%`,
                        backgroundColor: scoreColor(dim.score ?? 0),
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-gray-400 w-20 truncate capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
