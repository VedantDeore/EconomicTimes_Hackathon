"use client";

import { Flame } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

export default function FireProgressCard({ data }: Props) {
  const fireNumber = Number(data.fire_number ?? 0);
  const yearsToFire = Number(data.years_to_fire ?? 0);
  const monthlySip = Number(
    data.monthly_sip_needed ?? data.monthly_sip_required ?? 0
  );
  const successProb = Number(data.success_probability ?? 0);

  return (
    <div className="mt-2 rounded-xl border border-orange-500/20 bg-gradient-to-br from-slate-950/80 to-orange-950/20 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={13} className="text-orange-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-orange-300/80">
          FIRE Plan
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-slate-800/50 p-3 text-center">
          <p className="text-[9px] text-slate-500 uppercase mb-1">
            FIRE Number
          </p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(fireNumber)}
          </p>
        </div>
        <div className="rounded-lg bg-slate-800/50 p-3 text-center">
          <p className="text-[9px] text-slate-500 uppercase mb-1">
            Years to FIRE
          </p>
          <p className="text-lg font-bold text-white">
            {yearsToFire}{" "}
            <span className="text-xs text-slate-400 font-normal">yrs</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-2">
          <span className="text-[10px] text-cyan-300/80">Monthly SIP</span>
          <span className="text-xs font-bold text-cyan-300">
            {formatCurrency(monthlySip)}
          </span>
        </div>
        {successProb > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
            <span className="text-[10px] text-emerald-300/80">Success</span>
            <span className="text-xs font-bold text-emerald-300">
              {Math.round(successProb)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
