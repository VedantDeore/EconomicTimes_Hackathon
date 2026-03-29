"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Loader2, Sparkles, Home, TrendingUp, Shield, Wallet, PieChart,
  Landmark, ArrowRightLeft, Flame, Heart, Target, Save, Clock,
  ChevronRight, CheckCircle2, AlertTriangle, BarChart3, Banknote,
  Download, FileText, Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfileStore } from "@/store/profileStore";
import {
  computeFullCouplesAnalysis,
  type CouplesPartnerFieldsExt,
  type CouplesFullResult,
} from "@/lib/engine/couples";
import { formatCurrency, cn } from "@/lib/utils";
import AnimatedCounter from "@/components/shared/AnimatedCounter";
import ScoreGauge from "@/components/shared/ScoreGauge";
import RadarChart from "@/components/charts/RadarChart";
import KPICard from "@/components/shared/KPICard";
import AlgorithmExplanation from "@/components/shared/AlgorithmExplanation";
import { saveCouplePlan, getCouplePlanHistory } from "@/lib/supabaseHistory";
import { downloadCouplesReport } from "@/lib/couplesReport";
import { LOCAL_KEYS } from "@/lib/localKeys";

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const defaultA: CouplesPartnerFieldsExt = {
  name: "Partner A", gross_salary: 1800000, basic_salary: 720000,
  hra_received: 360000, sec_80c: 120000, total_investments: 450000,
  total_debts: 80000, age: 30, monthly_expenses: 35000, monthly_sip: 15000,
  risk_profile: "moderate", emergency_fund: 200000,
};

const defaultB: CouplesPartnerFieldsExt = {
  name: "Partner B", gross_salary: 1400000, basic_salary: 560000,
  hra_received: 280000, sec_80c: 150000, total_investments: 320000,
  total_debts: 120000, age: 28, monthly_expenses: 30000, monthly_sip: 10000,
  risk_profile: "moderate", emergency_fund: 150000,
};

const sampleA: CouplesPartnerFieldsExt = {
  name: "Priya", gross_salary: 2200000, basic_salary: 880000,
  hra_received: 440000, sec_80c: 140000, total_investments: 850000,
  total_debts: 0, age: 29, monthly_expenses: 40000, monthly_sip: 25000,
  risk_profile: "aggressive", emergency_fund: 300000,
};

const sampleB: CouplesPartnerFieldsExt = {
  name: "Arjun", gross_salary: 1600000, basic_salary: 640000,
  hra_received: 320000, sec_80c: 100000, total_investments: 480000,
  total_debts: 150000, age: 31, monthly_expenses: 35000, monthly_sip: 12000,
  risk_profile: "moderate", emergency_fund: 180000,
};

type TabKey = "overview" | "tax" | "fire" | "split";

const TABS: { key: TabKey; label: string; icon: typeof Heart }[] = [
  { key: "overview", label: "Compatibility", icon: Heart },
  { key: "tax", label: "Tax Optimization", icon: Banknote },
  { key: "fire", label: "FIRE Together", icon: Flame },
  { key: "split", label: "Fair Split", icon: ArrowRightLeft },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function RupeeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
      <input
        {...props}
        className={cn(
          "w-full rounded-xl border border-slate-700/50 bg-slate-900/60 py-2.5 pl-8 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
          props.className,
        )}
      />
    </div>
  );
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20",
        props.className,
      )}
    />
  );
}

function Badge({ children, color = "emerald" }: { children: ReactNode; color?: "emerald" | "cyan" | "amber" | "rose" }) {
  const cls = {
    emerald: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
    cyan: "bg-cyan-500/15 text-cyan-300 ring-cyan-500/30",
    amber: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
    rose: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
  }[color];
  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", cls)}>{children}</span>;
}

function ProgressBar({ pct, color = "#10b981" }: { pct: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 ring-1 ring-slate-700/50">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, pct)}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function CouplesPlannerPage() {
  const { isAuthenticated } = useAuth();
  const { profile } = useProfileStore();

  const [a, setA] = useState<CouplesPartnerFieldsExt>(defaultA);
  const [b, setB] = useState<CouplesPartnerFieldsExt>(defaultB);
  const [monthlyRent, setMonthlyRent] = useState(35000);
  const [result, setResult] = useState<CouplesFullResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [history, setHistory] = useState<Record<string, unknown>[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const refreshHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const h = await getCouplePlanHistory();
      if (h.length) setHistory(h);
    } catch { /* table may not exist yet — ignore */ }
  }, [isAuthenticated]);

  useEffect(() => { void refreshHistory(); }, [refreshHistory]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEYS.couplePlan);
      if (raw) {
        const cached = JSON.parse(raw) as CouplesFullResult;
        if (cached.partnerA && cached.tax) {
          setA(cached.partnerA);
          setB(cached.partnerB);
          setMonthlyRent(cached.monthlyRent);
          setResult(cached);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const prefillFromProfile = useCallback(() => {
    if (!profile) return;
    setA((prev) => ({
      ...prev,
      name: "You",
      gross_salary: profile.annual_income?.gross || prev.gross_salary,
      basic_salary: profile.salary_structure?.basic || prev.basic_salary,
      hra_received: profile.salary_structure?.hra || prev.hra_received,
      total_investments: Object.values(profile.existing_investments || {}).reduce(
        (s, v) => s + (typeof v === "number" ? v : 0), 0,
      ) || prev.total_investments,
      total_debts: (profile.debts || []).reduce((s, d) => {
        const nums = Object.values(d).filter((v): v is number => typeof v === "number");
        return s + (nums[0] ?? 0);
      }, 0) || prev.total_debts,
      monthly_expenses: profile.monthly_expenses?.total || prev.monthly_expenses,
      emergency_fund: profile.emergency_fund?.current_amount || prev.emergency_fund,
    }));
  }, [profile]);

  const optimize = useCallback(async () => {
    setLoading(true);
    setSaved(false);
    setSaveMsg("");
    try {
      await new Promise((r) => setTimeout(r, 400));
      const res = computeFullCouplesAnalysis(a, b, monthlyRent);
      setResult(res);
      setActiveTab("overview");
      try { localStorage.setItem(LOCAL_KEYS.couplePlan, JSON.stringify(res)); } catch { /* */ }

      if (isAuthenticated) {
        try {
          await saveCouplePlan(res as unknown as Record<string, unknown>);
          setSaved(true);
          setSaveMsg("Analysis saved to your account!");
          void refreshHistory();
        } catch {
          setSaveMsg("Could not save — check Supabase connection");
        }
      }
    } finally {
      setLoading(false);
    }
  }, [a, b, monthlyRent, isAuthenticated, refreshHistory]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await saveCouplePlan(result as unknown as Record<string, unknown>);
      setSaved(true);
      setSaveMsg("Saved successfully!");
      void refreshHistory();
    } catch {
      setSaveMsg("Save failed — please try again");
    }
    setSaving(false);
  }, [result, refreshHistory]);

  const handleDownloadPDF = useCallback(() => {
    if (!result) return;
    downloadCouplesReport(result);
  }, [result]);

  const loadHistory = useCallback((entry: Record<string, unknown>) => {
    const raw = entry.optimization_results as CouplesFullResult | undefined;
    if (!raw?.partnerA) return;
    setA(raw.partnerA);
    setB(raw.partnerB);
    setMonthlyRent(raw.monthlyRent);
    setResult(raw);
    setShowHistory(false);
  }, []);

  const nameA = a.name.trim() || "Partner A";
  const nameB = b.name.trim() || "Partner B";

  /* ---- render partner input card ---- */
  function renderPartnerCard(
    key: "a" | "b",
    label: string,
    data: CouplesPartnerFieldsExt,
    set: React.Dispatch<React.SetStateAction<CouplesPartnerFieldsExt>>,
    gradient: string,
  ) {
    return (
      <div className="space-y-3 rounded-xl border border-slate-700/40 bg-slate-900/30 p-5">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", gradient)} />
          <p className="text-sm font-semibold text-slate-200">{label}</p>
        </div>
        <Field label="Name">
          <input type="text" value={data.name}
            onChange={(e) => set((d) => ({ ...d, name: e.target.value }))}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none"
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Gross salary (annual)">
            <RupeeInput type="number" min={0} value={data.gross_salary || ""} onChange={(e) => set((d) => ({ ...d, gross_salary: Number(e.target.value) }))} />
          </Field>
          <Field label="Basic salary (annual)">
            <RupeeInput type="number" min={0} value={data.basic_salary || ""} onChange={(e) => set((d) => ({ ...d, basic_salary: Number(e.target.value) }))} />
          </Field>
          <Field label="HRA received (annual)">
            <RupeeInput type="number" min={0} value={data.hra_received || ""} onChange={(e) => set((d) => ({ ...d, hra_received: Number(e.target.value) }))} />
          </Field>
          <Field label="Section 80C (annual)">
            <RupeeInput type="number" min={0} value={data.sec_80c || ""} onChange={(e) => set((d) => ({ ...d, sec_80c: Number(e.target.value) }))} />
          </Field>
          <Field label="Total investments">
            <RupeeInput type="number" min={0} value={data.total_investments || ""} onChange={(e) => set((d) => ({ ...d, total_investments: Number(e.target.value) }))} />
          </Field>
          <Field label="Total debts">
            <RupeeInput type="number" min={0} value={data.total_debts || ""} onChange={(e) => set((d) => ({ ...d, total_debts: Number(e.target.value) }))} />
          </Field>
          <Field label="Age">
            <NumberInput type="number" min={18} max={65} value={data.age || ""} onChange={(e) => set((d) => ({ ...d, age: Number(e.target.value) }))} />
          </Field>
          <Field label="Monthly expenses">
            <RupeeInput type="number" min={0} value={data.monthly_expenses || ""} onChange={(e) => set((d) => ({ ...d, monthly_expenses: Number(e.target.value) }))} />
          </Field>
          <Field label="Monthly SIP">
            <RupeeInput type="number" min={0} value={data.monthly_sip || ""} onChange={(e) => set((d) => ({ ...d, monthly_sip: Number(e.target.value) }))} />
          </Field>
          <Field label="Emergency fund">
            <RupeeInput type="number" min={0} value={data.emergency_fund || ""} onChange={(e) => set((d) => ({ ...d, emergency_fund: Number(e.target.value) }))} />
          </Field>
        </div>
        <Field label="Risk profile">
          <select value={data.risk_profile} onChange={(e) => set((d) => ({ ...d, risk_profile: e.target.value as CouplesPartnerFieldsExt["risk_profile"] }))}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-sm text-white focus:border-emerald-500/50 focus:outline-none">
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </Field>
      </div>
    );
  }

  /* ---- render tab content ---- */
  function renderOverview() {
    if (!result) return null;
    const c = result.compatibility;
    return (
      <div className="space-y-8">
        {/* Compatibility Hero */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 via-slate-800/50 to-emerald-900/20 p-8 backdrop-blur-md">
            <ScoreGauge score={c.overall_score} size={160} label="Money Compatibility" grade={c.grade} />
            <Badge color={c.overall_score >= 70 ? "emerald" : c.overall_score >= 50 ? "amber" : "rose"}>
              {c.grade}
            </Badge>
            <p className="text-center text-xs leading-relaxed text-slate-400">
              Based on 6 financial dimensions: income balance, debt health,
              investment rate, tax efficiency, savings discipline, and emergency preparedness.
            </p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <RadarChart dimensions={c.dimensions.map((d) => ({ label: d.label, score: d.score }))} />
          </motion.div>
        </div>

        {/* Strengths & Growth */}
        <div className="grid gap-4 sm:grid-cols-2">
          {c.strengths.length > 0 && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-300">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {c.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
          {c.growth_areas.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 backdrop-blur-md">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-300">Growth Areas</h3>
              </div>
              <ul className="space-y-2">
                {c.growth_areas.map((g, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-300">
                    <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />{g}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Dimension detail */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.dimensions.map((d, i) => (
            <motion.div key={d.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="rounded-xl border border-slate-700/40 bg-slate-800/50 p-4 backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">{d.label}</span>
                <span className={cn("text-sm font-bold tabular-nums",
                  d.score >= 70 ? "text-emerald-400" : d.score >= 45 ? "text-amber-400" : "text-rose-400"
                )}>{d.score}</span>
              </div>
              <ProgressBar pct={d.score} color={d.score >= 70 ? "#10b981" : d.score >= 45 ? "#f59e0b" : "#f43f5e"} />
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{d.insight}</p>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  function renderTax() {
    if (!result) return null;
    const r = result.tax;
    const optCards = [
      { key: "hra", title: "HRA Optimization", icon: Home, savings: r.hra.savings,
        body: `${r.hra.claimant_label} should claim HRA on the shared rent for lower combined tax. ${r.hra.explanation}` },
      { key: "80c", title: "80C Split", icon: PieChart, savings: r.split_80c.potential_savings, body: r.split_80c.suggestion },
      { key: "ins", title: "Insurance Review", icon: Shield, savings: r.insurance.potential_savings, body: r.insurance.suggestion },
      { key: "nps", title: "NPS Strategy", icon: Landmark, savings: r.nps.potential_savings, body: r.nps.suggestion },
      { key: "sip", title: "SIP Split", icon: ArrowRightLeft, savings: r.sip.potential_savings, body: r.sip.suggestion },
    ];
    return (
      <div className="space-y-8">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard title="Combined Optimal Tax" value={formatCurrency(r.combined_optimal_tax)} icon={<Banknote className="h-5 w-5" />} subtitle="Best regime per partner" />
          <KPICard title="Naive Combined Tax" value={formatCurrency(r.naive_combined_tax)} icon={<BarChart3 className="h-5 w-5" />} subtitle="Both on new regime" />
          <KPICard title="Your Joint Savings" value={formatCurrency(r.total_savings_vs_naive)} icon={<Sparkles className="h-5 w-5" />} subtitle="vs naive approach" />
        </div>

        {/* Optimization cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {optCards.map((c, i) => (
            <motion.div key={c.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-md">
              <div className="mb-2 flex items-center gap-2">
                <c.icon className="h-4 w-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">{c.title}</h3>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">{c.body}</p>
              <p className="mt-3 text-sm font-semibold text-cyan-300">Potential savings ~ {formatCurrency(c.savings)}</p>
            </motion.div>
          ))}
        </div>

        {/* Partner regime comparison */}
        <div className="grid gap-4 md:grid-cols-2">
          {([
            { name: nameA, d: r.tax_a, color: "emerald" as const },
            { name: nameB, d: r.tax_b, color: "cyan" as const },
          ]).map((p) => (
            <div key={p.name} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-5">
              <p className={cn("text-sm font-semibold", p.color === "emerald" ? "text-emerald-300" : "text-cyan-300")}>{p.name}</p>
              <div className="mt-3 space-y-1 text-xs text-slate-400">
                <p>Old regime: <span className="text-white">{formatCurrency(p.d.old)}</span> (taxable {formatCurrency(p.d.taxable_old)})</p>
                <p>New regime: <span className="text-white">{formatCurrency(p.d.new)}</span> (taxable {formatCurrency(p.d.taxable_new)})</p>
              </div>
              <p className="mt-3 text-sm text-white">
                Best: <Badge color={p.color}>{p.d.best === "old" ? "Old Regime" : "New Regime"}</Badge>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderFire() {
    if (!result) return null;
    const f = result.fire;
    return (
      <div className="space-y-8">
        {/* FIRE Variants */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {([
            { label: "Lean FIRE", value: f.lean_fire, desc: "70% expenses", color: "text-cyan-400" },
            { label: "FIRE Target", value: f.fire_number, desc: "Full expenses", color: "text-emerald-400" },
            { label: "Fat FIRE", value: f.fat_fire, desc: "130% expenses", color: "text-amber-400" },
            { label: "Coast FIRE", value: f.coast_fire, desc: "No more SIP needed", color: "text-violet-400" },
          ]).map((v) => (
            <motion.div key={v.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{v.label}</p>
              <p className={cn("mt-1 text-xl font-bold tabular-nums", v.color)}>
                <AnimatedCounter value={v.value} prefix="₹" duration={0.9} />
              </p>
              <p className="mt-1 text-[11px] text-slate-500">{v.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Key metrics */}
        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard title="Years to FIRE" value={f.years_to_fire < 50 ? `${f.years_to_fire} yrs` : "50+"} icon={<Target className="h-5 w-5" />} subtitle="At current SIP" />
          <KPICard title="Success Probability" value={`${f.success_probability}%`} icon={<BarChart3 className="h-5 w-5" />} subtitle="Monte Carlo (1,000 sims)" />
          <KPICard title="Current Corpus" value={formatCurrency(f.current_corpus)} icon={<Wallet className="h-5 w-5" />} subtitle="Combined investments" />
        </div>

        {/* SIP needed */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-slate-800/50 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-emerald-300">Recommended Monthly SIP</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            <AnimatedCounter value={f.monthly_sip_needed} prefix="₹" duration={1} />
          </p>
          <p className="mt-1 text-xs text-slate-400">To reach FIRE in optimal timeframe</p>
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-700/40 pt-4">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{nameA}&apos;s share</p>
              <p className="text-sm font-semibold text-emerald-300">{formatCurrency(f.sip_split_a)}/mo</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{nameB}&apos;s share</p>
              <p className="text-sm font-semibold text-cyan-300">{formatCurrency(f.sip_split_b)}/mo</p>
            </div>
          </div>
        </motion.div>

        {/* Milestones timeline */}
        {f.milestones.length > 0 && (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-md">
            <h3 className="mb-4 text-sm font-semibold text-white">FIRE Milestones</h3>
            <div className="space-y-3">
              {f.milestones.map((m, i) => {
                const isKey = m.label === "Lean FIRE" || m.label === "FIRE" || m.label === "Fat FIRE";
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn("flex items-center gap-4 rounded-xl p-3",
                      isKey ? "border border-emerald-500/20 bg-emerald-500/5" : "bg-slate-900/30")}>
                    <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      isKey ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-400")}>
                      Y{m.year}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", isKey ? "text-emerald-300" : "text-slate-300")}>{m.label}</span>
                        {isKey && <Badge color="emerald">{m.pct}%</Badge>}
                      </div>
                      <p className="text-xs text-slate-500">{formatCurrency(m.corpus)}</p>
                    </div>
                    <div className="w-24">
                      <ProgressBar pct={m.pct} color={isKey ? "#10b981" : "#475569"} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderFairSplit() {
    if (!result) return null;
    const s = result.fairSplit;
    return (
      <div className="space-y-8">
        {/* Income ratio bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-md">
          <h3 className="mb-3 text-sm font-semibold text-white">Income Contribution</h3>
          <div className="flex h-12 overflow-hidden rounded-xl bg-slate-900/80 ring-1 ring-slate-700/50">
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.ratio_a}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex items-center justify-center bg-gradient-to-r from-emerald-600/90 to-emerald-500/70 text-sm font-bold text-white">
              {s.ratio_a}%
            </motion.div>
            <motion.div initial={{ width: 0 }} animate={{ width: `${s.ratio_b}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex items-center justify-center bg-gradient-to-r from-cyan-600/80 to-cyan-500/60 text-sm font-bold text-white">
              {s.ratio_b}%
            </motion.div>
          </div>
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span className="text-emerald-400/80">{nameA}</span>
            <span className="text-cyan-400/80">{nameB}</span>
          </div>
        </motion.div>

        {/* Recommendation badge */}
        <div className="flex items-center gap-3">
          <Badge color={s.recommended === "proportional" ? "emerald" : "cyan"}>
            Recommended: {s.recommended === "proportional" ? "Proportional Split" : "Equal Split"}
          </Badge>
          <p className="text-xs text-slate-400">{s.insight}</p>
        </div>

        {/* Category table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-md">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-emerald-400/80">{nameA} (prop)</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-cyan-400/80">{nameB} (prop)</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{nameA} (equal)</th>
                <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">{nameB} (equal)</th>
              </tr>
            </thead>
            <tbody>
              {s.categories.map((c) => (
                <tr key={c.category} className="border-b border-slate-700/20 hover:bg-slate-700/10 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-300">{c.category}</td>
                  <td className="px-3 py-3 tabular-nums text-white">{formatCurrency(c.total)}</td>
                  <td className="px-3 py-3 tabular-nums text-emerald-300">{formatCurrency(c.prop_a)}</td>
                  <td className="px-3 py-3 tabular-nums text-cyan-300">{formatCurrency(c.prop_b)}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-400">{formatCurrency(c.equal_a)}</td>
                  <td className="px-3 py-3 tabular-nums text-slate-400">{formatCurrency(c.equal_b)}</td>
                </tr>
              ))}
              <tr className="bg-slate-900/40 font-semibold">
                <td className="px-5 py-3 text-white">Total</td>
                <td className="px-3 py-3 tabular-nums text-white">{formatCurrency(s.total_monthly)}</td>
                <td className="px-3 py-3 tabular-nums text-emerald-300">{formatCurrency(s.prop_a_total)}</td>
                <td className="px-3 py-3 tabular-nums text-cyan-300">{formatCurrency(s.prop_b_total)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-400">{formatCurrency(s.equal_each)}</td>
                <td className="px-3 py-3 tabular-nums text-slate-400">{formatCurrency(s.equal_each)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Disposable income after split */}
        <div className="grid gap-4 sm:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/80">{nameA} — Disposable Income</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(s.disposable_a)}<span className="text-sm text-slate-500">/mo</span></p>
            <p className="mt-1 text-[11px] text-slate-500">After proportional expense share</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-400/80">{nameB} — Disposable Income</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(s.disposable_b)}<span className="text-sm text-slate-500">/mo</span></p>
            <p className="mt-1 text-[11px] text-slate-500">After proportional expense share</p>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Main render                                                        */
  /* ------------------------------------------------------------------ */
  return (
    <div className="min-h-full max-w-6xl space-y-10 pb-16">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500/30 to-cyan-500/20 ring-1 ring-pink-500/30">
          <Users className="h-7 w-7 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Couples Financial Planner</h1>
          <p className="text-sm text-slate-400">
            Joint tax optimization, money compatibility score, FIRE projection, and fair expense splitting — all in one place.
          </p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => { setA({ ...sampleA }); setB({ ...sampleB }); setMonthlyRent(40000); }}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200 transition-colors hover:bg-emerald-500/20">
          <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />Load Sample (Priya & Arjun)
        </button>
        <button type="button" onClick={() => { setA({ ...defaultA }); setB({ ...defaultB }); setMonthlyRent(35000); setResult(null); }}
          className="rounded-xl border border-slate-600/60 bg-slate-800/50 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800">
          Reset Defaults
        </button>
        {profile && (
          <button type="button" onClick={prefillFromProfile}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-500/20">
            <Users className="mr-1.5 inline h-3.5 w-3.5" />Pre-fill from My Profile
          </button>
        )}
      </div>

      {/* Partner setup */}
      <section className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 shadow-xl backdrop-blur-md">
        <h2 className="mb-6 text-lg font-semibold text-white">Partner Setup</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {renderPartnerCard("a", nameA, a, setA, "bg-emerald-500")}
          {renderPartnerCard("b", nameB, b, setB, "bg-cyan-500")}
        </div>

        <div className="mt-6 max-w-md">
          <Field label="Monthly rent (shared)">
            <RupeeInput type="number" min={0} value={monthlyRent || ""} onChange={(e) => setMonthlyRent(Number(e.target.value))} />
          </Field>
        </div>

        <motion.button type="button" disabled={loading} onClick={optimize}
          whileHover={{ scale: loading ? 1 : 1.02 }} whileTap={{ scale: loading ? 1 : 0.98 }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-cyan-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          {loading ? "Analyzing…" : "Analyze Together"}
        </motion.button>
      </section>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            {/* KPI Row */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPICard title="Combined Net Worth" value={formatCurrency(result.tax.combined_net_worth)} icon={<Wallet className="h-5 w-5" />} subtitle="Investments minus debts" />
              <KPICard title="Tax Savings" value={formatCurrency(result.tax.total_savings_vs_naive)} icon={<TrendingUp className="h-5 w-5" />} subtitle="vs naive approach" />
              <KPICard title="FIRE in" value={result.fire.years_to_fire < 50 ? `${result.fire.years_to_fire} years` : "50+"} icon={<Flame className="h-5 w-5" />} subtitle={`Target: ${formatCurrency(result.fire.fire_number)}`} />
              <KPICard title="Compatibility" value={`${result.compatibility.overall_score}/100`} icon={<Heart className="h-5 w-5" />} subtitle={result.compatibility.grade} />
            </div>

            {/* Tab bar */}
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-800/60 p-1 ring-1 ring-slate-700/50 backdrop-blur-md">
              {TABS.map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white ring-1 ring-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-700/40",
                  )}>
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                {activeTab === "overview" && renderOverview()}
                {activeTab === "tax" && renderTax()}
                {activeTab === "fire" && renderFire()}
                {activeTab === "split" && renderFairSplit()}
              </motion.div>
            </AnimatePresence>

            {/* Actions: Save / Download / History */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {isAuthenticated && !saved && (
                  <button type="button" onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? "Saving…" : "Save Again"}
                  </button>
                )}
                {saved && (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> Saved to your account
                  </span>
                )}
                <button type="button" onClick={handleDownloadPDF}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 transition-all hover:bg-cyan-500/20">
                  <Download className="h-4 w-4" /> Download Report (PDF)
                </button>
                {history.length > 0 && (
                  <button type="button" onClick={() => setShowHistory((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-600/60 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-all hover:bg-slate-800">
                    <Clock className="h-4 w-4" /> {showHistory ? "Hide" : "View"} History ({history.length})
                  </button>
                )}
              </div>
              {saveMsg && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={cn("text-xs font-medium", saved ? "text-emerald-400" : "text-amber-400")}>
                  {saveMsg}
                </motion.p>
              )}
            </div>

            {/* History panel */}
            <AnimatePresence>
              {showHistory && history.length > 0 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-6 backdrop-blur-md">
                    <div className="mb-4 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <h3 className="text-sm font-semibold text-white">Past Analyses</h3>
                    </div>
                    <div className="space-y-3">
                      {history.map((h, i) => {
                        const res = h.optimization_results as CouplesFullResult | undefined;
                        const pAName = res?.partnerA?.name || "Partner A";
                        const pBName = res?.partnerB?.name || "Partner B";
                        const score = res?.compatibility?.overall_score;
                        const taxSave = res?.tax?.total_savings_vs_naive;
                        const fireYrs = res?.fire?.years_to_fire;
                        const createdRaw = h.created_at as string | undefined;
                        const dateStr = createdRaw
                          ? new Date(createdRaw).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—";
                        return (
                          <motion.div key={h.id as string || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-4 rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 transition-colors hover:bg-slate-900/60">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25">
                              <Heart className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{pAName} & {pBName}</p>
                              <p className="text-xs text-slate-500">{dateStr}</p>
                            </div>
                            <div className="hidden gap-4 text-center sm:flex">
                              {score != null && (
                                <div>
                                  <p className="text-xs text-slate-500">Score</p>
                                  <p className="text-sm font-bold text-emerald-400">{Math.round(score)}</p>
                                </div>
                              )}
                              {taxSave != null && (
                                <div>
                                  <p className="text-xs text-slate-500">Tax Saved</p>
                                  <p className="text-sm font-bold text-cyan-300">{formatCurrency(taxSave)}</p>
                                </div>
                              )}
                              {fireYrs != null && (
                                <div>
                                  <p className="text-xs text-slate-500">FIRE</p>
                                  <p className="text-sm font-bold text-amber-300">{fireYrs < 50 ? `${fireYrs}y` : "50+"}</p>
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={() => loadHistory(h)}
                              className="rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/25 transition-all hover:bg-emerald-500/25">
                              Load
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Algorithm explanation */}
      <AlgorithmExplanation sections={[
        { title: "Money Compatibility Score",
          description: "Six-dimension weighted analysis: income balance (min/max ratio), debt-to-income health, investment-to-income ratio, joint tax efficiency (savings vs naive), combined savings rate, and emergency fund coverage (months of expenses). Each dimension scores 0-100; the overall is a simple mean." },
        { title: "Joint Tax Optimization",
          description: "Computes full old and new regime taxes for each partner, permuting HRA claims across both. Picks the combination that minimizes combined tax. Evaluates 80C split, insurance, NPS, and SIP strategies using marginal slab analysis." },
        { title: "Joint FIRE Calculator",
          description: "Calculates FIRE number at 4% SWR, then simulates corpus growth at 5.66% real return (12% nominal - 6% inflation). Runs 1,000 Monte Carlo simulations with ±12% return variance for success probability. Computes Lean (70%), Fat (130%), and Coast FIRE variants." },
        { title: "Fair Split Engine",
          description: "Divides shared expenses proportionally by income ratio vs equally, compares post-split disposable-income percentages for each partner, and recommends the method that minimizes the fairness gap." },
      ]} />
    </div>
  );
}
