"use client";

import {
  User,
  MapPin,
  Briefcase,
  Shield,
  Heart,
  TrendingUp,
  Wallet,
  Target,
  Flame,
  IndianRupee,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Props {
  data: Record<string, unknown>;
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg bg-gray-100 border border-gray-200 p-2.5 text-center">
      <Icon size={14} className={`mx-auto mb-1 ${color}`} />
      <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-bold text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}

export default function ProfileSnapshotInlineCard({ data }: Props) {
  const name = String(data.full_name ?? "User");
  const age = data.age ? Number(data.age) : null;
  const city = data.city ? String(data.city) : null;
  const employment = String(data.employment_type ?? "salaried");
  const riskProfile = String(data.risk_profile ?? "moderate");
  const grossSalary = Number(data.gross_salary ?? 0);
  const netWorth = Number(data.net_worth ?? 0);
  const totalInvestments = Number(data.total_investments ?? 0);
  const numInvestments = Number(data.num_investments ?? 0);
  const totalDebt = Number(data.total_debt ?? 0);
  const numGoals = Number(data.num_goals ?? 0);
  const lifeCover = Number(data.life_insurance_cover ?? 0);
  const healthCover = Number(data.health_insurance_cover ?? 0);
  const healthScore = data.health_score != null ? Number(data.health_score) : null;
  const fireNumber = data.fire_number != null ? Number(data.fire_number) : null;
  const monthlySurplus = Number(data.monthly_surplus ?? 0);

  return (
    <div className="mt-3 rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-50 to-indigo-50/70 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold text-lg shadow-sm">
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{name}</p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 flex-wrap">
            {age && <span className="flex items-center gap-0.5"><User size={10} /> {age} yrs</span>}
            {city && (
              <>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-0.5"><MapPin size={10} /> {city}</span>
              </>
            )}
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-0.5 capitalize"><Briefcase size={10} /> {employment}</span>
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-0.5 capitalize"><Shield size={10} /> {riskProfile}</span>
          </div>
        </div>
      </div>

      {/* Key stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox
          icon={Wallet}
          label="Net Worth"
          value={formatCurrency(netWorth)}
          color={netWorth >= 0 ? "text-[#00D09C]" : "text-rose-400"}
        />
        <StatBox
          icon={IndianRupee}
          label="Annual Income"
          value={grossSalary > 0 ? formatCurrency(grossSalary) : "—"}
          color="text-[#00D09C]"
        />
        <StatBox
          icon={Heart}
          label="Health Score"
          value={healthScore != null ? `${healthScore}/100` : "—"}
          color="text-pink-400"
        />
      </div>

      {/* Details rows */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Investments</span>
            <span className="text-gray-900 font-medium">
              {formatCurrency(totalInvestments)} ({numInvestments})
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400">Debts</span>
            <span className={`font-medium ${totalDebt > 0 ? "text-rose-600" : "text-[#00D09C]"}`}>
              {totalDebt > 0 ? formatCurrency(totalDebt) : "Debt Free"}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 flex items-center gap-1"><Target size={9} /> Goals</span>
            <span className="text-gray-900 font-medium">{numGoals} set</span>
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 border border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-gray-400 flex items-center gap-1"><TrendingUp size={9} /> Surplus</span>
            <span className={`font-medium ${monthlySurplus >= 0 ? "text-[#00D09C]" : "text-rose-600"}`}>
              {formatCurrency(monthlySurplus)}/mo
            </span>
          </div>
        </div>
      </div>

      {/* Insurance & FIRE row */}
      <div className="flex gap-2">
        {(lifeCover > 0 || healthCover > 0) && (
          <div className="flex-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
            <p className="text-[9px] text-blue-800 uppercase mb-1">Insurance Cover</p>
            <div className="flex gap-3 text-[10px]">
              <span className="text-gray-600">Life: <strong className="text-gray-900">{formatCurrency(lifeCover)}</strong></span>
              <span className="text-gray-600">Health: <strong className="text-gray-900">{formatCurrency(healthCover)}</strong></span>
            </div>
          </div>
        )}
        {fireNumber != null && fireNumber > 0 && (
          <div className="flex-1 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
            <div className="flex items-center gap-1">
              <Flame size={10} className="text-orange-400" />
              <p className="text-[9px] text-orange-800 uppercase">FIRE Number</p>
            </div>
            <p className="text-xs font-bold text-gray-900 mt-0.5">{formatCurrency(fireNumber)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
