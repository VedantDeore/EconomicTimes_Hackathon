"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { isLocalEngineMode } from "@/lib/config";
import { computeHealthReport, profileToHealthInputs } from "@/lib/engine/health";
import { useProfileStore } from "@/store/profileStore";
import { formatCurrency, getScoreColor } from "@/lib/utils";
import {
  Flame,
  Heart,
  Calculator,
  PieChart,
  TrendingUp,
  Target,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface QuickStat {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

export default function DashboardPage() {
  const { isLoading } = useAuth();
  const localMode = isLocalEngineMode();
  const { fetchProfile } = useProfileStore();
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [totalInvestments, setTotalInvestments] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    async function load() {
      if (localMode) {
        await fetchProfile();
        const p = useProfileStore.getState().profile;
        if (p) {
          setMonthlyIncome((p.annual_income?.net || 0) / 12);
          const inv = p.existing_investments || {};
          setTotalInvestments(
            Object.values(inv).reduce((sum: number, v) => sum + (typeof v === "number" ? v : 0), 0)
          );
          setHealthScore(computeHealthReport(profileToHealthInputs(p)).overall_score);
        }
        return;
      }
      try {
        const [profileRes, healthRes] = await Promise.allSettled([
          api.get("/profile"),
          api.get("/health/report"),
        ]);

        if (profileRes.status === "fulfilled" && profileRes.value.data) {
          const p = profileRes.value.data as {
            annual_income?: { net?: number };
            existing_investments?: Record<string, number>;
          };
          setMonthlyIncome((p.annual_income?.net || 0) / 12);
          const inv = p.existing_investments || {};
          setTotalInvestments(
            Object.values(inv).reduce((sum: number, v) => sum + (typeof v === "number" ? v : 0), 0)
          );
        }
        if (healthRes.status === "fulfilled" && healthRes.value.data) {
          const h = healthRes.value.data as { overall_score?: number };
          if (h.overall_score != null) setHealthScore(h.overall_score);
        }
      } catch {
        /* graceful */
      }
    }
    if (!isLoading) void load();
  }, [isLoading, fetchProfile, localMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const quickStats: QuickStat[] = [
    {
      label: "Money Health Score",
      value: healthScore !== null ? `${healthScore}/100` : "—",
      icon: <Heart size={22} />,
      color: healthScore ? getScoreColor(healthScore) : "#64748b",
      href: "/money-health",
    },
    {
      label: "Total Investments",
      value: formatCurrency(totalInvestments),
      icon: <TrendingUp size={22} />,
      color: "#10b981",
      href: "/mf-xray",
    },
    {
      label: "Monthly Income (net/12)",
      value: formatCurrency(monthlyIncome),
      icon: <Target size={22} />,
      color: "#6366f1",
      href: "/fire-planner",
    },
    {
      label: "Tax Savings",
      value: "Analyze →",
      icon: <Calculator size={22} />,
      color: "#f59e0b",
      href: "/tax-wizard",
    },
  ];

  const features = [
    {
      title: "FIRE Path Planner",
      desc: "Build your month-by-month roadmap to financial independence",
      icon: <Flame size={28} />,
      gradient: "from-orange-500 to-red-500",
      href: "/fire-planner",
    },
    {
      title: "Money Health Score",
      desc: "Get your financial wellness score across 6 dimensions",
      icon: <Heart size={28} />,
      gradient: "from-pink-500 to-rose-500",
      href: "/money-health",
    },
    {
      title: "Tax Wizard",
      desc: "Find missed deductions & compare old vs new regime",
      icon: <Calculator size={28} />,
      gradient: "from-amber-500 to-orange-500",
      href: "/tax-wizard",
    },
    {
      title: "MF Portfolio X-Ray",
      desc: "Upload CAMS statement for XIRR, overlap & rebalancing",
      icon: <PieChart size={28} />,
      gradient: "from-violet-500 to-purple-500",
      href: "/mf-xray",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group relative p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50
              hover:border-slate-600/50 hover:bg-slate-800/80 transition-all duration-300"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <ArrowUpRight
              size={16}
              className="absolute top-4 right-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        ))}
      </div>

      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 via-cyan-600/20 to-blue-600/20
        border border-emerald-500/20 p-6"
      >
        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">AI Finance Mentor</span>
            </div>
            <h3 className="text-xl font-bold text-white">Personalized planning — runs on-device in local mode</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-lg">
              Use Life Events for bonus, marriage, and more. Set{" "}
              <code className="text-slate-500">NEXT_PUBLIC_USE_LOCAL_ENGINE=false</code> to point at your API.
            </p>
          </div>
          <Link
            href="/life-events"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500
              text-slate-900 font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
          >
            Life event advisor
          </Link>
        </div>
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Financial Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="group p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50
                hover:border-slate-600/50 hover:bg-slate-800/70 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${f.gradient} text-white shadow-lg`}>{f.icon}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{f.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
                </div>
                <ArrowUpRight
                  size={18}
                  className="text-slate-600 group-hover:text-emerald-400 transition-colors mt-1"
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
