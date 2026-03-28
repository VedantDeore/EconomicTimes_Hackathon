"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTaxWizardStore, type TaxHistoryEntry } from "@/store/taxWizardStore";
import { computeHRA } from "@/lib/engine/tax";
import type { TaxStep, TaxRegimeResult, TaxAnalysisResult } from "@/lib/engine/tax";
import { formatCurrency } from "@/lib/utils";
import { TAX_REFERENCES, getRefForSection, type TaxRef } from "@/lib/taxReferences";
import { TAX_EDUCATION_CARDS, GLOSSARY_TERMS, TAX_JOURNEY_STEPS, SECTION_DEEP_DIVES } from "@/lib/taxEducation";
import { useMentorStore } from "@/store/mentorStore";
import {
  Calculator, Sparkles, Upload, Check, AlertTriangle, Info,
  ChevronDown, ChevronUp, TrendingDown, Shield, ArrowRight,
  Download, History, ExternalLink, BookOpen, Printer, Scale,
  HelpCircle, MessageSquare, GraduationCap, FileText,
} from "lucide-react";

/* ─── useCountUp hook ─── */
function useCountUp(target: number, duration = 800): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) { setVal(0); return; }
    const start = performance.now();
    let raf: number;
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─── Tip component ─── */
function Tip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block ml-1 align-middle">
      <button onClick={() => setOpen(!open)} className="text-slate-500 hover:text-emerald-400 transition-colors">
        <Info size={14} />
      </button>
      {open && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 shadow-xl">
          {text}
          <span className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 rotate-45 bg-slate-800 border-r border-b border-slate-700" />
        </span>
      )}
    </span>
  );
}

/* ─── RefLink component ─── */
function RefLink({ r }: { r: TaxRef }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
      <ExternalLink size={10} /> {r.section} — Official Reference
    </a>
  );
}

/* ─── ProgressBar ─── */
function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= 90 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="mt-1.5">
      <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
        <span>{label}</span>
        <span>{formatCurrency(value)} / {formatCurrency(max)} ({Math.round(pct)}%)</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ─── WaterfallChart with animated bars ─── */
function WaterfallChart({ steps, title }: { steps: TaxStep[]; title: string }) {
  const deductions = steps.filter(s => s.type === "deduction" && s.amount < 0);
  const slabSteps = steps.filter(s => s.type === "slab");
  const taxableStep = steps.find(s => s.type === "total" && s.label.includes("Taxable"));
  const rebateStep = steps.find(s => s.type === "rebate");
  const cessStep = steps.find(s => s.type === "cess");
  const totalStep = steps.find(s => s.type === "total" && s.label.includes("Total Tax"));
  const grossStep = steps.find(s => s.type === "income" && s.label === "Gross Salary");

  const maxVal = grossStep?.amount || 1;
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="space-y-1.5">
        {grossStep && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 w-44 shrink-0 truncate">{grossStep.label}</span>
            <div className="flex-1 h-5 rounded bg-slate-700/30 overflow-hidden">
              <div className="h-full rounded bg-emerald-500/70 transition-all duration-700 ease-out" style={{ width: animated ? "100%" : "0%" }} />
            </div>
            <span className="text-[11px] text-emerald-400 w-24 text-right font-mono">{formatCurrency(grossStep.amount)}</span>
          </div>
        )}
        {deductions.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 w-44 shrink-0 truncate">{s.label}</span>
            <div className="flex-1 h-5 rounded bg-slate-700/30 overflow-hidden">
              <div className="h-full rounded bg-red-500/50 transition-all duration-700 ease-out" style={{ width: animated ? `${Math.min(100, (Math.abs(s.amount) / maxVal) * 100)}%` : "0%", transitionDelay: `${(i + 1) * 80}ms` }} />
            </div>
            <span className="text-[11px] text-red-400 w-24 text-right font-mono">-{formatCurrency(Math.abs(s.amount))}</span>
          </div>
        ))}
        {taxableStep && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
            <span className="text-[11px] text-white font-medium w-44 shrink-0">{taxableStep.label}</span>
            <div className="flex-1 h-5 rounded bg-slate-700/30 overflow-hidden">
              <div className="h-full rounded bg-cyan-500/70 transition-all duration-700 ease-out" style={{ width: animated ? `${(taxableStep.amount / maxVal) * 100}%` : "0%", transitionDelay: `${(deductions.length + 1) * 80}ms` }} />
            </div>
            <span className="text-[11px] text-cyan-400 w-24 text-right font-mono font-semibold">{formatCurrency(taxableStep.amount)}</span>
          </div>
        )}
      </div>

      {slabSteps.length > 0 && (
        <div className="space-y-1.5 pt-2 border-t border-slate-700/30">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tax Slab Computation</p>
          {slabSteps.map((s, i) => {
            const maxTax = totalStep?.amount || 1;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 w-44 shrink-0 truncate">{s.label}</span>
                <div className="flex-1 h-4 rounded bg-slate-700/30 overflow-hidden">
                  <div className="h-full rounded bg-amber-500/60 transition-all duration-700 ease-out" style={{ width: animated ? `${Math.min(100, (s.amount / Math.max(maxTax, 1)) * 100)}%` : "0%", transitionDelay: `${(deductions.length + 2 + i) * 80}ms` }} />
                </div>
                <span className="text-[11px] text-amber-400 w-24 text-right font-mono">{formatCurrency(s.amount)}</span>
              </div>
            );
          })}
          {rebateStep && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-400 w-44 shrink-0">{rebateStep.label}</span>
              <div className="flex-1" />
              <span className="text-[11px] text-emerald-400 w-24 text-right font-mono">{formatCurrency(rebateStep.amount)}</span>
            </div>
          )}
          {cessStep && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 w-44 shrink-0">{cessStep.label}</span>
              <div className="flex-1" />
              <span className="text-[11px] text-orange-400 w-24 text-right font-mono">+{formatCurrency(cessStep.amount)}</span>
            </div>
          )}
          {totalStep && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
              <span className="text-[11px] text-white font-bold w-44 shrink-0">{totalStep.label}</span>
              <div className="flex-1" />
              <span className="text-sm text-white w-24 text-right font-mono font-bold">{formatCurrency(totalStep.amount)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Animated Verdict Card ─── */
function VerdictCard({ label, value, isRecommended, subtext }: { label: string; value: number; isRecommended?: boolean; subtext?: string }) {
  const animated = useCountUp(value);
  return (
    <div className={`p-4 rounded-xl border transition-all duration-500 ${isRecommended ? "bg-emerald-500/10 border-emerald-500/30" : "bg-slate-800/50 border-slate-700/50"}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${isRecommended ? "text-emerald-400" : "text-white"}`}>{formatCurrency(animated)}</p>
      {isRecommended && subtext && <span className="text-[10px] text-emerald-400/70">{subtext}</span>}
      {isRecommended && !subtext && <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1"><Check size={10} /> Recommended</span>}
    </div>
  );
}

/* ─── Rich Text Renderer ─── */
function RichText({ text, className = "" }: { text: string; className?: string }) {
  return (
    <>
      {text.split("\n").map((line, i) => (
        <p key={i} className={`${className} ${i > 0 ? "mt-1.5" : ""}`}>
          {line.split(/\*\*(.*?)\*\*/g).map((part, k) =>
            k % 2 === 1 ? <strong key={k} className="text-white font-semibold">{part}</strong> : part
          )}
        </p>
      ))}
    </>
  );
}

/* ─── Education Section (rebuilt with rich UI) ─── */
function EducationSection() {
  const [activeTab, setActiveTab] = useState<"overview" | "journey" | "sections" | "glossary" | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [expandedDive, setExpandedDive] = useState<string | null>(null);

  const TABS = [
    { id: "overview" as const, label: "How Tax Works", emoji: "📖", color: "text-amber-400" },
    { id: "journey" as const, label: "Tax Journey (Step-by-Step)", emoji: "🗺️", color: "text-cyan-400" },
    { id: "sections" as const, label: "Deductions Deep-Dive", emoji: "🔍", color: "text-violet-400" },
    { id: "glossary" as const, label: "Glossary of Terms", emoji: "📚", color: "text-emerald-400" },
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-500/5 via-slate-800/20 to-emerald-500/5 border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20">
            <GraduationCap size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">New to Taxes? Learn Everything Here</h3>
            <p className="text-xs text-slate-500">Explained so simply that even a 10-year-old can understand</p>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(activeTab === tab.id ? null : tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-slate-700/60 text-white border border-slate-600/50"
                  : "bg-slate-800/30 text-slate-400 border border-slate-700/30 hover:text-white hover:border-slate-600/50"
              }`}>
              <span>{tab.emoji}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Overview — Education Cards */}
      {activeTab === "overview" && (
        <div className="p-4 space-y-3">
          {TAX_EDUCATION_CARDS.map((card) => (
            <div key={card.id} className="rounded-xl bg-slate-800/40 border border-slate-700/30 overflow-hidden">
              <button onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{card.emoji}</span>
                  <div className="text-left">
                    <span className="text-sm text-white font-semibold">{card.title}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{card.summary}</p>
                  </div>
                </div>
                {expandedCard === card.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
              </button>

              {expandedCard === card.id && (
                <div className="px-4 pb-4 space-y-4">
                  {/* Main explanation */}
                  <p className="text-sm text-slate-300 leading-relaxed">{card.content}</p>

                  {/* Analogy box */}
                  <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">💡</span>
                      <span className="text-xs font-semibold text-amber-400">Real-World Analogy</span>
                    </div>
                    <RichText text={card.analogy} className="text-xs text-slate-300 leading-relaxed" />
                  </div>

                  {/* Detailed explanation */}
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">📋</span>
                      <span className="text-xs font-semibold text-cyan-400">Detailed Breakdown</span>
                    </div>
                    <RichText text={card.details} className="text-xs text-slate-400 leading-relaxed" />
                  </div>

                  {/* Example */}
                  {card.example && (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm">🧮</span>
                        <span className="text-xs font-semibold text-emerald-400">Worked Example</span>
                      </div>
                      <RichText text={card.example} className="text-xs text-slate-300 leading-relaxed font-mono" />
                    </div>
                  )}

                  {/* Glossary grid for key-terms card */}
                  {card.id === "key-terms" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {GLOSSARY_TERMS.map((g) => (
                        <div key={g.term} className="p-2.5 rounded-lg bg-slate-900/30 border border-slate-700/20 hover:border-slate-600/40 transition-colors">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-sm">{g.emoji}</span>
                            <span className="text-xs font-bold text-amber-400">{g.term}</span>
                          </div>
                          <span className="text-[9px] text-slate-600">({g.full})</span>
                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{g.simple}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reference link */}
                  {card.refUrl && (
                    <a href={card.refUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                      <ExternalLink size={11} /> Read more on ClearTax
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB: Tax Journey — Visual Flow */}
      {activeTab === "journey" && (
        <div className="p-4">
          <p className="text-xs text-slate-400 mb-4">Follow the journey of your salary — from what your company pays you to what the government takes. Each step has a simple explanation.</p>
          <div className="relative">
            {TAX_JOURNEY_STEPS.map((step, i) => {
              const colorMap: Record<string, string> = {
                emerald: "border-emerald-500/30 bg-emerald-500/5",
                cyan: "border-cyan-500/30 bg-cyan-500/5",
                amber: "border-amber-500/30 bg-amber-500/5",
                violet: "border-violet-500/30 bg-violet-500/5",
                sky: "border-sky-500/30 bg-sky-500/5",
                orange: "border-orange-500/30 bg-orange-500/5",
                pink: "border-pink-500/30 bg-pink-500/5",
                red: "border-red-500/30 bg-red-500/5",
              };
              const dotColor: Record<string, string> = {
                emerald: "bg-emerald-500", cyan: "bg-cyan-500", amber: "bg-amber-500",
                violet: "bg-violet-500", sky: "bg-sky-500", orange: "bg-orange-500",
                pink: "bg-pink-500", red: "bg-red-500",
              };
              const textColor: Record<string, string> = {
                emerald: "text-emerald-400", cyan: "text-cyan-400", amber: "text-amber-400",
                violet: "text-violet-400", sky: "text-sky-400", orange: "text-orange-400",
                pink: "text-pink-400", red: "text-red-400",
              };
              return (
                <div key={step.step} className="flex gap-4 mb-3 last:mb-0">
                  {/* Timeline */}
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className={`w-8 h-8 rounded-full ${dotColor[step.color]} flex items-center justify-center text-white text-xs font-bold shadow-lg`}>
                      {step.step}
                    </div>
                    {i < TAX_JOURNEY_STEPS.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-700/50 my-1" />
                    )}
                  </div>
                  {/* Content */}
                  <div className={`flex-1 p-3 rounded-xl border ${colorMap[step.color]} mb-1`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{step.emoji}</span>
                      <span className={`text-sm font-semibold ${textColor[step.color]}`}>{step.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-slate-900/40 border border-slate-700/20">
            <p className="text-[10px] text-slate-500 text-center">
              This tool performs ALL these steps automatically. Just enter your numbers and click &quot;Analyze&quot;!
            </p>
          </div>
        </div>
      )}

      {/* TAB: Section Deep-Dives */}
      {activeTab === "sections" && (
        <div className="p-4 space-y-2">
          <p className="text-xs text-slate-400 mb-3">Click each section to understand exactly what it does, with examples using real Indian numbers.</p>
          {SECTION_DEEP_DIVES.map((dive) => {
            const colorMap: Record<string, string> = {
              emerald: "border-emerald-500/30 hover:border-emerald-500/50",
              pink: "border-pink-500/30 hover:border-pink-500/50",
              sky: "border-sky-500/30 hover:border-sky-500/50",
              violet: "border-violet-500/30 hover:border-violet-500/50",
              orange: "border-orange-500/30 hover:border-orange-500/50",
            };
            const titleColor: Record<string, string> = {
              emerald: "text-emerald-400", pink: "text-pink-400", sky: "text-sky-400",
              violet: "text-violet-400", orange: "text-orange-400",
            };
            const isOpen = expandedDive === dive.id;
            return (
              <div key={dive.id} className={`rounded-xl bg-slate-800/40 border ${colorMap[dive.color]} overflow-hidden transition-colors`}>
                <button onClick={() => setExpandedDive(isOpen ? null : dive.id)}
                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{dive.emoji}</span>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${titleColor[dive.color]}`}>{dive.section}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-700/50 text-[9px] text-slate-400 font-medium">Max: {dive.maxLimit}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{dive.title}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* What is it */}
                    <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">What is it?</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{dive.whatIsIt}</p>
                    </div>

                    {/* Why it matters */}
                    <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Why it matters to YOU</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{dive.whyItMatters}</p>
                    </div>

                    {/* How it works */}
                    <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-700/20">
                      <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-wider mb-1">How it works</p>
                      <RichText text={dive.howItWorks} className="text-xs text-slate-400 leading-relaxed" />
                    </div>

                    {/* Real example */}
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Real Example</p>
                      <RichText text={dive.example} className="text-xs text-slate-300 leading-relaxed font-mono" />
                    </div>

                    {/* Pro tip */}
                    <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles size={10} className="text-violet-400" />
                        <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">Pro Tip</p>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{dive.proTip}</p>
                    </div>

                    {/* Reference */}
                    <a href={dive.refUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                      <ExternalLink size={11} /> Read detailed guide on ClearTax — {dive.section}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB: Glossary */}
      {activeTab === "glossary" && (
        <div className="p-4">
          <p className="text-xs text-slate-400 mb-3">Every financial term on this page, explained in simple words with everyday Indian examples.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {GLOSSARY_TERMS.map((g) => (
              <div key={g.term} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-slate-600/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{g.emoji}</span>
                  <div>
                    <span className="text-xs font-bold text-amber-400">{g.term}</span>
                    <span className="text-[9px] text-slate-600 ml-1.5">({g.full})</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{g.simple}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── History Panel ─── */
function HistoryPanel({
  history,
  onLoad,
}: {
  history: TaxHistoryEntry[];
  onLoad: (entry: TaxHistoryEntry) => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <button onClick={() => setShowHistory(!showHistory)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <History size={16} className="text-violet-400" />
          <span className="text-sm font-medium text-white">Previous Calculations ({history.length})</span>
        </div>
        {showHistory ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {showHistory && (
        <div className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {["Date", "Gross Salary", "Best Regime", "Old Tax", "New Tax", "Saved", ""].map(h => (
                    <th key={h} className="text-left py-2 px-2 text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                    <td className="py-2 px-2 text-slate-400">{new Date(entry.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="py-2 px-2 text-white">{formatCurrency(entry.gross_salary)}</td>
                    <td className="py-2 px-2"><span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${entry.recommended_regime === "old" ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}`}>{entry.recommended_regime.toUpperCase()}</span></td>
                    <td className="py-2 px-2 text-slate-300">{formatCurrency(entry.old_tax)}</td>
                    <td className="py-2 px-2 text-slate-300">{formatCurrency(entry.new_tax)}</td>
                    <td className="py-2 px-2 text-emerald-400">{formatCurrency(entry.savings)}</td>
                    <td className="py-2 px-2">
                      <button onClick={() => onLoad(entry)}
                        className="px-2 py-1 rounded-lg bg-violet-500/20 text-violet-400 text-[10px] font-medium hover:bg-violet-500/30 transition-colors">
                        Load
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Why This Regime Panel ─── */
function WhyThisRegime({ analysis }: { analysis: TaxAnalysisResult }) {
  const rc = analysis.regime_comparison;
  const rec = rc.recommended_regime;
  const oldSteps = rc.old_regime.steps;
  const deductionTotal = oldSteps
    .filter(s => s.type === "deduction" && s.amount < 0)
    .reduce((sum, s) => sum + Math.abs(s.amount), 0);

  const reasons: string[] = [];
  if (rec === "old") {
    reasons.push(`Your total deductions in Old Regime amount to ${formatCurrency(deductionTotal)}, which significantly reduces your taxable income.`);
    reasons.push(`Old Regime tax: ${formatCurrency(rc.old_regime.total_tax)} vs New Regime tax: ${formatCurrency(rc.new_regime.total_tax)}.`);
    reasons.push(`In New Regime, you lose HRA exemption, 80C, 80D, NPS, and home loan interest deductions — only ₹75,000 standard deduction is available.`);
    if (deductionTotal > 375000) {
      reasons.push(`Since your deductions exceed ₹3.75L, Old Regime clearly wins.`);
    }
  } else {
    reasons.push(`Your deductions total ${formatCurrency(deductionTotal)}, which is not enough to offset the lower slab rates in New Regime.`);
    reasons.push(`New Regime tax: ${formatCurrency(rc.new_regime.total_tax)} vs Old Regime tax: ${formatCurrency(rc.old_regime.total_tax)}.`);
    if (rc.new_regime.taxable_income <= 1200000) {
      reasons.push(`Taxable income ≤ ₹12L → you qualify for full rebate u/s 87A, making tax effectively zero.`);
    }
  }

  const regimeRef = rec === "old" ? TAX_REFERENCES.slabs_old : TAX_REFERENCES.slabs_new;

  return (
    <div className="p-5 rounded-xl bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border border-emerald-500/20 space-y-3">
      <div className="flex items-center gap-2">
        <Scale size={16} className="text-emerald-400" />
        <h4 className="text-sm font-semibold text-white">Why {rec === "old" ? "Old" : "New"} Regime is Better for You</h4>
      </div>
      <div className="space-y-2">
        {reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2">
            <ArrowRight size={12} className="text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-300">{r}</p>
          </div>
        ))}
      </div>
      <RefLink r={regimeRef} />
    </div>
  );
}

/* ─── Form 16 Part B Preview ─── */
function Form16Preview({ analysis, income, deductions, hraExemption }: {
  analysis: TaxAnalysisResult;
  income: Record<string, unknown>;
  deductions: Record<string, unknown>;
  hraExemption: number;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const rc = analysis.regime_comparison;
  const rec = rc.recommended_regime;
  const regime = rec === "old" ? rc.old_regime : rc.new_regime;

  const gross = (income.gross_salary as number) || 0;
  const stdDed = rec === "old" ? 50000 : 75000;
  const profTax = (income.professional_tax as number) || 0;
  const hraEx = rec === "old" ? hraExemption : 0;
  const netSalary = gross - hraEx;
  const incomeFromSalary = netSalary - stdDed - profTax;

  const sec80c = ((deductions as Record<string, Record<string, number>>).section_80c?.total) || 0;
  const sec80d = ((deductions as Record<string, Record<string, number>>).section_80d?.total) || 0;
  const nps = (deductions as Record<string, number>).nps_80ccd_1b || 0;
  const homeLoan = (deductions as Record<string, number>).home_loan_interest_24b || 0;

  const totalVIA = rec === "old" ? Math.min(sec80c, 150000) + Math.min(sec80d, 100000) + Math.min(nps, 50000) + Math.min(homeLoan, 200000) : 0;

  const rebateStep = regime.steps.find(s => s.type === "rebate");
  const rebate = rebateStep ? Math.abs(rebateStep.amount) : 0;

  const rows: [string, string, string][] = [
    ["1", "Gross Salary [Section 17(1)]", formatCurrency(gross)],
    ["2", "Value of perquisites [Section 17(2)]", formatCurrency(0)],
    ["3", "Profits in lieu of salary [Section 17(3)]", formatCurrency(0)],
    ["4", "Total Salary (1+2+3)", formatCurrency(gross)],
    ["5", "Less: Allowance exempt u/s 10 (HRA)", rec === "old" ? `-${formatCurrency(hraEx)}` : "N/A"],
    ["6", `Net Salary (4-5)`, formatCurrency(netSalary)],
    ["7", `Less: Standard Deduction u/s 16(ia)`, `-${formatCurrency(stdDed)}`],
    ["8", "Less: Professional Tax u/s 16(iii)", `-${formatCurrency(profTax)}`],
    ["9", "Income from Salary (6-7-8)", formatCurrency(incomeFromSalary)],
    ["10a", "  80C Deductions", rec === "old" ? formatCurrency(Math.min(sec80c, 150000)) : "N/A"],
    ["10b", "  80D Deductions", rec === "old" ? formatCurrency(Math.min(sec80d, 100000)) : "N/A"],
    ["10c", "  80CCD(1B) NPS", rec === "old" ? formatCurrency(Math.min(nps, 50000)) : "N/A"],
    ["10d", "  24(b) Home Loan Interest", rec === "old" ? formatCurrency(Math.min(homeLoan, 200000)) : "N/A"],
    ["10", "Total Chapter VI-A Deductions", rec === "old" ? formatCurrency(totalVIA) : "N/A"],
    ["11", "Total Taxable Income", formatCurrency(regime.taxable_income)],
    ["12", "Tax on Total Income", formatCurrency(regime.tax_payable + (rebate))],
    ["13", "Less: Rebate u/s 87A", rebate > 0 ? `-${formatCurrency(rebate)}` : formatCurrency(0)],
    ["14", "Add: Health & Education Cess (4%)", `+${formatCurrency(regime.cess)}`],
    ["15", "Total Tax Liability", formatCurrency(regime.total_tax)],
  ];

  const handlePrint = () => {
    if (!previewRef.current) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><title>Form 16 Part B Preview</title><style>
      body { font-family: 'Times New Roman', serif; padding: 40px; color: #1a1a1a; }
      h2 { text-align: center; font-size: 16px; margin: 0; }
      h3 { text-align: center; font-size: 13px; font-weight: normal; margin: 4px 0 16px; }
      .meta { text-align: center; font-size: 12px; margin-bottom: 20px; color: #555; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { border: 1px solid #333; padding: 6px 10px; }
      th { background: #f0f0f0; text-align: left; }
      .amount { text-align: right; font-family: 'Courier New', monospace; }
      .total-row { font-weight: bold; background: #f5f5f0; }
      .sub-row td:nth-child(2) { padding-left: 28px; font-size: 12px; color: #555; }
      .footer { margin-top: 24px; font-size: 11px; color: #777; text-align: center; }
    </style></head><body>
      <h2>FORM NO. 16</h2>
      <h3>[See Rule 31(1)(a)] — Part B (Annexure)</h3>
      <p class="meta">Assessment Year: 2026-27 | Financial Year: 2025-26 | Regime: ${rec === "old" ? "Old" : "New"}</p>
      <table>
        <thead><tr><th style="width:40px">S.No.</th><th>Particulars</th><th style="width:140px" class="amount">Amount (₹)</th></tr></thead>
        <tbody>${rows.map(([no, label, amt]) => {
      const isTotal = no === "4" || no === "9" || no === "10" || no === "11" || no === "15";
      const isSub = no.startsWith("10") && no.length > 2;
      return `<tr class="${isTotal ? "total-row" : ""} ${isSub ? "sub-row" : ""}"><td>${no}</td><td>${label}</td><td class="amount">${amt}</td></tr>`;
    }).join("")}</tbody>
      </table>
      <p class="footer">Generated by ET AI Money Mentor — for reference only. Verify with your employer's Form 16.</p>
    </body></html>`);
    printWin.document.close();
    printWin.print();
  };

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">
      <button onClick={() => setShowPreview(!showPreview)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
        <div className="flex items-center gap-3">
          <FileText size={16} className="text-amber-400" />
          <div className="text-left">
            <span className="text-sm font-medium text-white">Form 16 Part B Preview</span>
            <p className="text-[10px] text-slate-500">See your tax computation in official Form 16 format</p>
          </div>
        </div>
        {showPreview ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {showPreview && (
        <div className="p-4" ref={previewRef}>
          <div className="bg-white rounded-xl p-6 text-slate-900 max-w-2xl mx-auto shadow-lg">
            <div className="text-center mb-4">
              <h4 className="text-base font-bold text-slate-900">FORM NO. 16</h4>
              <p className="text-xs text-slate-600">[See Rule 31(1)(a)] — Part B (Annexure)</p>
              <p className="text-[10px] text-slate-500 mt-1">Financial Year: 2025-26 | Assessment Year: 2026-27 | Regime: {rec === "old" ? "Old" : "New"}</p>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 py-1.5 px-2 text-left w-10">S.No.</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-left">Particulars</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([no, label, amt]) => {
                  const isTotal = ["4", "9", "10", "11", "15"].includes(no);
                  const isSub = no.startsWith("10") && no.length > 2;
                  return (
                    <tr key={no} className={`${isTotal ? "bg-slate-50 font-semibold" : ""}`}>
                      <td className={`border border-slate-300 py-1.5 px-2 ${isSub ? "text-slate-400" : ""}`}>{no}</td>
                      <td className={`border border-slate-300 py-1.5 px-2 ${isSub ? "pl-6 text-slate-500 text-[11px]" : ""}`}>{label}</td>
                      <td className="border border-slate-300 py-1.5 px-2 text-right font-mono">{amt}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="text-[9px] text-slate-400 text-center mt-3">Generated by ET AI Money Mentor — for reference purposes only</p>
          </div>
          <div className="flex justify-center mt-3 gap-2">
            <button onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 text-xs flex items-center gap-2 hover:bg-slate-700 transition-colors">
              <Printer size={14} /> Print / Save as PDF
            </button>
            <RefLink r={TAX_REFERENCES.form16} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Verify Our Calculations Footer ─── */
function VerifyFooter() {
  const links: TaxRef[] = [
    TAX_REFERENCES.slabs_new,
    TAX_REFERENCES.regime_comparison,
    TAX_REFERENCES.budget_2025,
    TAX_REFERENCES.efiling,
  ];
  return (
    <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-3">
      <div className="flex items-center gap-2">
        <Shield size={16} className="text-cyan-400" />
        <h4 className="text-sm font-semibold text-white">Verify Our Calculations</h4>
      </div>
      <p className="text-xs text-slate-400">Cross-check every number using official Income Tax Department resources:</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {links.map((ref) => (
          <a key={ref.section} href={ref.url} target="_blank" rel="noopener noreferrer"
            className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/30 hover:border-cyan-500/30 transition-colors group">
            <ExternalLink size={12} className="text-cyan-400 mb-1" />
            <p className="text-xs text-white font-medium group-hover:text-cyan-400 transition-colors">{ref.label}</p>
            <p className="text-[10px] text-slate-500">{ref.section}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Ranking Methodology ─── */
function RankingMethodology() {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-3">
      <button onClick={() => setShow(!show)} className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
        <Info size={10} /> How we ranked these instruments
      </button>
      {show && (
        <div className="mt-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/20 text-[10px] text-slate-400 space-y-1">
          <p><strong className="text-white">Liquidity</strong>: How quickly you can access your money. High = instant/days, Medium = months, Low = years, Very Low = locked for 5+ years.</p>
          <p><strong className="text-white">Risk</strong>: Market risk to your principal. Zero = government guarantee, Low = mostly safe, Moderate = some volatility, High = equity exposure.</p>
          <p><strong className="text-white">TOP PICK</strong>: Best risk-adjusted return for the given lock-in period, considering tax benefit value at your marginal rate.</p>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/*                      MAIN PAGE                             */
/* ────────────────────────────────────────────────────────── */

const RISK_COLORS: Record<string, string> = {
  "zero (govt-backed)": "#10b981", "zero (govt)": "#10b981", "zero (bank)": "#10b981",
  "n/a": "#64748b", "low": "#22d3ee", "moderate": "#f59e0b",
  "moderate-high": "#f97316", "high": "#ef4444",
};
const LIQUIDITY_LABELS: Record<string, string> = {
  high: "High", medium: "Medium", low: "Low", very_low: "Very Low",
};

export default function TaxWizardPage() {
  useAuth();
  const { analysis, isAnalyzing, analyze, uploadForm16, history, saveToHistory, loadHistory } = useTaxWizardStore();
  const [showSteps, setShowSteps] = useState(true);

  const [income, setIncome] = useState({
    gross_salary: 1800000,
    basic_salary: 900000,
    hra_received: 360000,
    rent_paid: 25000,
    is_metro: true,
    standard_deduction: 50000,
    professional_tax: 2400,
    income_from_other_sources: 0,
    rental_income: 0,
    capital_gains: { short_term: 0, long_term: 0 },
  });

  const [deductions, setDeductions] = useState({
    section_80c: { epf: 21600, ppf: 50000, elss: 50000, life_insurance: 28400, total: 150000 },
    section_80d: { self_premium: 15000, parents_premium: 0, preventive_health: 5000, total: 20000 },
    nps_80ccd_1b: 50000,
    home_loan_interest_24b: 40000,
    education_loan_80e: 0,
    donations_80g: 0,
    savings_interest_80tta: 8000,
    hra_exemption: 0,
  });

  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const hra_calc = computeHRA(income.basic_salary, income.hra_received, income.rent_paid * 12, income.is_metro);

  const update80C = (key: string, val: number) => {
    setDeductions(prev => {
      const s = { ...prev.section_80c, [key]: val };
      s.total = (s.epf || 0) + (s.ppf || 0) + (s.elss || 0) + (s.life_insurance || 0);
      return { ...prev, section_80c: s };
    });
  };
  const update80D = (key: string, val: number) => {
    setDeductions(prev => {
      const s = { ...prev.section_80d, [key]: val };
      s.total = (s.self_premium || 0) + (s.parents_premium || 0) + (s.preventive_health || 0);
      return { ...prev, section_80d: s };
    });
  };

  const handleAnalyze = async () => {
    const payload = {
      financial_year: "2025-26",
      income_details: income,
      deductions: { ...deductions, hra_exemption: hra_calc.exemption },
    };
    await analyze(payload);
    setTimeout(() => {
      saveToHistory(income as unknown as Record<string, unknown>, deductions as unknown as Record<string, unknown>);
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg(null);
    const data = await uploadForm16(file);

    if (data.parsed) {
      const inc = data.income as Record<string, number | boolean> | undefined;
      const ded = data.deductions as Record<string, unknown> | undefined;

      if (inc) {
        setIncome(prev => ({
          ...prev,
          ...(typeof inc.gross_salary === "number" && { gross_salary: inc.gross_salary }),
          ...(typeof inc.basic_salary === "number" && { basic_salary: inc.basic_salary }),
          ...(typeof inc.hra_received === "number" && { hra_received: inc.hra_received }),
          ...(typeof inc.rent_paid === "number" && { rent_paid: inc.rent_paid }),
          ...(typeof inc.is_metro === "boolean" && { is_metro: inc.is_metro }),
          ...(typeof inc.professional_tax === "number" && { professional_tax: inc.professional_tax }),
          ...(typeof inc.income_from_other_sources === "number" && { income_from_other_sources: inc.income_from_other_sources }),
        }));
      }
      if (ded) {
        setDeductions(prev => {
          const s80c = (ded.section_80c as Record<string, number>) || {};
          const s80d = (ded.section_80d as Record<string, number>) || {};
          return {
            ...prev,
            section_80c: {
              epf: s80c.epf ?? prev.section_80c.epf,
              ppf: s80c.ppf ?? prev.section_80c.ppf,
              elss: s80c.elss ?? prev.section_80c.elss,
              life_insurance: s80c.life_insurance ?? prev.section_80c.life_insurance,
              total: s80c.total ?? prev.section_80c.total,
            },
            section_80d: {
              self_premium: s80d.self_premium ?? prev.section_80d.self_premium,
              parents_premium: s80d.parents_premium ?? prev.section_80d.parents_premium,
              preventive_health: s80d.preventive_health ?? prev.section_80d.preventive_health,
              total: s80d.total ?? prev.section_80d.total,
            },
            nps_80ccd_1b: (ded.nps_80ccd_1b as number) ?? prev.nps_80ccd_1b,
            home_loan_interest_24b: (ded.home_loan_interest_24b as number) ?? prev.home_loan_interest_24b,
            education_loan_80e: (ded.education_loan_80e as number) ?? prev.education_loan_80e,
            savings_interest_80tta: (ded.savings_interest_80tta as number) ?? prev.savings_interest_80tta,
            donations_80g: (ded.donations_80g as number) ?? prev.donations_80g,
            hra_exemption: prev.hra_exemption,
          };
        });
      }
      setUploadMsg("CSV parsed successfully! All fields have been populated.");
    } else {
      const g = data?.suggested_gross_salary;
      if (typeof g === "number" && g > 0) {
        setIncome(prev => ({ ...prev, gross_salary: g }));
        setUploadMsg(`Extracted gross salary: ${formatCurrency(g)}. Other fields unchanged.`);
      } else {
        setUploadMsg((data.message as string) || "Could not parse file. Try the sample CSV format.");
      }
    }
  };

  const handleLoadHistory = useCallback((entry: TaxHistoryEntry) => {
    const inc = entry.income as typeof income;
    const ded = entry.deductions as typeof deductions;
    setIncome(inc);
    setDeductions(ded);
    useTaxWizardStore.setState({ analysis: entry.analysis });
  }, []);

  const openMentorWithTax = () => {
    useMentorStore.getState().toggle();
  };

  const rc = analysis?.regime_comparison;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20">
            <Calculator size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Tax Wizard</h1>
            <p className="text-sm text-slate-500">Step-by-step Old vs New Regime comparison for FY 2025-26</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <a href="/sample-form16.csv" download
            className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2 hover:bg-emerald-500/20 transition-all">
            <Download size={16} /> Download Sample CSV
          </a>
          <label className="px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:border-slate-600 cursor-pointer flex items-center gap-2 text-sm transition-all">
            <Upload size={16} /> Upload Form 16
            <input type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Upload feedback */}
      {uploadMsg && (
        <div className={`p-3 rounded-xl border text-sm flex items-center gap-2 ${uploadMsg.includes("success") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"}`}>
          {uploadMsg.includes("success") ? <Check size={16} /> : <AlertTriangle size={16} />}
          {uploadMsg}
        </div>
      )}

      {/* Education Section */}
      <EducationSection />

      {/* History Panel */}
      <HistoryPanel history={history} onLoad={handleLoadHistory} />

      {/* Verdict row */}
      {rc && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
          <VerdictCard label="Old Regime Tax" value={rc.old_regime.total_tax} isRecommended={rc.recommended_regime === "old"} />
          <VerdictCard label="New Regime Tax" value={rc.new_regime.total_tax} isRecommended={rc.recommended_regime === "new"} />
          <VerdictCard label="You Save" value={rc.savings} isRecommended subtext={`with ${rc.recommended_regime === "old" ? "Old" : "New"} Regime`} />
        </div>
      )}

      {/* Income Details */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Income Details (FY 2025-26)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "Gross Salary (CTC)", key: "gross_salary", tip: "Your total salary before any deductions (Cost to Company)." },
            { label: "Basic Salary", key: "basic_salary", tip: "Usually 40-50% of CTC. Used for HRA, PF, gratuity calculations." },
            { label: "HRA Received", key: "hra_received", tip: "House Rent Allowance component from your salary." },
            { label: "Rent Paid/month", key: "rent_paid", tip: "Monthly rent you pay. Used to calculate HRA exemption." },
            { label: "Other Income", key: "income_from_other_sources", tip: "Interest, freelancing, side income, etc." },
            { label: "Professional Tax", key: "professional_tax", tip: "Tax deducted by employer (max ₹2,400/yr in most states)." },
          ] as const).map((f) => (
            <div key={f.key}>
              <label className="block text-xs text-slate-500 mb-1.5">{f.label}<Tip text={f.tip} /></label>
              <input type="number" value={income[f.key] as number}
                onChange={(e) => setIncome({ ...income, [f.key]: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">City Type<Tip text="Metro = Mumbai, Delhi, Kolkata, Chennai. HRA exemption is 50% of basic for metro, 40% for non-metro." /></label>
            <div className="flex gap-2 mt-1">
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => setIncome({ ...income, is_metro: v })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${income.is_metro === v ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 border border-slate-700/50 hover:text-white"}`}>
                  {v ? "Metro" : "Non-Metro"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Auto HRA */}
        {income.basic_salary > 0 && income.hra_received > 0 && income.rent_paid > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-2">
            <h4 className="text-sm font-medium text-white flex items-center gap-2"><Shield size={14} className="text-cyan-400" /> Auto HRA Exemption Calculation</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div><span className="text-slate-500">Actual HRA</span><p className="text-white font-mono">{formatCurrency(hra_calc.actual_hra)}</p></div>
              <div><span className="text-slate-500">{income.is_metro ? "50%" : "40%"} of Basic</span><p className="text-white font-mono">{formatCurrency(hra_calc.percent_of_basic)}</p></div>
              <div><span className="text-slate-500">Rent - 10% Basic</span><p className="text-white font-mono">{formatCurrency(hra_calc.rent_minus_10pct)}</p></div>
              <div><span className="text-slate-500">HRA Exemption (min of above)</span><p className="text-emerald-400 font-mono font-bold">{formatCurrency(hra_calc.exemption)}</p></div>
            </div>
            <RefLink r={TAX_REFERENCES.hra} />
          </div>
        )}
      </div>

      {/* Deductions */}
      <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-4">
        <h3 className="text-lg font-semibold text-white">Deductions (Old Regime Only)<Tip text="These deductions reduce your taxable income under Old Regime. New Regime allows only ₹75K standard deduction." /></h3>

        {/* 80C */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Section 80C<Tip text={TAX_REFERENCES.section_80c.explanation || ""} /></h4>
            <RefLink r={TAX_REFERENCES.section_80c} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {([
              { label: "EPF", key: "epf" }, { label: "PPF", key: "ppf" },
              { label: "ELSS", key: "elss" }, { label: "Life Insurance", key: "life_insurance" },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-500 mb-1">{f.label}</label>
                <input type="number" value={deductions.section_80c[f.key]}
                  onChange={e => update80C(f.key, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
              </div>
            ))}
          </div>
          <ProgressBar value={Math.min(deductions.section_80c.total, 150000)} max={150000} label="80C Usage" />
        </div>

        {/* 80D */}
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-700/30 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Section 80D (Health Insurance)<Tip text={TAX_REFERENCES.section_80d.explanation || ""} /></h4>
            <RefLink r={TAX_REFERENCES.section_80d} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {([
              { label: "Self/Family Premium", key: "self_premium" },
              { label: "Parents Premium", key: "parents_premium" },
              { label: "Preventive Check-up", key: "preventive_health" },
            ] as const).map(f => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-500 mb-1">{f.label}</label>
                <input type="number" value={deductions.section_80d[f.key]}
                  onChange={e => update80D(f.key, Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
              </div>
            ))}
          </div>
          <ProgressBar value={Math.min(deductions.section_80d.total, 25000)} max={25000} label="80D Usage (self)" />
        </div>

        {/* Other deductions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {([
            { label: "NPS 80CCD(1B)", key: "nps_80ccd_1b", max: 50000, tip: TAX_REFERENCES.nps_80ccd.explanation || "", ref: TAX_REFERENCES.nps_80ccd },
            { label: "Home Loan Interest 24(b)", key: "home_loan_interest_24b", max: 200000, tip: TAX_REFERENCES.section_24b.explanation || "", ref: TAX_REFERENCES.section_24b },
            { label: "Education Loan 80E", key: "education_loan_80e", max: null, tip: TAX_REFERENCES.section_80e.explanation || "", ref: TAX_REFERENCES.section_80e },
            { label: "Savings Interest 80TTA", key: "savings_interest_80tta", max: 10000, tip: TAX_REFERENCES.section_80tta.explanation || "", ref: TAX_REFERENCES.section_80tta },
          ] as const).map(f => (
            <div key={f.key}>
              <label className="block text-xs text-slate-500 mb-1.5">{f.label}<Tip text={f.tip} /></label>
              <input type="number" value={deductions[f.key as keyof typeof deductions] as number}
                onChange={e => setDeductions({ ...deductions, [f.key]: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all" />
              {f.max && <ProgressBar value={Math.min(deductions[f.key as keyof typeof deductions] as number, f.max)} max={f.max} label="" />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleAnalyze} disabled={isAnalyzing}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-amber-500/25 transition-all disabled:opacity-50">
            {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={18} />}
            {isAnalyzing ? "Analyzing..." : "Analyze Tax — Step by Step"}
          </button>
          {analysis && (
            <button onClick={openMentorWithTax}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-400 font-medium flex items-center gap-2 hover:bg-emerald-500/30 transition-all text-sm">
              <MessageSquare size={16} /> Ask AI About My Taxes
            </button>
          )}
        </div>
      </div>

      {/* ───── Results ───── */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">

          {/* Why This Regime */}
          <WhyThisRegime analysis={analysis} />

          {/* Step-by-Step Waterfall */}
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TrendingDown size={18} className="text-cyan-400" /> Step-by-Step Calculation
              </h3>
              <button onClick={() => setShowSteps(!showSteps)} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm">
                {showSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />} {showSteps ? "Collapse" : "Expand"}
              </button>
            </div>
            {showSteps && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <WaterfallChart steps={(rc!.old_regime as TaxRegimeResult).steps || []} title="Old Regime Breakdown" />
                <WaterfallChart steps={(rc!.new_regime as TaxRegimeResult).steps || []} title="New Regime Breakdown" />
              </div>
            )}
          </div>

          {/* Regime Comparison Cards */}
          <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Regime Comparison</h3>
            <div className="grid grid-cols-2 gap-6">
              {(["old_regime", "new_regime"] as const).map((regime) => {
                const data = rc![regime];
                const isRec = rc!.recommended_regime === (regime === "old_regime" ? "old" : "new");
                return (
                  <div key={regime} className={`p-5 rounded-xl border ${isRec ? "border-emerald-500/50 bg-emerald-500/5" : "border-slate-700/50 bg-slate-900/30"}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white capitalize">{regime.replace("_", " ")}</h4>
                      {isRec && <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1"><Check size={12} /> Best for You</span>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Taxable Income</span><span className="text-white font-medium">{formatCurrency(data.taxable_income)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Tax on Income</span><span className="text-white">{formatCurrency(data.tax_payable)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Cess (4%)</span><span className="text-white">{formatCurrency(data.cess)}</span></div>
                      <div className="flex justify-between border-t border-slate-700/50 pt-2"><span className="text-slate-400 font-medium">Total Tax</span><span className="text-white font-bold text-lg">{formatCurrency(data.total_tax)}</span></div>
                    </div>
                    <div className="mt-2">
                      <RefLink r={regime === "old_regime" ? TAX_REFERENCES.slabs_old : TAX_REFERENCES.slabs_new} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
              <Check size={20} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">You save {formatCurrency(rc!.savings)} with the {rc!.recommended_regime === "old" ? "Old" : "New"} Regime</span>
            </div>
          </div>

          {/* Missed Deductions */}
          {analysis.missed_deductions?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-400" /> Missed Deductions & Optimisation Tips
              </h3>
              <div className="space-y-3">
                {analysis.missed_deductions.map((d, i) => {
                  const sevColors: Record<string, string> = { high: "border-red-500/30 bg-red-500/5", medium: "border-amber-500/30 bg-amber-500/5", low: "border-slate-700/30 bg-slate-900/40" };
                  const sevBadge: Record<string, string> = { high: "bg-red-500/20 text-red-400", medium: "bg-amber-500/20 text-amber-400", low: "bg-slate-700/30 text-slate-400" };
                  const sev = d.severity || "medium";
                  const sectionRef = getRefForSection(d.section);
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${sevColors[sev]} flex items-start gap-4`}>
                      <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0"><AlertTriangle size={16} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${sevBadge[sev]}`}>{sev}</span>
                          <span className="text-xs text-slate-500">Section {d.section}</span>
                        </div>
                        <p className="text-sm text-white">{d.description}</p>
                        {d.potential_saving > 0 && <p className="text-xs text-emerald-400 mt-1">Potential tax saving: {formatCurrency(d.potential_saving)}</p>}
                        <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1"><ArrowRight size={12} /> {d.investment_suggestion}</p>
                        {sectionRef && <div className="mt-1"><RefLink r={sectionRef} /></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tax-Saving Instruments */}
          {analysis.tax_saving_investments?.length > 0 && (
            <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/50">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" /> Tax-Saving Instruments — Ranked by Liquidity & Risk
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      {["Instrument", "Section", "Max Limit", "Lock-in", "Liquidity", "Risk", "Returns"].map(h => (
                        <th key={h} className="text-left py-3 px-3 text-xs text-slate-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.tax_saving_investments.map((inv, i) => (
                      <tr key={i} className={`border-b border-slate-800/50 ${inv.recommended ? "bg-emerald-500/5" : "hover:bg-slate-800/30"}`}>
                        <td className="py-3 px-3 text-white font-medium flex items-center gap-2">
                          {inv.instrument}
                          {inv.recommended && <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">TOP PICK</span>}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{inv.section}</td>
                        <td className="py-3 px-3 text-slate-300">{formatCurrency(inv.max_limit)}</td>
                        <td className="py-3 px-3 text-slate-300">{inv.lock_in}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            inv.liquidity === "high" ? "bg-emerald-500/20 text-emerald-400" :
                            inv.liquidity === "medium" ? "bg-amber-500/20 text-amber-400" :
                            inv.liquidity === "low" ? "bg-orange-500/20 text-orange-400" :
                            "bg-red-500/20 text-red-400"
                          }`}>{LIQUIDITY_LABELS[inv.liquidity] || inv.liquidity}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-xs font-medium" style={{ color: RISK_COLORS[inv.risk_level] || "#64748b" }}>{inv.risk_level}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-xs">{inv.expected_returns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <RankingMethodology />
            </div>
          )}

          {/* Form 16 Preview */}
          <Form16Preview
            analysis={analysis}
            income={income as unknown as Record<string, unknown>}
            deductions={deductions as unknown as Record<string, unknown>}
            hraExemption={hra_calc.exemption}
          />

          {/* AI Summary */}
          {analysis.ai_summary && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className="text-amber-400" />
                <span className="text-sm font-medium text-amber-400">AI Tax Summary</span>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{analysis.ai_summary}</p>
            </div>
          )}

          {/* Verify Footer */}
          <VerifyFooter />
        </div>
      )}
    </div>
  );
}
