"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import api from "@/lib/api";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { PieChart, Upload, Sparkles, TrendingUp, RefreshCw, BarChart3 } from "lucide-react";

interface Holding {
  fund_name: string;
  fund_house: string;
  category: string;
  current_value: number;
  invested_amount: number;
  xirr: number;
  expense_ratio: number;
}

interface Portfolio {
  holdings: Holding[];
  portfolio_summary: {
    total_invested: number;
    total_current_value: number;
    total_returns: number;
    overall_xirr: number;
    expense_ratio_drag: number;
    overlap_pct: number;
  };
  overlap_analysis: Array<{ stock_name: string; funds_holding: string[]; total_weight_pct: number }>;
  rebalancing_suggestions: Array<{ action: string; fund_name: string; reason: string; target_allocation_pct?: number }>;
  ai_summary: string;
}

export default function MFXRayPage() {
  useAuth();
  const { upload, isUploading, progress } = useFileUpload("/mf/upload");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [source, setSource] = useState("cams");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file, { source });
    setPortfolio(result);
  };

  const fetchExisting = async () => {
    try {
      const res = await api.get<Portfolio & { error?: string }>("/mf/portfolio");
      if (res.data && !res.data.error) setPortfolio(res.data);
    } catch {
      /* optional */
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg">
          <PieChart size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">MF Portfolio X-Ray</h1>
          <p className="text-sm text-slate-500">XIRR · Overlap Analysis · Expense Ratio · AI Rebalancing</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Upload Statement</h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {["cams", "kfintech"].map((s) => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
                  ${source === s ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-slate-500 border border-slate-700/50 hover:text-white"}`}>
                {s === "cams" ? "CAMS" : "KFintech"}
              </button>
            ))}
          </div>
          <label className="flex-1 cursor-pointer">
            <div className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all
              ${isUploading ? "border-violet-500/50 bg-violet-500/5" : "border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-800/60"}`}>
              {isUploading ? (
                <div className="text-center">
                  <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm text-violet-400">{progress}% uploading...</p>
                </div>
              ) : (
                <>
                  <Upload size={20} className="text-slate-500" />
                  <span className="text-sm text-slate-400">Drop your CAMS/KFintech PDF or CSV here</span>
                </>
              )}
            </div>
            <input type="file" accept=".pdf,.csv,.xlsx" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
        <button onClick={fetchExisting} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
          <RefreshCw size={14} /> Load existing portfolio
        </button>
      </div>

      {/* Results */}
      {portfolio && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Invested", value: formatCurrency(portfolio.portfolio_summary.total_invested), color: "#64748b" },
              { label: "Current Value", value: formatCurrency(portfolio.portfolio_summary.total_current_value), color: "#10b981" },
              { label: "Returns", value: formatCurrency(portfolio.portfolio_summary.total_returns), color: portfolio.portfolio_summary.total_returns >= 0 ? "#10b981" : "#ef4444" },
              { label: "XIRR", value: formatPercent(portfolio.portfolio_summary.overall_xirr), color: "#6366f1" },
              { label: "Expense Drag", value: formatCurrency(portfolio.portfolio_summary.expense_ratio_drag), color: "#f59e0b" },
              { label: "Overlap", value: formatPercent(portfolio.portfolio_summary.overlap_pct), color: "#ef4444" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Overlap (illustrative in local mode) */}
          {portfolio.overlap_analysis?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-amber-400" /> Overlap snapshot
              </h3>
              <div className="space-y-2">
                {portfolio.overlap_analysis.map((o, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 text-sm">
                    <p className="text-white font-medium">{o.stock_name}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      Funds: {o.funds_holding.join(", ")} · ~{o.total_weight_pct.toFixed(1)}% combined weight
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Holdings Table */}
          {portfolio.holdings?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-violet-400" /> Holdings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {["Fund Name", "Category", "Invested", "Current", "XIRR", "Exp Ratio"].map((h) => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((h, i) => (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 px-3 text-white font-medium">{h.fund_name}</td>
                        <td className="py-3 px-3 text-slate-400 capitalize">{h.category?.replace(/_/g, " ")}</td>
                        <td className="py-3 px-3 text-slate-300">{formatCurrency(h.invested_amount)}</td>
                        <td className="py-3 px-3 text-emerald-400 font-medium">{formatCurrency(h.current_value)}</td>
                        <td className="py-3 px-3" style={{ color: h.xirr >= 0 ? "#10b981" : "#ef4444" }}>{formatPercent(h.xirr)}</td>
                        <td className="py-3 px-3 text-amber-400">{h.expense_ratio?.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rebalancing */}
          {portfolio.rebalancing_suggestions?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" /> AI Rebalancing Plan
              </h3>
              <div className="space-y-3">
                {portfolio.rebalancing_suggestions.map((s, i) => {
                  const actionColors: Record<string, string> = { increase: "#10b981", decrease: "#f59e0b", exit: "#ef4444", switch: "#6366f1" };
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
                      <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase"
                        style={{ backgroundColor: `${actionColors[s.action] || "#64748b"}20`, color: actionColors[s.action] || "#64748b" }}>
                        {s.action}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{s.fund_name}</p>
                        <p className="text-xs text-slate-500">{s.reason}</p>
                      </div>
                      {s.target_allocation_pct != null && (
                        <span className="text-sm font-bold text-slate-300">{s.target_allocation_pct}%</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {portfolio.ai_summary && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-violet-400" />
                <span className="text-sm font-medium text-violet-400">AI Portfolio Analysis</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{portfolio.ai_summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
