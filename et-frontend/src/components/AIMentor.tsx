"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Bot, User, Lightbulb } from "lucide-react";
import { isLocalEngineMode } from "@/lib/config";
import api from "@/lib/api";
import { useTaxWizardStore } from "@/store/taxWizardStore";
import { formatCurrency } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  icon: string;
}

const BASE_QUICK_ACTIONS: QuickAction[] = [
  { label: "What is Section 80C?", icon: "💰" },
  { label: "Old vs New tax regime — which is better?", icon: "📊" },
  { label: "How does XIRR work?", icon: "📈" },
  { label: "What's the ideal emergency fund?", icon: "🛡️" },
  { label: "How to start investing with ₹5000/month?", icon: "🚀" },
  { label: "Explain mutual fund expense ratios", icon: "🔍" },
];

const LOCAL_RESPONSES: Record<string, string> = {
  "80c": `**Section 80C** lets you deduct up to **₹1,50,000** from your taxable income by investing in:

• **ELSS** (Equity Linked Savings Scheme) — 3-year lock-in, market-linked returns (~12-15%)
• **PPF** (Public Provident Fund) — 15-year lock-in, guaranteed ~7.1%
• **EPF** (Employee Provident Fund) — auto-deducted from salary
• **Life Insurance premiums**, NSC, Tax Saver FDs, children's tuition fees

**Pro tip:** ELSS has the shortest lock-in and best potential returns among 80C options.

_This is educational guidance, not professional financial advice._`,

  "old vs new": `**Quick comparison for FY 2025-26:**

**New Regime** — Lower tax rates, but almost NO deductions allowed.
• Slabs: 0-4L (0%), 4-8L (5%), 8-12L (10%), 12-16L (15%), 16-20L (20%), 20-24L (25%), 24L+ (30%)
• Standard deduction: ₹75,000 only
• Rebate up to ₹12L taxable income

**Old Regime** — Higher rates but you can claim 80C, 80D, HRA, NPS, home loan, etc.
• If your total deductions exceed ~₹3.75L, Old Regime is often better.

**Rule of thumb:** If your salary is under ₹12L, New Regime is usually better (zero tax with rebate). Above ₹15L with good deductions → Old Regime wins.

Use our **Tax Wizard** to calculate your exact numbers!

_This is educational guidance, not professional financial advice._`,

  "xirr": `**XIRR (Extended Internal Rate of Return)** is the most accurate way to measure your investment returns when you've invested at different times.

**Simple example:**
• You invested ₹10,000 in Jan 2024 and ₹10,000 in Jun 2024
• Current value is ₹22,500
• Simple return = 12.5%, but XIRR considers that the first ₹10K was invested 6 months longer → XIRR might be ~14%

**Why it matters:** If you do SIPs (monthly investments), simple returns are misleading. XIRR gives you the true annualized return.

Check your portfolio's real XIRR in our **MF Portfolio X-Ray** tool!

_This is educational guidance, not professional financial advice._`,

  "emergency": `**The ideal emergency fund = 6 months of monthly expenses.**

If you spend ₹40,000/month → keep ₹2,40,000 as emergency fund.

**Where to keep it:**
1. **Savings account** — instant access, ~3-4% interest
2. **Liquid mutual fund** — slightly better returns (~5-6%), T+1 redemption
3. **FD with sweep-in** — higher interest, auto-breaks when needed

**Don'ts:**
• Don't invest emergency fund in stocks/equity
• Don't lock it in PPF or FD without sweep-in
• Don't count investments you plan to use for goals

**Build it gradually** — even ₹5,000/month into a liquid fund adds up to ₹60,000 in a year.

_This is educational guidance, not professional financial advice._`,

  "start investing": `**Starting with ₹5,000/month? Here's a solid plan:**

1. **₹2,000 → Nifty 50 Index Fund** (Large cap, stable, ~12% long-term)
2. **₹1,500 → Flexi Cap Fund** (Diversified across market caps)
3. **₹1,500 → PPF** (Tax-free guaranteed returns for long-term)

**Steps:**
1. Open a demat account (Zerodha, Groww, or any broker)
2. Complete KYC (PAN + Aadhaar, takes 10 min)
3. Set up **SIP** (Systematic Investment Plan) — auto-debits monthly
4. **Don't check daily** — review quarterly at most

**Key principle:** ₹5,000/month at 12% for 25 years = **₹~95 Lakh** (you invest only ₹15L!)

The magic is **compounding** — start early, stay consistent.

_This is educational guidance, not professional financial advice._`,

  "expense ratio": `**Expense Ratio** is the annual fee a mutual fund charges you for managing your money.

**Example:** If a fund's expense ratio is 1.5% and you have ₹1,00,000 invested → you pay ₹1,500/year in fees (deducted daily from NAV).

**Regular vs Direct plans:**
• **Regular plan:** Includes distributor commission → ER ~1.5-2%
• **Direct plan:** No commission → ER ~0.5-1%
• **Difference:** 0.5-1% sounds small, but on ₹10L over 10 years → **₹50K-1L in extra fees!**

**What to do:** Switch new SIPs to **direct plans** via AMC website or Groww/Kuvera. For existing investments, check STCG impact before switching.

Use our **MF X-Ray** to see your exact expense ratio drag!

_This is educational guidance, not professional financial advice._`,
};

function getTaxContextResponse(message: string, analysis: ReturnType<typeof useTaxWizardStore.getState>["analysis"]): string | null {
  if (!analysis) return null;
  const rc = analysis.regime_comparison;
  const lower = message.toLowerCase();

  if ((lower.includes("why") && (lower.includes("regime") || lower.includes("old") || lower.includes("new") || lower.includes("better"))) || lower.includes("which regime")) {
    const rec = rc.recommended_regime;
    const oldSteps = rc.old_regime.steps;
    const totalDed = oldSteps.filter(s => s.type === "deduction" && s.amount < 0).reduce((sum, s) => sum + Math.abs(s.amount), 0);

    return `Based on **your specific numbers**, the **${rec === "old" ? "Old" : "New"} Regime** is better for you.

**Here's why:**
• Your total deductions under Old Regime: **${formatCurrency(totalDed)}**
• Old Regime tax: **${formatCurrency(rc.old_regime.total_tax)}** (taxable: ${formatCurrency(rc.old_regime.taxable_income)})
• New Regime tax: **${formatCurrency(rc.new_regime.total_tax)}** (taxable: ${formatCurrency(rc.new_regime.taxable_income)})
• **You save: ${formatCurrency(rc.savings)}** with ${rec === "old" ? "Old" : "New"} Regime

${rec === "old" ? "Your deductions (HRA, 80C, NPS, etc.) are substantial enough to offset the higher Old Regime rates." : "Your deductions aren't large enough to beat the lower New Regime rates."}

_This is personalized guidance based on your data, not professional financial advice._`;
  }

  if (lower.includes("missed") && (lower.includes("deduction") || lower.includes("saving"))) {
    const missed = analysis.missed_deductions || [];
    if (missed.length === 0) {
      return "Great news! Based on your data, you're utilizing most deductions well. There are no major missed deductions.\n\n_This is personalized guidance based on your data, not professional financial advice._";
    }
    const highMedium = missed.filter(m => m.severity !== "low");
    let response = `Based on your analysis, you have **${missed.length} missed deduction(s)**, of which **${highMedium.length} are high/medium priority**:\n\n`;
    for (const m of missed) {
      if (m.severity === "low") continue;
      response += `• **${m.section}**: ${m.description}`;
      if (m.potential_saving > 0) response += ` → Potential tax saving: **${formatCurrency(m.potential_saving)}**`;
      response += `\n`;
    }
    response += `\n**Total potential additional savings:** ${formatCurrency(highMedium.reduce((s, m) => s + m.potential_saving, 0))}`;
    response += "\n\n_This is personalized guidance based on your data, not professional financial advice._";
    return response;
  }

  if (lower.includes("save") && (lower.includes("more") || lower.includes("tax") || lower.includes("next year"))) {
    const missed = analysis.missed_deductions || [];
    const totalPotential = missed.reduce((s, m) => s + m.potential_saving, 0);
    let response = `Based on your current tax analysis, here are actionable steps to **save more tax next year**:\n\n`;
    response += `**Current tax:** ${formatCurrency(Math.min(rc.old_regime.total_tax, rc.new_regime.total_tax))} (${rc.recommended_regime === "old" ? "Old" : "New"} Regime)\n\n`;

    if (totalPotential > 0) {
      response += `**Potential additional savings: ${formatCurrency(totalPotential)}** by:\n`;
      for (const m of missed.filter(m => m.potential_saving > 0).slice(0, 4)) {
        response += `• ${m.investment_suggestion} (saves ${formatCurrency(m.potential_saving)})\n`;
      }
    }

    response += `\n**Top 3 actions for next year:**\n`;
    response += `1. Max out 80C (₹1.5L) with ELSS + PPF + EPF\n`;
    response += `2. Get ₹5L family health cover for 80D benefit\n`;
    response += `3. Start NPS for extra ₹50K deduction beyond 80C\n`;
    response += "\n_This is personalized guidance based on your data, not professional financial advice._";
    return response;
  }

  return null;
}

function getLocalResponse(message: string, analysis: ReturnType<typeof useTaxWizardStore.getState>["analysis"]): string {
  const taxResponse = getTaxContextResponse(message, analysis);
  if (taxResponse) return taxResponse;

  const lower = message.toLowerCase();
  if (lower.includes("80c") || lower.includes("section 80")) return LOCAL_RESPONSES["80c"];
  if (lower.includes("old") && lower.includes("new") && (lower.includes("regime") || lower.includes("tax"))) return LOCAL_RESPONSES["old vs new"];
  if (lower.includes("xirr") || lower.includes("internal rate")) return LOCAL_RESPONSES["xirr"];
  if (lower.includes("emergency") || lower.includes("rainy day")) return LOCAL_RESPONSES["emergency"];
  if (lower.includes("start invest") || lower.includes("begin invest") || lower.includes("5000") || lower.includes("beginner")) return LOCAL_RESPONSES["start investing"];
  if (lower.includes("expense ratio") || (lower.includes("regular") && lower.includes("direct"))) return LOCAL_RESPONSES["expense ratio"];

  if (lower.includes("hra") || lower.includes("house rent")) {
    return `**HRA Exemption** = Minimum of:\n1. Actual HRA received\n2. 50% of Basic (metro) or 40% (non-metro)\n3. Rent paid − 10% of Basic\n\nYou need rent receipts as proof. Use our **Tax Wizard** for auto-calculation!\n\n_This is educational guidance, not professional financial advice._`;
  }
  if (lower.includes("sip")) {
    return `**SIP (Systematic Investment Plan)** is investing a fixed amount monthly into a mutual fund.\n\n**Benefits:** Rupee cost averaging (buy more units when market is low), discipline, no need to time the market.\n\n**Start with:** ₹500-5000/month in a Nifty 50 Index Fund. Increase by 10% each year.\n\n_This is educational guidance, not professional financial advice._`;
  }
  if (lower.includes("nps") || lower.includes("national pension")) {
    return `**NPS (National Pension System):**\n• Extra ₹50,000 deduction under **80CCD(1B)** — over and above 80C\n• Lock-in till age 60 (partial withdrawal allowed)\n• Returns: 9-12% (market-linked, choose equity:debt ratio)\n• At 60: 60% lumpsum (tax-free), 40% annuity\n\n_This is educational guidance, not professional financial advice._`;
  }
  if (lower.includes("ppf")) {
    return `**PPF (Public Provident Fund):**\n• Interest: ~7.1% (tax-free, govt guaranteed)\n• Lock-in: 15 years (partial withdrawal from year 7)\n• Max: ₹1.5L/year, counts under 80C\n• **EEE status** — exempt at investment, interest, and maturity\n• Best for: risk-averse, long-term tax-free corpus\n\n_This is educational guidance, not professional financial advice._`;
  }

  if (analysis) {
    const rc = analysis.regime_comparison;
    return `I can help you understand your tax analysis! Here's a quick summary:\n\n• **Recommended regime:** ${rc.recommended_regime === "old" ? "Old" : "New"}\n• **Tax savings:** ${formatCurrency(rc.savings)}\n• **Missed deductions:** ${analysis.missed_deductions?.length || 0}\n\nTry asking:\n• "Why is ${rc.recommended_regime === "old" ? "Old" : "New"} regime better for me?"\n• "Explain my missed deductions"\n• "How can I save more tax next year?"\n\n_This is educational guidance, not professional financial advice._`;
  }

  return `Great question! Here's what I can help you with:\n\n• **Tax planning** — Old vs New regime, deductions, HRA, Form 16\n• **Mutual funds** — XIRR, overlap, expense ratios, rebalancing\n• **Investing basics** — SIP, risk profiles, asset allocation\n• **Insurance** — Term life, health cover sizing\n• **FIRE planning** — Financial independence roadmap\n\nTry asking something specific like "What is Section 80C?" or "How does XIRR work?"\n\n_This is educational guidance, not professional financial advice._`;
}

interface AIMentorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIMentor({ isOpen, onClose }: AIMentorProps) {
  const analysis = useTaxWizardStore((s) => s.analysis);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your **ET Finance Mentor** 🎯\n\nI can help you understand taxes, mutual funds, investments, and more — in simple terms.\n\nAsk me anything, or try one of the quick questions below!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);

  const quickActions: QuickAction[] = (() => {
    if (!analysis) return BASE_QUICK_ACTIONS;
    const rc = analysis.regime_comparison;
    const taxActions: QuickAction[] = [
      { label: `Why is ${rc.recommended_regime === "old" ? "Old" : "New"} regime better for me?`, icon: "🎯" },
      { label: "Explain my missed deductions", icon: "⚠️" },
      { label: "How can I save more tax next year?", icon: "💡" },
    ];
    return [...taxActions, ...BASE_QUICK_ACTIONS.slice(0, 3)];
  })();

  const buildContext = useCallback(() => {
    if (!analysis) return {};
    const rc = analysis.regime_comparison;
    return {
      tax_analysis: {
        gross_salary: formatCurrency(rc.old_regime.steps.find(s => s.label === "Gross Salary")?.amount || 0),
        recommended_regime: rc.recommended_regime,
        old_tax: formatCurrency(rc.old_regime.total_tax),
        new_tax: formatCurrency(rc.new_regime.total_tax),
        savings: formatCurrency(rc.savings),
        missed_deductions: analysis.missed_deductions?.length || 0,
        old_taxable_income: formatCurrency(rc.old_regime.taxable_income),
        new_taxable_income: formatCurrency(rc.new_regime.taxable_income),
      },
    };
  }, [analysis]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      let response: string;
      if (isLocalEngineMode()) {
        await new Promise(r => setTimeout(r, 400));
        response = getLocalResponse(text, analysis);
      } else {
        const res = await api.post<{ response: string }>("/mentor/chat", {
          message: text,
          context: buildContext(),
        });
        response = res.data.response;
      }
      setMessages(prev => [...prev, { role: "assistant", content: response, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again!",
        timestamp: new Date(),
      }]);
    }
    setIsTyping(false);
  }, [analysis, buildContext]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 lg:bg-transparent" onClick={onClose} />

      <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-slate-900 border-l border-slate-700/50 z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">ET Finance Mentor</h3>
              <p className="text-[10px] text-emerald-400">
                {analysis ? "Personalized — using your tax data" : "AI-powered financial guidance"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tax context banner */}
        {analysis && (
          <div className="px-4 py-2 bg-emerald-500/5 border-b border-emerald-500/10">
            <div className="flex items-center gap-2">
              <Sparkles size={12} className="text-emerald-400" />
              <span className="text-[10px] text-emerald-400">
                Using your tax analysis: {analysis.regime_comparison.recommended_regime === "old" ? "Old" : "New"} Regime recommended, saving {formatCurrency(analysis.regime_comparison.savings)}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400"
                  : "bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-400"
              }`}>
                {msg.role === "assistant" ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                msg.role === "assistant"
                  ? "bg-slate-800/60 text-slate-300 border border-slate-700/30"
                  : "bg-emerald-500/20 text-white border border-emerald-500/20"
              }`}>
                {msg.content.split("\n").map((line, j) => {
                  const boldRegex = /\*\*(.*?)\*\*/g;
                  const parts = line.split(boldRegex);
                  return (
                    <p key={j} className={j > 0 ? "mt-1.5" : ""}>
                      {parts.map((part, k) =>
                        k % 2 === 1 ? <strong key={k} className="text-white font-semibold">{part}</strong> : part
                      )}
                    </p>
                  );
                })}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot size={16} />
              </div>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/30">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb size={14} className="text-amber-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                {analysis ? "Ask About Your Tax Analysis" : "Quick Questions"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {quickActions.map((qa, i) => (
                <button key={i} onClick={() => sendMessage(qa.label)}
                  className="text-left px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30 text-xs text-slate-400 hover:text-white hover:border-emerald-500/30 transition-all">
                  <span className="mr-1">{qa.icon}</span> {qa.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700/50">
          <div className="flex gap-2">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={analysis ? "Ask about your taxes, deductions, savings..." : "Ask about taxes, mutual funds, investing..."}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              disabled={isTyping} />
            <button type="submit" disabled={!input.trim() || isTyping}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={18} />
            </button>
          </div>
          <p className="text-[9px] text-slate-600 text-center mt-2">Educational guidance only. Consult a SEBI-registered advisor for investment decisions.</p>
        </form>
      </div>
    </>
  );
}
