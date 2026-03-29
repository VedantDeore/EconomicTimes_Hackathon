"use client";

import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface GoalItem {
  name: string;
  category: string;
  target: number;
  current: number;
  progress_pct: number;
  target_date: string;
  monthly_sip: number;
}

interface Props {
  data: Record<string, unknown>;
}

function progressColor(pct: number): string {
  if (pct >= 75) return "bg-[#00D09C]";
  if (pct >= 50) return "bg-[#00D09C]";
  if (pct >= 25) return "bg-amber-500";
  return "bg-rose-500";
}

function progressGlow(pct: number): string {
  if (pct >= 75) return "shadow-sm";
  if (pct >= 50) return "shadow-sm";
  if (pct >= 25) return "shadow-amber-500/40";
  return "shadow-rose-500/40";
}

export default function GoalProgressCard({ data }: Props) {
  const goals = (data.goals ?? []) as GoalItem[];
  const totalGoals = Number(data.total_goals ?? 0);

  if (goals.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-amber-500/20 bg-gray-100 p-4 text-center text-xs text-gray-500">
        No goals set yet. Go to Money Profile to add goals.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-amber-500/20 bg-gradient-to-br from-gray-50 to-amber-50/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={13} className="text-amber-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-amber-800">
            Goal Progress
          </span>
        </div>
        <span className="text-[10px] text-gray-400">
          {totalGoals} goal{totalGoals !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {goals.slice(0, 5).map((goal) => (
          <div key={goal.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-900 font-medium">
                  {goal.name}
                </span>
                <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[9px] text-gray-500 capitalize">
                  {goal.category}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-gray-600">
                {goal.progress_pct}%
              </span>
            </div>

            <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${progressColor(goal.progress_pct)} shadow-sm ${progressGlow(goal.progress_pct)} transition-all duration-500`}
                style={{ width: `${Math.min(goal.progress_pct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>
                {formatCurrency(goal.current)} / {formatCurrency(goal.target)}
              </span>
              {goal.target_date && (
                <span>
                  by{" "}
                  {new Date(goal.target_date).toLocaleDateString("en-IN", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
