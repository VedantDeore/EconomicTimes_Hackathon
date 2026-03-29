"use client";

import { Wallet, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

export default function NetWorthCard({ data }: Props) {
  const netWorth = Number(data.net_worth ?? 0);
  const totalAssets = Number(data.total_assets ?? 0);
  const totalLiabilities = Number(data.total_liabilities ?? 0);
  const assetsBreakdown = (data.assets_breakdown ?? {}) as Record<
    string,
    number
  >;
  const liabilitiesBreakdown = (data.liabilities_breakdown ?? {}) as Record<
    string,
    number
  >;
  const lifeCover = Number(data.life_insurance_cover ?? 0);
  const healthCover = Number(data.health_insurance_cover ?? 0);

  return (
    <div className="mt-2 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-950/80 to-emerald-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Wallet size={13} className="text-emerald-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300/80">
          Net Worth Summary
        </span>
      </div>

      <div className="text-center mb-3">
        <p className="text-[10px] text-slate-500 uppercase mb-1">Net Worth</p>
        <p
          className={`text-2xl font-bold ${netWorth >= 0 ? "text-emerald-400" : "text-rose-400"}`}
        >
          {formatCurrency(netWorth)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp size={11} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-300/80 uppercase">
              Assets
            </span>
          </div>
          <p className="text-sm font-bold text-white mb-2">
            {formatCurrency(totalAssets)}
          </p>
          <div className="space-y-1">
            {Object.entries(assetsBreakdown)
              .slice(0, 4)
              .map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between text-[10px]"
                >
                  <span className="text-slate-400">{key}</span>
                  <span className="text-slate-300">
                    {formatCurrency(val)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingDown size={11} className="text-rose-400" />
            <span className="text-[10px] text-rose-300/80 uppercase">
              Liabilities
            </span>
          </div>
          <p className="text-sm font-bold text-white mb-2">
            {formatCurrency(totalLiabilities)}
          </p>
          <div className="space-y-1">
            {Object.entries(liabilitiesBreakdown)
              .slice(0, 4)
              .map(([key, val]) => (
                <div
                  key={key}
                  className="flex justify-between text-[10px]"
                >
                  <span className="text-slate-400">{key}</span>
                  <span className="text-slate-300">
                    {formatCurrency(val)}
                  </span>
                </div>
              ))}
            {Object.keys(liabilitiesBreakdown).length === 0 && (
              <p className="text-[10px] text-slate-500">Debt free!</p>
            )}
          </div>
        </div>
      </div>

      {(lifeCover > 0 || healthCover > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-700/40 pt-3">
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase">Life Cover</p>
            <p className="text-xs font-semibold text-white">
              {formatCurrency(lifeCover)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-slate-500 uppercase">Health Cover</p>
            <p className="text-xs font-semibold text-white">
              {formatCurrency(healthCover)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
