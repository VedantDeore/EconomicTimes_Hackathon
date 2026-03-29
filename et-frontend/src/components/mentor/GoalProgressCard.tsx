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
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-cyan-500";
  if (pct >= 25) return "bg-amber-500";
  return "bg-rose-500";
}

function progressGlow(pct: number): string {
  if (pct >= 75) return "shadow-emerald-500/40";
  if (pct >= 50) return "shadow-cyan-500/40";
  if (pct >= 25) return "shadow-amber-500/40";
  return "shadow-rose-500/40";
}

export default function GoalProgressCard({ data }: Props) {
  const goals = (data.goals ?? []) as GoalItem[];
  const totalGoals = Number(data.total_goals ?? 0);

  if (goals.length === 0) {
    return (
      <div className="mt-2 rounded-xl border border-amber-500/20 bg-slate-950/60 p-4 text-center text-xs text-slate-400">
        No goals set yet. Go to Money Profile to add goals.
      </div>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-950/80 to-amber-950/20 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={13} className="text-amber-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-amber-300/80">
            Goal Progress
          </span>
        </div>
        <span className="text-[10px] text-slate-500">
          {totalGoals} goal{totalGoals !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {goals.slice(0, 5).map((goal) => (
          <div key={goal.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-white font-medium">
                  {goal.name}
                </span>
                <span className="rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[9px] text-slate-400 capitalize">
                  {goal.category}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-300">
                {goal.progress_pct}%
              </span>
            </div>

            <div className="relative h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${progressColor(goal.progress_pct)} shadow-sm ${progressGlow(goal.progress_pct)} transition-all duration-500`}
                style={{ width: `${Math.min(goal.progress_pct, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500">
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
