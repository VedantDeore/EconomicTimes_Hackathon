"use client";

import { motion } from "framer-motion";
import {
  ShieldAlert,
  Smartphone,
  Zap,
  Activity,
  ArrowRightLeft,
  ChevronRight,
  Target,
  Users
} from "lucide-react";
import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";

// --- Types ---
export type HealthStats = {
  score: number;
  equityPct: number;
  debtPct: number;
  expenseDragTotal: number;
};

export type SwitchRec = {
  from: string;
  to: string;
  reason: string;
  impact: string;
  type: "expense" | "overlap" | "risk";
};

// 1. Health Score Component
export function HealthScoreGauge({ score }: { score: number }) {
  // Simple SVG Gauge
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "text-red-500";
  let status = "Needs Attention";
  if (score >= 80) {
    color = "text-emerald-500";
    status = "Excellent";
  } else if (score >= 60) {
    color = "text-amber-500";
    status = "Fair";
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-slate-800"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-white">
            {Math.round(score)}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
            Score
          </span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <h4 className="text-sm font-semibold text-white">Portfolio Health</h4>
        <p className={cn("text-xs font-medium", color)}>{status}</p>
      </div>
    </div>
  );
}

// 2. AI Persona Money Mentor
export function AIMentorPersona({
  age,
  risk,
  onAgeChange,
  onRiskChange,
  currentEquity,
  currentDebt,
}: {
  age: number;
  risk: string;
  onAgeChange: (a: number) => void;
  onRiskChange: (r: string) => void;
  currentEquity: number;
  currentDebt: number;
}) {
  // Simple heuristic
  let targetEquity = 100 - age;
  if (risk === "aggressive" || risk === "very_aggressive") targetEquity += 10;
  if (risk === "conservative") targetEquity -= 15;
  targetEquity = Math.max(10, Math.min(95, targetEquity)); // Cap

  const targetDebt = 100 - targetEquity;

  const diff = Math.abs(currentEquity - targetEquity);
  let advice = `You're perfectly aligned with an optimized ${targetEquity}% equity strategy.`;
  if (currentEquity > targetEquity + 10) {
    advice = `You are heavily overexposed to Equity (${currentEquity.toFixed(0)}% vs target ${targetEquity.toFixed(0)}%). Consider securing downside risk.`;
  } else if (currentEquity < targetEquity - 10) {
    advice = `You are playing too safe! Boost your Equity allocation to ~${targetEquity.toFixed(0)}% for optimal long-term compounding.`;
  }

  return (
    <div className="flex h-full flex-col justify-center gap-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
      <div className="flex items-center gap-2 text-indigo-300">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold">AI Money Mentor</h3>
      </div>
      <div className="flex flex-wrap items-center gap-3 space-y-1">
        <div className="flex flex-col">
          <label className="text-[10px] font-semibold uppercase text-slate-400">Your Age</label>
          <input
            type="number"
            min={18}
            max={100}
            value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className="w-16 rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-semibold uppercase text-slate-400">Risk Profile</label>
          <select
            value={risk}
            onChange={(e) => onRiskChange(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>
      <div className="mt-2 rounded-lg bg-black/20 p-3">
        <p className="text-sm font-medium text-slate-200">
          <Target className="mr-1.5 inline h-4 w-4 text-emerald-400" />
          Target Mix: <span className="text-emerald-300">{targetEquity.toFixed(0)}% Eq</span> / <span className="text-cyan-300">{targetDebt.toFixed(0)}% Debt/Gold</span>
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
          {advice}
        </p>
      </div>
    </div>
  );
}

// 3. iPhone Expense Leakage
export function ExpenseLeakage({ expenseDrag10y }: { expenseDrag10y: number }) {
  const iphoneCost = 80000;
  const iphonesLost = (expenseDrag10y / iphoneCost).toFixed(1);

  if (expenseDrag10y < 10000) {
    return (
      <div className="flex h-full items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-200">
        <Zap className="h-8 w-8 shrink-0 text-emerald-400" />
        <p className="text-sm">Your expense ratio drag is incredibly low! Excellent job hunting down highly optimized, direct funds.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-rose-300">Expense Fee Leakage</h3>
        <Smartphone className="h-5 w-5 text-rose-400" />
      </div>
      <p className="text-2xl font-bold tracking-tight text-white">{formatCurrency(expenseDrag10y)}</p>
      <p className="text-sm text-rose-200/80">
        Lost completely to fund manager fees over the next 10 years.
      </p>
      <div className="mt-2 text-sm font-medium text-rose-300">
        That is equivalent to buying a brand new iPhone every {(10 / parseFloat(iphonesLost)).toFixed(1)} years!
      </div>
    </div>
  );
}

// 4. Actionable Target Switch Matrix
export function SwitchRecommendations({ recs }: { recs: SwitchRec[] }) {
  if (recs.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-300">
        <ArrowRightLeft className="h-5 w-5" />
        AI Switch Engine Recommendations
      </h3>
      <div className="grid gap-3 lg:grid-cols-2">
        {recs.map((r, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-black/20 p-4">
            <div className="flex flex-col border-b border-white/5 pb-2 text-sm">
              <span className="text-slate-400 line-through">Out: {r.from}</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-300">
                <ChevronRight className="h-3 w-3" /> In: {r.to}
              </span>
            </div>
            <p className="text-[13px] text-amber-100/90">{r.reason}</p>
            <p className="mt-1 text-xs font-bold text-emerald-400">{r.impact}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Future Scenario Simulator
export function FutureScenarioSimulator({
  totalValue,
  equityPct,
  debtPct
}: {
  totalValue: number;
  equityPct: number;
  debtPct: number;
}) {
  const [scenario, setScenario] = useState<"normal" | "crash" | "bull">("normal");

  // A 30% crash wipes 30% off equity.
  const eqValue = totalValue * (equityPct / 100);
  const debtValue = totalValue * (debtPct / 100);

  let simulatedValue = totalValue;
  if (scenario === "crash") {
    simulatedValue = (eqValue * 0.7) + debtValue;
  } else if (scenario === "bull") {
    simulatedValue = (eqValue * 1.25) + debtValue; // 25% run
  }

  const diff = simulatedValue - totalValue;

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h3 className="font-semibold text-cyan-300">Smart Stress Test Simulator</h3>
        </div>
        <div className="flex gap-2 rounded-lg bg-black/40 p-1">
          <button
            onClick={() => setScenario("crash")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              scenario === "crash" ? "bg-rose-500/80 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            -30% Market Crash
          </button>
          <button
            onClick={() => setScenario("normal")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              scenario === "normal" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            Normal
          </button>
          <button
            onClick={() => setScenario("bull")}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              scenario === "bull" ? "bg-emerald-500/80 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            +25% Bull Run
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4 items-center">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-500">Current Value</span>
          <span className="text-xl font-mono text-slate-200">{formatCurrency(totalValue)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-500">Equity Protection</span>
          <span className="text-lg font-mono text-emerald-400">{debtPct.toFixed(0)}% Safe</span>
        </div>
        <div className="flex flex-col col-span-2 rounded-xl bg-black/30 p-3">
          <span className="text-xs uppercase tracking-wide text-cyan-500">Simulated Worth</span>
          <div className="flex items-end gap-3">
            <motion.span
              key={simulatedValue}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "text-2xl font-mono font-bold",
                scenario === "crash" ? "text-rose-400" : scenario === "bull" ? "text-emerald-400" : "text-white"
              )}
            >
              {formatCurrency(simulatedValue)}
            </motion.span>
            {scenario !== "normal" && (
              <span className={cn("mb-1 text-sm font-medium", diff > 0 ? "text-emerald-400" : "text-rose-400")}>
                {diff > 0 ? "+" : ""}{formatCurrency(diff)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
