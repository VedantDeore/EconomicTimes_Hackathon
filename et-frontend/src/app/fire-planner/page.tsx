"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFirePlannerStore } from "@/store/firePlannerStore";
import { formatCurrency } from "@/lib/utils";
import { GOAL_CATEGORIES, RISK_PROFILES } from "@/lib/constants";
import { Flame, Plus, Trash2, Sparkles, Target, TrendingUp, Shield, Wallet } from "lucide-react";

interface GoalInput {
  name: string;
  category: string;
  target_amount: number;
  current_savings: number;
  target_date: string;
  priority: string;
}

export default function FirePlannerPage() {
  useAuth();
  const { plan, isGenerating, generatePlan } = useFirePlannerStore();

  const [form, setForm] = useState({
    age: 28,
    retirement_age: 50,
    monthly_income: 100000,
    monthly_expenses: 50000,
    existing_corpus: 500000,
    expected_return_rate: 12,
    inflation_rate: 6,
  });

  const [goals, setGoals] = useState<GoalInput[]>([
    { name: "Retirement", category: "retirement", target_amount: 50000000, current_savings: 500000, target_date: "2048-01-01", priority: "high" },
  ]);

  const addGoal = () => {
    setGoals([...goals, { name: "", category: "custom", target_amount: 0, current_savings: 0, target_date: "2035-01-01", priority: "medium" }]);
  };

  const removeGoal = (i: number) => setGoals(goals.filter((_, idx) => idx !== i));

  const updateGoal = (i: number, field: keyof GoalInput, value: string | number) => {
    const updated = [...goals];
    updated[i] = { ...updated[i], [field]: value };
    setGoals(updated);
  };

  const handleGenerate = async () => {
    await generatePlan({ ...form, goals });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
          <Flame size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">FIRE Path Planner</h1>
          <p className="text-sm text-slate-500">Build your roadmap to Financial Independence</p>
        </div>
      </div>

      {/* Input Form */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-6">
        <h3 className="text-lg font-semibold text-white">Your Profile</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Age", key: "age", prefix: "" },
            { label: "Retire At", key: "retirement_age", prefix: "" },
            { label: "Monthly Income", key: "monthly_income", prefix: "₹" },
            { label: "Monthly Expenses", key: "monthly_expenses", prefix: "₹" },
            { label: "Existing Corpus", key: "existing_corpus", prefix: "₹" },
            { label: "Expected Return %", key: "expected_return_rate", prefix: "" },
            { label: "Inflation %", key: "inflation_rate", prefix: "" },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-xs text-slate-500 mb-1.5">{field.label}</label>
              <div className="relative">
                {field.prefix && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">{field.prefix}</span>
                )}
                <input
                  type="number"
                  value={form[field.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [field.key]: Number(e.target.value) })}
                  className={`w-full ${field.prefix ? "pl-7" : "pl-3"} pr-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50
                    text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-all`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Goals */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">Life Goals</h3>
            <button onClick={addGoal} className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300">
              <Plus size={16} /> Add Goal
            </button>
          </div>
          <div className="space-y-3">
            {goals.map((goal, i) => (
              <div key={i} className="grid grid-cols-6 gap-3 items-end p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Goal Name</label>
                  <input type="text" value={goal.name} onChange={(e) => updateGoal(i, "name", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Category</label>
                  <select value={goal.category} onChange={(e) => updateGoal(i, "category", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-emerald-500/50">
                    {GOAL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target (₹)</label>
                  <input type="number" value={goal.target_amount} onChange={(e) => updateGoal(i, "target_amount", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Saved (₹)</label>
                  <input type="number" value={goal.current_savings} onChange={(e) => updateGoal(i, "current_savings", Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Target Date</label>
                  <input type="date" value={goal.target_date} onChange={(e) => updateGoal(i, "target_date", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <button onClick={() => removeGoal(i)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all self-end">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate} disabled={isGenerating}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold
            flex items-center gap-2 hover:shadow-lg hover:shadow-orange-500/25 transition-all disabled:opacity-50">
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {isGenerating ? "Generating Plan..." : "Generate FIRE Plan"}
        </button>
      </div>

      {/* Results */}
      {plan && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white">Your FIRE Plan</h3>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "FIRE Number", value: formatCurrency(plan.fire_number), icon: <Target size={20} />, color: "#f59e0b" },
              { label: "Years to FIRE", value: `${plan.years_to_fire} years`, icon: <TrendingUp size={20} />, color: "#10b981" },
              { label: "Monthly SIP Needed", value: formatCurrency(plan.monthly_sip_needed), icon: <Wallet size={20} />, color: "#6366f1" },
              { label: "Emergency Fund", value: formatCurrency(plan.emergency_fund_target), icon: <Shield size={20} />, color: "#ef4444" },
            ].map((m) => (
              <div key={m.label} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${m.color}20`, color: m.color }}>{m.icon}</div>
                  <span className="text-xs text-slate-500">{m.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Asset Allocation */}
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h4 className="text-lg font-semibold text-white mb-4">Recommended Asset Allocation</h4>
            <div className="flex gap-2 h-8 rounded-xl overflow-hidden">
              {Object.entries(plan.asset_allocation).map(([key, val]) => {
                const colors: Record<string, string> = { equity: "#10b981", debt: "#6366f1", gold: "#f59e0b", cash: "#64748b" };
                return val > 0 ? (
                  <div key={key} style={{ width: `${val}%`, backgroundColor: colors[key] || "#64748b" }}
                    className="flex items-center justify-center text-xs font-bold text-white">
                    {val}% {key}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* AI Summary */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400">AI Analysis</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{plan.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
