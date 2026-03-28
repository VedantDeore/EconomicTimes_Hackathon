"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFileUpload } from "@/hooks/useFileUpload";
import { isLocalEngineMode } from "@/lib/config";
import { buildPortfolioFromText } from "@/lib/engine/mf";
import type { MfPortfolioResult, RebalanceSuggestion } from "@/lib/engine/mf";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  PieChart, Upload, Sparkles, TrendingUp, BarChart3, AlertTriangle,
  Info, ArrowRight, Layers, RefreshCw, DollarSign, GitBranch,
} from "lucide-react";

function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-emerald-400 transition-colors"><Info size={14} /></button>
      {open && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 shadow-xl">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-slate-800 border-r border-b border-slate-700" />
        </span>
      )}
    </span>
  );
}

function DonutChart({ data }: { data: Array<{ category: string; pct: number }> }) {
  const colors = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#8b5cf6"];
  let cumulative = 0;
  const segments = data.map((d, i) => {
    const start = cumulative;
    cumulative += d.pct;
    return { ...d, start, color: colors[i % colors.length] };
  });

  const gradientParts = segments.map(s => `${s.color} ${s.start}% ${s.start + s.pct}%`).join(", ");

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-36 h-36 shrink-0">
        <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${gradientParts})` }} />
        <div className="absolute inset-5 rounded-full bg-slate-900 flex items-center justify-center">
          <span className="text-xs text-slate-400 text-center">{data.length}<br/>categories</span>
        </div>
      </div>
      <div className="space-y-1.5 flex-1">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-slate-300 flex-1">{s.category}</span>
            <span className="text-white font-mono font-medium">{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OverlapHeatmap({ matrix, funds }: { matrix: MfPortfolioResult["overlap_matrix"]; funds: string[] }) {
  const shortName = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 3 ? parts.slice(0, 3).join(" ") : name;
  };

  const getCell = (a: string, b: string) => {
    if (a === b) return { shared: -1, weight: 0 };
    return matrix.find(m =>
      (m.fund_a === a && m.fund_b === b) || (m.fund_a === b && m.fund_b === a)
    ) || { shared_stocks: 0, combined_weight: 0 };
  };

  const severity = (shared: number) => {
    if (shared >= 6) return "bg-red-500/40 text-red-300";
    if (shared >= 4) return "bg-amber-500/30 text-amber-300";
    if (shared >= 2) return "bg-yellow-500/20 text-yellow-300";
    if (shared >= 1) return "bg-slate-700/40 text-slate-400";
    return "bg-slate-800/30 text-slate-600";
  };

  return (
    <div className="overflow-x-auto">
      <table className="text-[11px]">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-500 w-32" />
            {funds.map(f => (
              <th key={f} className="p-2 text-slate-400 font-medium w-24 min-w-[96px]">
                <div className="truncate w-24" title={f}>{shortName(f)}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {funds.map(row => (
            <tr key={row}>
              <td className="p-2 text-slate-400 font-medium">
                <div className="truncate w-32" title={row}>{shortName(row)}</div>
              </td>
              {funds.map(col => {
                if (row === col) {
                  return <td key={col} className="p-2"><div className="w-full h-8 rounded bg-slate-700/20 flex items-center justify-center text-slate-600">—</div></td>;
                }
                const cell = getCell(row, col);
                const shared: number = "shared_stocks" in cell ? (cell.shared_stocks ?? 0) : 0;
                const weight: number = "combined_weight" in cell ? (cell.combined_weight ?? 0) : 0;
                return (
                  <td key={col} className="p-1">
                    <div className={`h-8 rounded flex items-center justify-center font-mono ${severity(shared)}`}>
                      {shared > 0 ? `${shared} (${weight}%)` : "0"}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ACTION_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  hold: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "HOLD" },
  trim: { bg: "bg-amber-500/20", text: "text-amber-400", label: "STOP SIPs" },
  exit: { bg: "bg-red-500/20", text: "text-red-400", label: "EXIT" },
  switch_to_direct: { bg: "bg-violet-500/20", text: "text-violet-400", label: "SWITCH TO DIRECT" },
  increase: { bg: "bg-cyan-500/20", text: "text-cyan-400", label: "INCREASE" },
};

export default function MFXRayPage() {
  useAuth();
  const { upload, isUploading, progress } = useFileUpload("/mf/upload");
  const [portfolio, setPortfolio] = useState<MfPortfolioResult | null>(null);
  const [source, setSource] = useState("cams");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await upload(file, { source });
    setPortfolio(result);
  };

  const loadSample = () => {
    if (isLocalEngineMode()) {
      const result = buildPortfolioFromText("sample", "");
      setPortfolio(result);
    }
  };

  const ps = portfolio?.portfolio_summary;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/20">
          <PieChart size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">MF Portfolio X-Ray</h1>
          <p className="text-sm text-slate-500">True XIRR &middot; Stock-Level Overlap &middot; Expense Ratio Drag &middot; STCG-Aware Rebalancing</p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Upload CAMS / KFintech Statement</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
            {["cams", "kfintech"].map(s => (
              <button key={s} onClick={() => setSource(s)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${source === s ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-slate-500 border border-slate-700/50 hover:text-white"}`}>
                {s === "cams" ? "CAMS" : "KFintech"}
              </button>
            ))}
          </div>
          <label className="flex-1 min-w-[200px] cursor-pointer">
            <div className={`flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all ${isUploading ? "border-violet-500/50 bg-violet-500/5" : "border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-800/60"}`}>
              {isUploading ? (
                <div className="text-center"><div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-2" /><p className="text-sm text-violet-400">{progress}%</p></div>
              ) : (
                <><Upload size={20} className="text-slate-500" /><span className="text-sm text-slate-400">Drop your CAMS/KFintech PDF or CSV</span></>
              )}
            </div>
            <input type="file" accept=".pdf,.csv,.xlsx" className="hidden" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
        <button onClick={loadSample} className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
          <RefreshCw size={14} /> Load sample portfolio (6 funds, 4 AMCs)
        </button>
      </div>

      {/* ───── Results ───── */}
      {portfolio && ps && (
        <div className="space-y-6 animate-fade-in">

          {/* Verdict Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Invested", value: formatCurrency(ps.total_invested), color: "#64748b" },
              { label: "Current Value", value: formatCurrency(ps.total_current_value), color: "#10b981" },
              { label: "XIRR", value: formatPercent(ps.overall_xirr), color: "#6366f1", tip: "Extended Internal Rate of Return — your actual annualized return accounting for timing of each SIP." },
              { label: "Returns", value: `${ps.total_returns >= 0 ? "+" : ""}${formatCurrency(ps.total_returns)} (${ps.total_returns_pct.toFixed(1)}%)`, color: ps.total_returns >= 0 ? "#10b981" : "#ef4444" },
              { label: "Overlap Score", value: `${ps.overlap_pct}%`, color: ps.overlap_pct > 15 ? "#ef4444" : ps.overlap_pct > 8 ? "#f59e0b" : "#10b981", tip: "Sum of portfolio-weight contributions from stocks appearing in 2+ funds. Higher = more duplication." },
              { label: "Expense Drag/yr", value: formatCurrency(ps.expense_ratio_drag), color: "#f59e0b", tip: `You pay ₹${ps.expense_ratio_drag.toLocaleString("en-IN")}/yr in fund fees. Switching to direct plans saves ₹${ps.annual_drag_savings.toLocaleString("en-IN")}/yr.` },
            ].map(s => (
              <div key={s.label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-500 mb-1">{s.label}{s.tip && <Tip text={s.tip} />}</p>
                <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Category Allocation Donut */}
          {portfolio.category_allocation.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <PieChart size={18} className="text-emerald-400" /> Category Allocation
              </h3>
              <DonutChart data={portfolio.category_allocation} />
              {portfolio.category_allocation[0]?.pct > 55 && (
                <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-sm">
                  <AlertTriangle size={16} className="text-amber-400 shrink-0" />
                  <span className="text-amber-400">{portfolio.category_allocation[0].category} dominates at {portfolio.category_allocation[0].pct}% — consider diversifying into other categories.</span>
                </div>
              )}
            </div>
          )}

          {/* Stock-Level Overlap */}
          {portfolio.overlap_analysis.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers size={18} className="text-red-400" /> Stock-Level Overlap Analysis<Tip text="Stocks that appear in multiple funds. You're effectively paying multiple expense ratios for the same exposure." />
              </h3>
              <div className="space-y-2 mb-6">
                {portfolio.overlap_analysis.slice(0, 10).map((o, i) => {
                  const severity = o.funds_holding.length >= 3 ? "border-red-500/30 bg-red-500/5" : "border-amber-500/20 bg-amber-500/5";
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${severity}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{o.stock_name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.funds_holding.length >= 3 ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
                            In {o.funds_holding.length} funds
                          </span>
                          <span className="text-sm font-mono text-white">{o.total_portfolio_weight}% portfolio</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {o.funds_holding.map((f, j) => (
                          <span key={j} className="px-2 py-1 rounded-lg bg-slate-800/60 text-slate-400">
                            {f.split(" ").slice(0, 3).join(" ")} <span className="text-white font-mono">({o.weight_per_fund[j]}%)</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overlap Heatmap */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <GitBranch size={14} className="text-violet-400" /> Fund-to-Fund Overlap Matrix
                </h4>
                <OverlapHeatmap matrix={portfolio.overlap_matrix} funds={portfolio.holdings.map(h => h.fund_name)} />
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/40" /> 6+ stocks</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500/30" /> 4-5 stocks</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/20" /> 2-3 stocks</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-700/40" /> 1 stock</span>
                </div>
              </div>
            </div>
          )}

          {/* Holdings Table with Expense Ratio Comparison */}
          {portfolio.holdings.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={18} className="text-violet-400" /> Holdings & Expense Ratio Drag
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {["Fund Name", "Category", "Invested", "Current", "XIRR", "ER (Reg)", "ER (Direct)", "Annual Drag", "Held"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.holdings.map((h, i) => {
                      const drag = Math.round(((h.expense_ratio - h.direct_expense_ratio) / 100) * h.current_value);
                      const daysHeld = Math.round((Date.now() - new Date(h.purchase_date).getTime()) / 86400000);
                      const heldStr = daysHeld > 365 ? `${(daysHeld / 365).toFixed(1)}y` : `${daysHeld}d`;
                      const stcg = daysHeld < 365;
                      return (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                          <td className="py-3 px-3 text-white font-medium max-w-[200px]">
                            <div className="truncate" title={h.fund_name}>{h.fund_name}</div>
                            <span className="text-[10px] text-slate-500">{h.fund_house}</span>
                          </td>
                          <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-700/50 text-slate-300">{h.category}</span></td>
                          <td className="py-3 px-3 text-slate-300">{formatCurrency(h.invested_amount)}</td>
                          <td className="py-3 px-3 text-emerald-400 font-medium">{formatCurrency(h.current_value)}</td>
                          <td className="py-3 px-3" style={{ color: h.xirr >= 0 ? "#10b981" : "#ef4444" }}>{formatPercent(h.xirr)}</td>
                          <td className="py-3 px-3 text-amber-400">{h.expense_ratio}%</td>
                          <td className="py-3 px-3 text-emerald-400">{h.direct_expense_ratio}%</td>
                          <td className="py-3 px-3 text-red-400 font-mono">₹{drag.toLocaleString("en-IN")}/yr</td>
                          <td className="py-3 px-3">
                            <span className={`text-xs ${stcg ? "text-amber-400" : "text-emerald-400"}`}>
                              {heldStr}{stcg ? " ⚠️" : ""}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-slate-700">
                      <td className="py-3 px-3 text-white font-bold">Total</td>
                      <td className="py-3 px-3 text-slate-400">{ps.num_funds} funds / {ps.num_amcs} AMCs</td>
                      <td className="py-3 px-3 text-white font-bold">{formatCurrency(ps.total_invested)}</td>
                      <td className="py-3 px-3 text-emerald-400 font-bold">{formatCurrency(ps.total_current_value)}</td>
                      <td className="py-3 px-3 text-white font-bold">{formatPercent(ps.overall_xirr)}</td>
                      <td colSpan={2} className="py-3 px-3" />
                      <td className="py-3 px-3 text-red-400 font-mono font-bold">₹{ps.annual_drag_savings.toLocaleString("en-IN")}/yr saveable</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Expense drag summary */}
              <div className="mt-4 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-start gap-3">
                <DollarSign size={18} className="text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-violet-400 font-medium">Expense Ratio Impact</p>
                  <p className="text-xs text-slate-300 mt-1">
                    You pay <strong className="text-white">₹{ps.expense_ratio_drag.toLocaleString("en-IN")}/yr</strong> in total fund fees.
                    Switching all to direct plans: <strong className="text-white">₹{ps.direct_expense_drag.toLocaleString("en-IN")}/yr</strong>.
                    <strong className="text-emerald-400"> Save ₹{ps.annual_drag_savings.toLocaleString("en-IN")}/yr</strong> — that&apos;s ₹{(ps.annual_drag_savings * 10).toLocaleString("en-IN")} over 10 years (not counting compounding).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rebalancing Suggestions */}
          {portfolio.rebalancing_suggestions.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles size={18} className="text-violet-400" /> AI Rebalancing Plan (STCG-Aware)
                <Tip text="Short-Term Capital Gains (STCG): Equity funds held <1 year are taxed at 20% on gains. Recommendations account for this." />
              </h3>
              <div className="space-y-3">
                {portfolio.rebalancing_suggestions.map((s: RebalanceSuggestion, i: number) => {
                  const style = ACTION_STYLES[s.action] || ACTION_STYLES.hold;
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${s.stcg_warning ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700/30 bg-slate-900/40"}`}>
                      <div className="flex items-start gap-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase shrink-0 ${style.bg} ${style.text}`}>
                          {style.label}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">{s.fund_name}</p>
                          <p className="text-xs text-slate-400 mt-1">{s.reason}</p>
                          {s.tax_note && (
                            <p className="text-xs mt-2 flex items-start gap-1">
                              {s.stcg_warning
                                ? <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" />
                                : <ArrowRight size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                              }
                              <span className={s.stcg_warning ? "text-amber-400" : "text-emerald-400"}>{s.tax_note}</span>
                            </p>
                          )}
                          {s.annual_savings && s.annual_savings > 0 && (
                            <p className="text-xs text-emerald-400 mt-1">Potential savings: ₹{s.annual_savings.toLocaleString("en-IN")}/yr</p>
                          )}
                        </div>
                        {s.target_allocation_pct != null && (
                          <span className="text-sm font-bold text-slate-300">{s.target_allocation_pct}%</span>
                        )}
                      </div>
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
