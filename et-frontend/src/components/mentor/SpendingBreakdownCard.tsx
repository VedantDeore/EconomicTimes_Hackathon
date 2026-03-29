"use client";

import { IndianRupee } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

export default function SpendingBreakdownCard({ data }: Props) {
  const monthlyIncome = Number(data.monthly_income ?? 0);
  const monthlyExpenses = Number(data.monthly_expenses ?? 0);
  const monthlySurplus = Number(data.monthly_surplus ?? 0);
  const savingsRate = Number(data.savings_rate_pct ?? 0);
  const idealRate = Number(data.ideal_savings_rate ?? 30);
  const savingsGap = Number(data.savings_gap ?? 0);
  const breakdown = (data.expense_breakdown ?? {}) as Record<string, number>;

  const maxExpense = Math.max(...Object.values(breakdown), 1);

  const CATEGORY_COLORS: Record<string, string> = {
    Rent: "bg-violet-500",
    Emi: "bg-rose-500",
    Groceries: "bg-emerald-500",
    Utilities: "bg-cyan-500",
    Entertainment: "bg-amber-500",
    Education: "bg-indigo-500",
    Other: "bg-slate-500",
  };

  return (
    <div className="mt-2 rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-950/80 to-cyan-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <IndianRupee size={13} className="text-cyan-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-cyan-300/80">
          Spending Analysis
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-slate-800/50 p-2 text-center">
          <p className="text-[9px] text-slate-500 uppercase">Income</p>
          <p className="text-xs font-bold text-white">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-2 text-center">
          <p className="text-[9px] text-slate-500 uppercase">Expenses</p>
          <p className="text-xs font-bold text-white">
            {formatCurrency(monthlyExpenses)}
          </p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
          <p className="text-[9px] text-emerald-300/80 uppercase">Surplus</p>
          <p className="text-xs font-bold text-emerald-300">
            {formatCurrency(monthlySurplus)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-400">Savings Rate</span>
        <span
          className={`text-xs font-bold ${savingsRate >= idealRate ? "text-emerald-400" : "text-amber-400"}`}
        >
          {savingsRate}%{" "}
          <span className="text-[9px] text-slate-500 font-normal">
            (ideal: {idealRate}%)
          </span>
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${savingsRate >= idealRate ? "bg-emerald-500" : "bg-amber-500"}`}
          style={{ width: `${Math.min(savingsRate, 100)}%` }}
        />
      </div>

      {Object.keys(breakdown).length > 0 && (
        <div className="space-y-1.5 border-t border-slate-700/40 pt-3">
          {Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([category, amount]) => (
              <div key={category} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-300">{category}</span>
                  <span className="text-slate-400">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[category] || "bg-slate-500"}`}
                    style={{
                      width: `${(amount / maxExpense) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      )}

      {savingsGap > 0 && (
        <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-center">
          <span className="text-[10px] text-amber-300">
            Save {formatCurrency(savingsGap)}/month more to hit {idealRate}%
            savings rate
          </span>
        </div>
      )}
    </div>
  );
}
