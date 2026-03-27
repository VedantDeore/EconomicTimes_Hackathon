"use client";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { getScoreColor, getScoreLabel } from "@/lib/utils";
import { HEALTH_DIMENSIONS } from "@/lib/constants";
import { Heart, Sparkles, ArrowRight, RefreshCw } from "lucide-react";

interface DimensionData {
  score: number;
  status: string;
  details: string;
  actions: string[];
}

interface HealthReport {
  overall_score: number;
  dimensions: Record<string, DimensionData>;
  ai_summary: string;
  top_3_actions: Array<{ priority: number; action: string; impact: string; category: string }>;
}

export default function MoneyHealthPage() {
  useAuth();
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateScore = async () => {
    setLoading(true);
    try {
      const res = await api.post("/health/calculate");
      setReport(res.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
            <Heart size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Money Health Score</h1>
            <p className="text-sm text-slate-500">Comprehensive financial wellness in 6 dimensions</p>
          </div>
        </div>
        <button onClick={calculateScore} disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold
            flex items-center gap-2 hover:shadow-lg hover:shadow-pink-500/25 transition-all disabled:opacity-50 text-sm">
          {loading ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Calculating..." : report ? "Recalculate" : "Calculate Score"}
        </button>
      </div>

      {!report && !loading && (
        <div className="text-center py-20">
          <Heart size={64} className="mx-auto text-slate-700 mb-4" />
          <h3 className="text-xl font-semibold text-slate-400 mb-2">Check Your Financial Health</h3>
          <p className="text-slate-600 max-w-md mx-auto mb-6">
            Complete your financial profile and click &quot;Calculate Score&quot; to get your personalized wellness report across 6 dimensions.
          </p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Overall Score */}
          <div className="flex items-center justify-center p-8 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <div className="text-center">
              <div className="relative w-36 h-36 mx-auto mb-4">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#1e293b" strokeWidth="8" />
                  <circle cx="60" cy="60" r="52" fill="none"
                    stroke={getScoreColor(report.overall_score)} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${(report.overall_score / 100) * 327} 327`} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black" style={{ color: getScoreColor(report.overall_score) }}>
                    {report.overall_score}
                  </span>
                  <span className="text-xs text-slate-500">out of 100</span>
                </div>
              </div>
              <p className="text-lg font-semibold" style={{ color: getScoreColor(report.overall_score) }}>
                {getScoreLabel(report.overall_score)}
              </p>
            </div>
          </div>

          {/* 6 Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {HEALTH_DIMENSIONS.map((dim) => {
              const data = report.dimensions?.[dim.key];
              if (!data) return null;
              return (
                <div key={dim.key} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{dim.icon}</span>
                    <span className="text-sm font-medium text-white">{dim.label}</span>
                    <span className="ml-auto text-lg font-bold" style={{ color: getScoreColor(data.score) }}>
                      {data.score}
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div className="h-2 rounded-full bg-slate-700 mb-3 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${data.score}%`, backgroundColor: getScoreColor(data.score) }} />
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{data.details}</p>
                  {data.actions?.length > 0 && (
                    <ul className="space-y-1">
                      {data.actions.slice(0, 2).map((a, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500">
                          <ArrowRight size={12} className="mt-0.5 text-emerald-500 shrink-0" /> {a}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Top Actions */}
          {report.top_3_actions?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">🎯 Top Priority Actions</h3>
              <div className="space-y-3">
                {report.top_3_actions.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/40 border border-slate-700/30">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{a.action}</p>
                      <p className="text-xs text-slate-500">{a.category} · {a.impact} impact</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-pink-400" />
              <span className="text-sm font-medium text-pink-400">AI Summary</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{report.ai_summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}
