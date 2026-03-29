"use client";

import { Receipt, ArrowRight, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

export default function TaxComparisonCard({ data }: Props) {
  const oldTax = Number(data.old_regime_tax ?? 0);
  const newTax = Number(data.new_regime_tax ?? 0);
  const savings = Number(data.savings ?? 0);
  const recommended = String(data.recommended_regime ?? "new");

  return (
    <div className="mt-2 rounded-xl border border-amber-500/20 bg-gradient-to-br from-slate-950/80 to-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Receipt size={13} className="text-amber-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-amber-300/80">
          Tax Regime Comparison
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div
          className={`rounded-lg p-3 text-center ${
            recommended === "old"
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "border border-slate-700/40 bg-slate-800/40"
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <p className="text-[10px] text-slate-400 uppercase">Old Regime</p>
            {recommended === "old" && (
              <CheckCircle2 size={11} className="text-emerald-400" />
            )}
          </div>
          <p className="text-lg font-bold text-white">
            {formatCurrency(oldTax)}
          </p>
        </div>

        <div
          className={`rounded-lg p-3 text-center ${
            recommended === "new"
              ? "border border-emerald-500/30 bg-emerald-500/10"
              : "border border-slate-700/40 bg-slate-800/40"
          }`}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <p className="text-[10px] text-slate-400 uppercase">New Regime</p>
            {recommended === "new" && (
              <CheckCircle2 size={11} className="text-emerald-400" />
            )}
          </div>
          <p className="text-lg font-bold text-white">
            {formatCurrency(newTax)}
          </p>
        </div>
      </div>

      {savings > 0 && (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <ArrowRight size={12} className="text-emerald-400" />
          <span className="text-xs text-emerald-300">
            Save{" "}
            <span className="font-bold">{formatCurrency(savings)}</span> with{" "}
            {recommended === "old" ? "Old" : "New"} Regime
          </span>
        </div>
      )}
    </div>
  );
}
