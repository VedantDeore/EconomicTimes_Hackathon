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
    <div className="mt-2 rounded-xl border border-orange-500/20 bg-gradient-to-br from-gray-50 to-orange-50/80 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flame size={13} className="text-orange-400" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-orange-700">
          FIRE Plan
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-100 p-3 text-center">
          <p className="text-[9px] text-gray-400 uppercase mb-1">
            FIRE Number
          </p>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(fireNumber)}
          </p>
        </div>
        <div className="rounded-lg bg-gray-100 p-3 text-center">
          <p className="text-[9px] text-gray-400 uppercase mb-1">
            Years to FIRE
          </p>
          <p className="text-lg font-bold text-gray-900">
            {yearsToFire}{" "}
            <span className="text-xs text-gray-500 font-normal">yrs</span>
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="flex items-center justify-between rounded-lg bg-[#00D09C]/10 border border-[#00D09C]/20 px-3 py-2">
          <span className="text-[10px] text-[#00D09C]/90">Monthly SIP</span>
          <span className="text-xs font-bold text-[#00D09C]">
            {formatCurrency(monthlySip)}
          </span>
        </div>
        {successProb > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-[#00D09C]/10 border border-[#00D09C]/20 px-3 py-2">
            <span className="text-[10px] text-[#00D09C]/90">Success</span>
            <span className="text-xs font-bold text-[#00D09C]">
              {Math.round(successProb)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
