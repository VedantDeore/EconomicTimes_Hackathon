"use client";

import { MapPin, Shield, Briefcase, Heart, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { MentorContext } from "@/lib/mentorDataLoader";

interface Props {
  context: MentorContext;
}

export default function ProfileSnapshotCard({ context }: Props) {
  const p = context.profile;
  if (!p) return null;

  const stats = [
    {
      label: "Net Worth",
      value: formatCurrency(context.computed.net_worth),
      icon: TrendingUp,
      color: "text-[#00D09C]",
    },
    {
      label: "Health Score",
      value: context.health_score
        ? `${Math.round(context.health_score.overall_score)}/100`
        : "—",
      icon: Heart,
      color: "text-pink-400",
    },
    {
      label: "Risk Profile",
      value: p.risk_profile.charAt(0).toUpperCase() + p.risk_profile.slice(1),
      icon: Shield,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-50 to-indigo-50/60 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white font-bold text-lg shadow-sm">
          {p.full_name?.charAt(0) || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {p.full_name || "User"}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            {p.age && <span>{p.age} yrs</span>}
            {p.city && (
              <>
                <span className="text-gray-400">|</span>
                <span className="flex items-center gap-0.5">
                  <MapPin size={9} /> {p.city}
                </span>
              </>
            )}
            <span className="text-gray-400">|</span>
            <span className="flex items-center gap-0.5 capitalize">
              <Briefcase size={9} /> {p.employment_type}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg bg-gray-100 px-2 py-2 text-center"
          >
            <s.icon size={12} className={`mx-auto mb-1 ${s.color}`} />
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">
              {s.label}
            </p>
            <p className="text-xs font-semibold text-gray-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {context.income && context.income.gross_salary > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-[#00D09C]/10 border border-[#00D09C]/20 px-3 py-1.5">
          <span className="text-[10px] text-[#00D09C]/90">Annual Income</span>
          <span className="text-xs font-semibold text-[#00D09C]">
            {formatCurrency(context.income.gross_salary)}
          </span>
        </div>
      )}
    </div>
  );
}
