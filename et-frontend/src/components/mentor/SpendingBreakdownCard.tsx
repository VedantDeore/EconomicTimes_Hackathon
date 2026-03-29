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
    Groceries: "bg-[#00D09C]",
    Utilities: "bg-[#00D09C]",
    Entertainment: "bg-amber-500",
    Education: "bg-indigo-500",
    Other: "bg-gray-500",
  };

  return (
    <div className="mt-2 rounded-xl border border-[#00D09C]/20 bg-gradient-to-br from-gray-50 to-[#00D09C]/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <IndianRupee size={13} className="text-[#00D09C]" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#00D09C]/90">
          Spending Analysis
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-lg bg-gray-100 p-2 text-center">
          <p className="text-[9px] text-gray-400 uppercase">Income</p>
          <p className="text-xs font-bold text-gray-900">
            {formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 p-2 text-center">
          <p className="text-[9px] text-gray-400 uppercase">Expenses</p>
          <p className="text-xs font-bold text-gray-900">
            {formatCurrency(monthlyExpenses)}
          </p>
        </div>
        <div className="rounded-lg bg-[#00D09C]/10 border border-[#00D09C]/20 p-2 text-center">
          <p className="text-[9px] text-[#00D09C]/90 uppercase">Surplus</p>
          <p className="text-xs font-bold text-[#00D09C]">
            {formatCurrency(monthlySurplus)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-gray-500">Savings Rate</span>
        <span
          className={`text-xs font-bold ${savingsRate >= idealRate ? "text-[#00D09C]" : "text-amber-400"}`}
        >
          {savingsRate}%{" "}
          <span className="text-[9px] text-gray-400 font-normal">
            (ideal: {idealRate}%)
          </span>
        </span>
      </div>

      <div className="h-2 rounded-full bg-gray-200 overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${savingsRate >= idealRate ? "bg-[#00D09C]" : "bg-amber-500"}`}
          style={{ width: `${Math.min(savingsRate, 100)}%` }}
        />
      </div>

      {Object.keys(breakdown).length > 0 && (
        <div className="space-y-1.5 border-t border-gray-200 pt-3">
          {Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6)
            .map(([category, amount]) => (
              <div key={category} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-600">{category}</span>
                  <span className="text-gray-500">
                    {formatCurrency(amount)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${CATEGORY_COLORS[category] || "bg-gray-500"}`}
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
          <span className="text-[10px] text-amber-800">
            Save {formatCurrency(savingsGap)}/month more to hit {idealRate}%
            savings rate
          </span>
        </div>
      )}
    </div>
  );
}
