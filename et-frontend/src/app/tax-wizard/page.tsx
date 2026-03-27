"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTaxWizardStore } from "@/store/taxWizardStore";
import { formatCurrency } from "@/lib/utils";
import { Calculator, Sparkles, Upload, ArrowRight, Check, AlertTriangle } from "lucide-react";

export default function TaxWizardPage() {
  useAuth();
  const { analysis, isAnalyzing, analyze, uploadForm16 } = useTaxWizardStore();

  const [income, setIncome] = useState({
    gross_salary: 1500000,
    hra_received: 240000,
    lta_received: 0,
    standard_deduction: 50000,
    professional_tax: 2400,
    income_from_other_sources: 0,
    rental_income: 0,
    capital_gains: { short_term: 0, long_term: 0 },
  });

  const [deductions, setDeductions] = useState({
    section_80c: { epf: 21600, ppf: 50000, elss: 0, life_insurance: 25000, children_tuition: 0, home_loan_principal: 0, nsc: 0, total: 96600 },
    section_80d: { self_premium: 15000, parents_premium: 0, preventive_health: 5000, total: 20000 },
    nps_80ccd_1b: 0,
    home_loan_interest_24b: 0,
    education_loan_80e: 0,
    donations_80g: 0,
    savings_interest_80tta: 8000,
    hra_exemption: 120000,
  });

  const handleAnalyze = async () => {
    await analyze({
      financial_year: "2025-26",
      income_details: income,
      deductions: deductions,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadForm16(file);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tax Wizard</h1>
            <p className="text-sm text-slate-500">Old vs New Regime · Missed Deductions · Tax-Saving Investments</p>
          </div>
        </div>
        <label className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400
          hover:text-white hover:border-slate-600 cursor-pointer flex items-center gap-2 text-sm transition-all">
          <Upload size={16} /> Upload Form 16
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {/* Income Inputs */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Income Details (FY 2025-26)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { label: "Gross Salary", key: "gross_salary" },
            { label: "HRA Received", key: "hra_received" },
            { label: "Other Income", key: "income_from_other_sources" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-slate-500 mb-1.5">{f.label}</label>
              <input type="number" value={income[f.key as keyof typeof income] as number}
                onChange={(e) => setIncome({ ...income, [f.key]: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Key Deductions */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Current Deductions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "80C Total", value: deductions.section_80c.total, max: "₹1.5L" },
            { label: "80D (Health)", value: deductions.section_80d.total, max: "₹1L" },
            { label: "NPS 80CCD(1B)", value: deductions.nps_80ccd_1b, max: "₹50K" },
            { label: "HRA Exemption", value: deductions.hra_exemption, max: "" },
            { label: "Home Loan 24(b)", value: deductions.home_loan_interest_24b, max: "₹2L" },
            { label: "Savings Int 80TTA", value: deductions.savings_interest_80tta, max: "₹10K" },
          ].map((d) => (
            <div key={d.label} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30">
              <p className="text-xs text-slate-500 mb-1">{d.label} {d.max && <span className="text-slate-600">(max {d.max})</span>}</p>
              <p className="text-lg font-bold text-white">{formatCurrency(d.value)}</p>
            </div>
          ))}
        </div>
        <button onClick={handleAnalyze} disabled={isAnalyzing}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold
            flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50">
          {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
          {isAnalyzing ? "Analyzing..." : "Analyze Tax"}
        </button>
      </div>

      {/* Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Regime Comparison */}
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Old vs New Regime</h3>
            <div className="grid grid-cols-2 gap-6">
              {["old_regime", "new_regime"].map((regime) => {
                const data = analysis.regime_comparison[regime as keyof typeof analysis.regime_comparison] as { taxable_income: number; total_tax: number };
                const isRecommended = analysis.regime_comparison.recommended_regime === regime.replace("_regime", "");
                return (
                  <div key={regime} className={`p-5 rounded-xl border ${isRecommended ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700/50 bg-slate-900/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white capitalize">{regime.replace("_", " ")}</h4>
                      {isRecommended && (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                          <Check size={12} /> Recommended
                        </span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Taxable Income</span>
                        <span className="text-white font-medium">{formatCurrency(data.taxable_income)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Total Tax</span>
                        <span className="text-white font-bold text-lg">{formatCurrency(data.total_tax)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <Check size={20} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">
                You save {formatCurrency(analysis.regime_comparison.savings)} with the {analysis.regime_comparison.recommended_regime} regime
              </span>
            </div>
          </div>

          {/* Missed Deductions */}
          {analysis.missed_deductions?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Missed Deductions
              </h3>
              <div className="space-y-3">
                {analysis.missed_deductions.map((d, i) => (
                  <div key={i} className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                      <AlertTriangle size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{d.description}</p>
                      <p className="text-xs text-slate-500 mt-1">Section {d.section} · Potential saving: {formatCurrency(d.potential_saving)}</p>
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <ArrowRight size={12} /> {d.investment_suggestion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {analysis.ai_summary && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-400">AI Tax Analysis</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.ai_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
