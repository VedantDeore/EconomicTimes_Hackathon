"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SendHorizontal,
  Sparkles,
  Zap,
  History,
  Trash2,
  Bot,
  AlertTriangle,
  ChevronRight,
  X,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
} from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency } from "@/lib/utils";
import { saveChatMessage, getChatHistory } from "@/lib/supabaseHistory";
import { loadFullMentorContext, type MentorContext } from "@/lib/mentorDataLoader";
import AlgorithmExplanation from "@/components/shared/AlgorithmExplanation";
import { ProfileSnapshotCard } from "@/components/mentor";
import { ProfileSnapshotInlineCard } from "@/components/mentor";
import { InvestmentBreakdownCard } from "@/components/mentor";
import { GoalProgressCard } from "@/components/mentor";
import { HealthScoreCard } from "@/components/mentor";
import { TaxComparisonCard } from "@/components/mentor";
import { FireProgressCard } from "@/components/mentor";
import { NetWorthCard } from "@/components/mentor";
import { SpendingBreakdownCard } from "@/components/mentor";
import { ActionLinkBar } from "@/components/mentor";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ActionLink {
  label: string;
  href: string;
}

interface MentorChatResponse {
  response: string;
  tool_used: string | null;
  tool_result: Record<string, unknown> | null;
  display_type?: string | null;
  action_links?: ActionLink[];
  suggestions: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  tool_used?: string | null;
  tool_result?: Record<string, unknown> | null;
  display_type?: string | null;
  action_links?: ActionLink[];
  suggestions?: string[];
}

interface ProactiveInsight {
  type: string;
  message: string;
  action: string;
  priority: string;
}

/* ------------------------------------------------------------------ */
/*  Local-engine fallback (used ONLY when backend API is unreachable)  */
/* ------------------------------------------------------------------ */

function estimateSipCorpus(monthly: number, months: number, annualReturn: number): number {
  const r = annualReturn / 12;
  if (r === 0) return monthly * months;
  return monthly * ((Math.pow(1 + r, months) - 1) / r);
}

function buildProfileSnapshotFromCtx(ctx: MentorContext): MentorChatResponse {
  const p = ctx.profile;
  const income = ctx.income;
  return {
    response: `Here's your complete financial profile, **${p?.full_name || "User"}**. I have access to all your data — income, investments, insurance, debts, goals, and more. Ask me anything specific!`,
    tool_used: "Profile Snapshot",
    tool_result: {
      tool: "Profile Snapshot",
      full_name: p?.full_name || "User",
      age: p?.age,
      city: p?.city,
      employment_type: p?.employment_type || "salaried",
      risk_profile: p?.risk_profile || "moderate",
      tax_regime: p?.tax_regime || "new",
      marital_status: p?.marital_status || "single",
      dependents: p?.dependents || 0,
      gross_salary: income?.gross_salary || 0,
      monthly_expenses: income?.monthly_expenses || 0,
      net_worth: ctx.computed.net_worth,
      total_investments: ctx.computed.total_investments,
      num_investments: ctx.investments.length,
      total_debt: ctx.computed.total_debt,
      num_goals: ctx.goals.length,
      life_insurance_cover: ctx.insurance.filter((i) => i.type === "life").reduce((s, i) => s + i.cover_amount, 0),
      health_insurance_cover: ctx.insurance.filter((i) => i.type === "health").reduce((s, i) => s + i.cover_amount, 0),
      health_score: ctx.health_score ? Math.round(ctx.health_score.overall_score) : null,
      fire_number: ctx.fire_plan?.fire_number || null,
      monthly_surplus: ctx.computed.monthly_surplus,
    },
    display_type: "profile_snapshot",
    action_links: [
      { label: "Edit Profile", href: "/money-profile" },
      { label: "Dashboard", href: "/dashboard" },
    ],
    suggestions: ["Show my portfolio", "Check my insurance gap", "Analyze my spending", "What's my net worth?"],
  };
}

function getLocalMentorResponse(
  message: string,
  ctx: MentorContext | null,
): MentorChatResponse {
  const lower = message.toLowerCase();
  const gross = ctx?.income?.gross_salary ?? 0;

  const isAboutMe =
    lower.includes("about me") ||
    lower.includes("who am i") ||
    lower.includes("my profile") ||
    lower.includes("what do you know") ||
    lower.includes("tell me about") ||
    lower.includes("my data") ||
    lower.includes("my details") ||
    lower.includes("my information") ||
    lower.includes("know about me") ||
    lower.includes("my snapshot") ||
    lower.includes("my summary");

  if (isAboutMe && ctx) {
    return buildProfileSnapshotFromCtx(ctx);
  }

  if (lower.includes("portfolio") || lower.includes("investment")) {
    const investments = ctx?.investments ?? [];
    if (investments.length > 0) {
      const breakdown: Record<string, number> = {};
      let total = 0;
      let totalSip = 0;
      for (const inv of investments) {
        const t = (inv.type || "other").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        breakdown[t] = (breakdown[t] || 0) + inv.current_value;
        total += inv.current_value;
        totalSip += inv.monthly_sip;
      }
      return {
        response: `**Your Portfolio Summary**\n\nYou have **${investments.length} investments** worth **${formatCurrency(total)}** with a total monthly SIP of **${formatCurrency(totalSip)}**.\n\nConsider diversifying across asset classes for optimal risk-adjusted returns.`,
        tool_used: "Portfolio Summary",
        tool_result: { tool: "Portfolio Summary", total_value: total, num_investments: investments.length, total_monthly_sip: totalSip, breakdown },
        display_type: "investment_breakdown",
        action_links: [{ label: "MF X-Ray", href: "/mf-xray" }],
        suggestions: ["Show my goal progress", "What's my net worth?", "Suggest rebalancing"],
      };
    }
  }

  if (lower.includes("goal")) {
    const goals = ctx?.goals ?? [];
    if (goals.length > 0) {
      const goalList = goals.map((g) => ({
        name: g.name,
        category: g.category,
        target: g.target_amount,
        current: g.current_savings,
        progress_pct: g.target_amount > 0 ? Math.round((g.current_savings / g.target_amount) * 100) : 0,
        target_date: g.target_date,
        monthly_sip: g.monthly_sip,
      }));
      return {
        response: `**Goal Progress**\n\nYou have **${goals.length} financial goals**. Track your progress and adjust SIPs as needed.`,
        tool_used: "Goal Tracker",
        tool_result: { tool: "Goal Tracker", total_goals: goals.length, goals: goalList },
        display_type: "goal_progress",
        action_links: [{ label: "FIRE Planner", href: "/fire-planner" }],
        suggestions: ["Calculate SIP for goals", "Review my FIRE plan"],
      };
    }
  }

  if (lower.includes("net worth") || lower.includes("networth")) {
    const totalAssets = ctx?.computed?.total_investments ?? 0;
    const totalLiabilities = ctx?.computed?.total_debt ?? 0;
    const nw = totalAssets - totalLiabilities;
    return {
      response: `**Net Worth Summary**\n\nYour net worth is **${formatCurrency(nw)}** (Assets: ${formatCurrency(totalAssets)} - Liabilities: ${formatCurrency(totalLiabilities)}).`,
      tool_used: "Net Worth Summary",
      tool_result: { tool: "Net Worth Summary", net_worth: nw, total_assets: totalAssets, total_liabilities: totalLiabilities, assets_breakdown: {}, liabilities_breakdown: {} },
      display_type: "net_worth",
      action_links: [{ label: "Dashboard", href: "/dashboard" }],
      suggestions: ["Show my portfolio", "Analyze my spending"],
    };
  }

  if (lower.includes("spend") || lower.includes("expense")) {
    const income = ctx?.income;
    if (income && income.gross_salary > 0) {
      const monthlyIncome = income.gross_salary / 12;
      const surplus = monthlyIncome - income.monthly_expenses;
      const savingsRate = Math.round((surplus / monthlyIncome) * 100);
      return {
        response: `**Spending Analysis**\n\nMonthly income: **${formatCurrency(monthlyIncome)}** | Expenses: **${formatCurrency(income.monthly_expenses)}** | Surplus: **${formatCurrency(surplus)}**\n\nYour savings rate is **${savingsRate}%**. ${savingsRate >= 30 ? "Great job!" : "Target at least 30% savings."}`,
        tool_used: "Spending Analysis",
        tool_result: { tool: "Spending Analysis", monthly_income: monthlyIncome, monthly_expenses: income.monthly_expenses, monthly_surplus: surplus, savings_rate_pct: savingsRate, ideal_savings_rate: 30, savings_gap: Math.max(0, monthlyIncome * 0.3 - surplus), expense_breakdown: income.expense_breakdown },
        display_type: "spending_breakdown",
        action_links: [{ label: "Money Health", href: "/money-health" }],
        suggestions: ["How to save more?", "Show my net worth"],
      };
    }
  }

  if (lower.includes("sip") || lower.includes("systematic")) {
    const monthly = gross > 0 ? Math.round(Math.min(gross / 12 / 5, 25000)) : 10000;
    const corpus = estimateSipCorpus(monthly, 180, 0.01);
    return {
      response: `**SIP Projection**\n\nA starting SIP of **${formatCurrency(monthly)}/month** over **15 years** at ~12% return could grow to ~**${formatCurrency(Math.round(corpus))}**.\n\nIncrease by 10% annually to beat inflation.`,
      tool_used: "SIP Calculator",
      tool_result: { tool: "SIP Calculator", monthly_sip: monthly, horizon_years: 15, illustrative_corpus: Math.round(corpus) },
      display_type: "sip_projection",
      action_links: [{ label: "FIRE Planner", href: "/fire-planner" }],
      suggestions: ["Compare tax regimes", "Review my FIRE plan", "Asset allocation advice"],
    };
  }

  if (lower.includes("tax") || lower.includes("regime")) {
    if (ctx?.tax_analysis) {
      const ta = ctx.tax_analysis;
      return {
        response: `**Tax Regime Comparison**\n\n- Recommended: **${ta.recommended_regime === "old" ? "Old" : "New"} Regime**\n- Old: ${formatCurrency(ta.old_regime_tax)} | New: ${formatCurrency(ta.new_regime_tax)}\n- Savings: **${formatCurrency(ta.savings_potential)}**`,
        tool_used: "Tax Regime Comparator",
        tool_result: { tool: "Tax Regime Comparator", old_regime_tax: ta.old_regime_tax, new_regime_tax: ta.new_regime_tax, savings: ta.savings_potential, recommended_regime: ta.recommended_regime },
        display_type: "tax_comparison",
        action_links: [{ label: "Tax Wizard", href: "/tax-wizard" }],
        suggestions: ["Check my insurance gap", "Calculate my SIP"],
      };
    }
    return {
      response: "Run the **Tax Wizard** with your salary details to get a personalized regime comparison.",
      tool_used: null, tool_result: null,
      suggestions: ["Calculate my SIP", "Asset allocation advice"],
    };
  }

  if (lower.includes("insurance") || lower.includes("cover")) {
    const lifeCoverGap = ctx?.computed?.life_cover_gap ?? 0;
    return {
      response: `**Insurance Analysis**\n\nLife cover gap: **${formatCurrency(lifeCoverGap)}**. Rule of thumb: 10x annual income.\nHealth: Aim for Rs 5L+ family floater in metro cities.`,
      tool_used: "Insurance Calculator",
      tool_result: { tool: "Insurance Calculator", life_cover_gap: lifeCoverGap },
      display_type: "insurance_gap",
      action_links: [{ label: "Money Health", href: "/money-health" }],
      suggestions: ["Review my FIRE plan", "Calculate my SIP"],
    };
  }

  if (lower.includes("health") || lower.includes("score")) {
    if (ctx?.health_score) {
      const hs = ctx.health_score;
      return {
        response: `**Financial Health Score: ${Math.round(hs.overall_score)}/100**\n\nYour financial health has been assessed across 6 dimensions. Focus on the weakest areas for maximum improvement.`,
        tool_used: "Health Score",
        tool_result: { tool: "Health Score", overall_score: hs.overall_score, dimensions: hs.recommendations },
        display_type: "health_score",
        action_links: [{ label: "Money Health", href: "/money-health" }],
        suggestions: ["How to improve my score?", "Check my insurance gap"],
      };
    }
  }

  if (lower.includes("fire") || lower.includes("retire")) {
    if (ctx?.fire_plan) {
      const fp = ctx.fire_plan;
      return {
        response: `**FIRE Plan Summary**\n\nYour FIRE number is **${formatCurrency(fp.fire_number)}**. You need **${fp.years_to_fire} years** to reach financial independence with a monthly SIP of **${formatCurrency(fp.monthly_sip_required)}**.`,
        tool_used: "FIRE Plan",
        tool_result: { tool: "FIRE Plan", fire_number: fp.fire_number, years_to_fire: fp.years_to_fire, monthly_sip_needed: fp.monthly_sip_required, success_probability: fp.success_probability },
        display_type: "fire_plan",
        action_links: [{ label: "FIRE Planner", href: "/fire-planner" }],
        suggestions: ["Show my portfolio", "Analyze my spending"],
      };
    }
  }

  // Default: show profile snapshot if context available, otherwise generic
  if (ctx) {
    return buildProfileSnapshotFromCtx(ctx);
  }

  return {
    response: "I can help with **SIPs, tax regimes, insurance, FIRE planning, portfolio review, goal tracking, net worth, spending analysis**, and more. What would you like to explore?",
    tool_used: null, tool_result: null,
    suggestions: getSmartSuggestions(ctx),
  };
}

function getSmartSuggestions(ctx: MentorContext | null): string[] {
  if (!ctx) return ["Calculate my SIP", "Compare tax regimes", "Check insurance gap"];
  const suggestions: string[] = [];
  suggestions.push("What do you know about me?");
  if ((ctx.investments?.length ?? 0) > 0) suggestions.push("Show my portfolio");
  else suggestions.push("How should I start investing?");
  if ((ctx.goals?.length ?? 0) > 0) suggestions.push("How are my goals progressing?");
  else suggestions.push("Help me set financial goals");
  if ((ctx.computed?.life_cover_gap ?? 0) > 0) suggestions.push("Check my insurance gap");
  suggestions.push("What's my net worth?");
  suggestions.push("Analyze my spending");
  return suggestions.slice(0, 6);
}

/* ------------------------------------------------------------------ */
/*  Markdown renderer                                                  */
/* ------------------------------------------------------------------ */

function renderMarkdown(text: string) {
  return text.split("\n").map((line, j) => {
    if (line.startsWith("• ") || line.startsWith("- ")) {
      const inner = line.slice(2);
      const parts = inner.split(/\*\*(.*?)\*\*/g);
      return (
        <li key={j} className="ml-3 list-disc text-slate-300">
          {parts.map((part, k) =>
            k % 2 === 1 ? (
              <strong key={k} className="font-semibold text-white">{part}</strong>
            ) : (
              <span key={k}>{part}</span>
            )
          )}
        </li>
      );
    }
    const parts = line.split(/\*\*(.*?)\*\*/g);
    return (
      <p key={j} className={j > 0 ? "mt-1.5" : ""}>
        {parts.map((part, k) =>
          k % 2 === 1 ? (
            <strong key={k} className="font-semibold text-white">{part}</strong>
          ) : (
            <span key={k}>{part}</span>
          )
        )}
      </p>
    );
  });
}

/* ------------------------------------------------------------------ */
/*  Rich card dispatcher                                               */
/* ------------------------------------------------------------------ */

function RichCard({ displayType, data }: { displayType: string; data: Record<string, unknown> }) {
  switch (displayType) {
    case "profile_snapshot":
      return <ProfileSnapshotInlineCard data={data} />;
    case "investment_breakdown":
      return <InvestmentBreakdownCard data={data} />;
    case "goal_progress":
      return <GoalProgressCard data={data} />;
    case "tax_comparison":
      return <TaxComparisonCard data={data} />;
    case "net_worth":
      return <NetWorthCard data={data} />;
    case "spending_breakdown":
      return <SpendingBreakdownCard data={data} />;
    case "health_score":
      return <HealthScoreCard data={data} />;
    case "fire_plan":
      return <FireProgressCard data={data} />;
    default:
      return <FallbackToolCard data={data} toolUsed={String(data.tool ?? displayType)} />;
  }
}

function FallbackToolCard({ data, toolUsed }: { data: Record<string, unknown>; toolUsed: string }) {
  const entries = Object.entries(data).filter(
    ([k, v]) => v !== undefined && v !== null && k !== "tool" && typeof v !== "object"
  );
  if (entries.length === 0) return null;
  return (
    <div className="mt-2 rounded-xl border border-cyan-500/20 bg-slate-950/60 p-3 text-xs">
      {toolUsed && (
        <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-cyan-400/90">
          {toolUsed}
        </div>
      )}
      <dl className="space-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex justify-between gap-3 border-b border-slate-700/40 pb-1.5 last:border-0 last:pb-0">
            <dt className="shrink-0 text-slate-500">{key.replace(/_/g, " ")}</dt>
            <dd className="text-right text-slate-200">
              {typeof val === "number" ? val.toLocaleString("en-IN") : String(val)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Copy button                                                        */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-colors"
      title="Copy"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Algorithm explanation sections                                     */
/* ------------------------------------------------------------------ */

const ALGO_SECTIONS = [
  {
    title: "Full-Context Agentic Pipeline",
    description:
      "DhanGuru loads your complete financial profile from Supabase (income, investments, insurance, debts, goals, health score, tax analysis, FIRE plan, MF portfolio) and injects it as context into every Groq Mixtral call, enabling deeply personalized responses.",
  },
  {
    title: "Tool-Calling Agent (10 Tools)",
    description:
      "Groq Mixtral classifies your question, selects from 10 tools (SIP Calculator, Future Value, Tax Regime Compare, Insurance Gap, Asset Allocation, Portfolio Summary, Goal Tracker, Net Worth, Spending Analysis, Profile Snapshot), extracts parameters, executes the computation, then formats results conversationally.",
  },
  {
    title: "Rich Visual Cards",
    description:
      "Each tool response includes a display_type hint that triggers specialized inline cards — profile snapshots, donut charts for portfolios, progress bars for goals, circular gauges for health scores, side-by-side comparisons for tax, and bar charts for spending.",
  },
];

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function MentorPage() {
  useAuth();

  const [mentorCtx, setMentorCtx] = useState<MentorContext | null>(null);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set());

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm **DhanGuru**, your AI financial mentor powered by Groq. I have full access to your financial profile — ask me about your portfolio, goals, net worth, taxes, spending, or try **\"What do you know about me?\"** to see your complete snapshot!",
      timestamp: new Date(),
      suggestions: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCtxLoading(true);
    void loadFullMentorContext().then((ctx) => {
      if (cancelled) return;
      setMentorCtx(ctx);
      setCtxLoading(false);
      if (ctx) {
        const smartSuggestions = getSmartSuggestions(ctx);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[0].role === "assistant") {
            updated[0] = { ...updated[0], suggestions: smartSuggestions };
          }
          return updated;
        });
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mentorCtx || ctxLoading) return;
    void (async () => {
      try {
        const res = await api.post<{ suggestions: ProactiveInsight[] }>("/mentor/suggestions", {
          message: "",
          context: {
            has_term_insurance: mentorCtx.insurance.some((i) => i.type === "life" && i.cover_amount > 0),
            emergency_months: mentorCtx.health_score
              ? Math.round(((mentorCtx.computed.total_investments * 0.1) / Math.max(mentorCtx.income?.monthly_expenses ?? 1, 1)) * 10) / 10
              : 0,
            sec_80c_used: 0,
          },
        });
        if (res.data?.suggestions) setInsights(res.data.suggestions);
      } catch {
        // optional
      }
    })();
  }, [mentorCtx, ctxLoading]);

  useEffect(() => {
    if (historyLoaded) return;
    setHistoryLoaded(true);
    void getChatHistory().then((rows) => {
      if (rows.length > 0) {
        const loaded: ChatMessage[] = rows.map((r) => ({
          role: r.role as "user" | "assistant",
          content: r.content,
          timestamp: new Date(r.created_at),
          tool_used: r.tool_used,
          tool_result: r.tool_result as Record<string, unknown> | undefined,
        }));
        setMessages((prev) => [...prev, ...loaded]);
      }
    });
  }, [historyLoaded]);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const userMsg: ChatMessage = { role: "user", content: trimmed, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);
      void saveChatMessage("user", trimmed);

      try {
        let payload: MentorChatResponse;

        // ALWAYS try the Groq-backed API first, fall back to local on error
        try {
          const res = await api.post<MentorChatResponse>("/mentor/chat", {
            message: trimmed,
            context: mentorCtx,
          });
          payload = res.data;
        } catch {
          // Backend unavailable — use local fallback
          await new Promise((r) => setTimeout(r, 300));
          payload = getLocalMentorResponse(trimmed, mentorCtx);
        }

        const aMsg: ChatMessage = {
          role: "assistant",
          content: payload.response,
          timestamp: new Date(),
          tool_used: payload.tool_used,
          tool_result: payload.tool_result ?? undefined,
          display_type: payload.display_type ?? undefined,
          action_links: payload.action_links ?? [],
          suggestions: payload.suggestions ?? [],
        };
        setMessages((prev) => [...prev, aMsg]);
        void saveChatMessage("assistant", payload.response, payload.tool_used ?? undefined, payload.tool_result ?? undefined);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
            timestamp: new Date(),
            suggestions: ["What do you know about me?", "Calculate my SIP"],
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [mentorCtx]
  );

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: "Chat cleared. How can I help you with your finances?",
        timestamp: new Date(),
        suggestions: getSmartSuggestions(mentorCtx),
      },
    ]);
  };

  const visibleInsights = insights.filter((i) => !dismissedInsights.has(i.message));
  const suggestionPills = getSmartSuggestions(mentorCtx);

  return (
    <div className="flex flex-col flex-1 max-h-[calc(100vh-4rem)]">
      {/* ── TOP HEADER ── */}
      <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/90 backdrop-blur-xl px-6 py-3 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-5 w-5 text-white" />
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">DhanGuru AI Mentor</h1>
            <p className="text-[11px] text-slate-400">Natural language interface to your finances</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-300">Groq Mixtral-8x7B</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <MessageSquare size={11} />
            <span>{messages.length - 1} msgs</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── LEFT SIDEBAR ── */}
        <div className="w-72 shrink-0 border-r border-slate-700/50 bg-slate-900/60 backdrop-blur-sm hidden lg:flex flex-col overflow-y-auto">
          <div className="p-4 space-y-4 flex-1">
            {/* Profile card */}
            {mentorCtx && !ctxLoading && <ProfileSnapshotCard context={mentorCtx} />}
            {ctxLoading && (
              <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-6 text-center">
                <div className="h-5 w-5 mx-auto mb-2 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <p className="text-[11px] text-slate-500">Loading your profile...</p>
              </div>
            )}

            {/* Proactive insights */}
            {visibleInsights.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <AlertTriangle size={10} className="text-amber-400" />
                  Insights & Alerts
                </p>
                <div className="space-y-2">
                  <AnimatePresence>
                    {visibleInsights.map((insight) => (
                      <motion.div
                        key={insight.message}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`relative rounded-lg border p-3 text-[11px] leading-relaxed ${
                          insight.priority === "high"
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setDismissedInsights((prev) => new Set([...prev, insight.message]))}
                          className="absolute top-1.5 right-1.5 p-0.5 rounded text-slate-500 hover:text-white transition-colors"
                        >
                          <X size={10} />
                        </button>
                        <p className="pr-4">{insight.message}</p>
                        <button
                          type="button"
                          onClick={() => void sendMessage(insight.action)}
                          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-white hover:underline"
                        >
                          {insight.action} <ChevronRight size={10} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Quick Actions</p>
              <div className="space-y-1">
                {[
                  "What do you know about me?",
                  "Show my portfolio breakdown",
                  "How are my goals progressing?",
                  "What's my net worth?",
                  "Analyze my spending",
                  "Compare tax regimes",
                  "Calculate my SIP",
                  "Check my insurance gap",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => void sendMessage(label)}
                    className="w-full text-left rounded-lg border border-slate-700/40 bg-slate-800/50 px-3 py-2 text-[11px] text-slate-300 transition-all hover:border-emerald-400/40 hover:text-white hover:bg-slate-800/80 hover:translate-x-0.5"
                  >
                    <Zap size={10} className="inline mr-1.5 text-cyan-400" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session footer */}
          <div className="p-4 border-t border-slate-700/40 bg-slate-900/40">
            <button
              type="button"
              onClick={clearChat}
              className="flex items-center gap-2 text-[11px] text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 size={12} /> Clear conversation
            </button>
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-600">
              <History size={10} /> Chat history auto-saved to Supabase
            </div>
          </div>
        </div>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-slate-900/50 to-slate-950/50">
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
            <div className="max-w-3xl mx-auto space-y-5">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={`${msg.timestamp.getTime()}-${i}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {/* Bot avatar */}
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 mt-0.5 shadow-lg shadow-emerald-500/20">
                        <Bot size={15} className="text-white" />
                      </div>
                    )}

                    <div className={`max-w-[82%] ${msg.role === "user" ? "order-first" : ""}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-900/20 rounded-br-md"
                            : "border border-slate-700/50 bg-slate-800/90 backdrop-blur-sm text-slate-200 rounded-bl-md"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <>
                            <div className="whitespace-pre-wrap">{renderMarkdown(msg.content)}</div>

                            {/* Rich card */}
                            {msg.display_type && msg.tool_result && Object.keys(msg.tool_result).length > 0 && (
                              <RichCard displayType={msg.display_type} data={msg.tool_result} />
                            )}

                            {/* Fallback tool result */}
                            {!msg.display_type && msg.tool_result && Object.keys(msg.tool_result).length > 0 && (
                              <FallbackToolCard data={msg.tool_result} toolUsed={msg.tool_used ?? ""} />
                            )}

                            {/* Action links */}
                            {msg.action_links && msg.action_links.length > 0 && (
                              <ActionLinkBar links={msg.action_links} />
                            )}

                            {/* Suggestion chips */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-700/40 pt-2.5">
                                {msg.suggestions.map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => void sendMessage(s)}
                                    className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/20 hover:scale-[1.02]"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Message actions (copy, feedback) */}
                      {msg.role === "assistant" && i > 0 && (
                        <div className="flex items-center gap-0.5 mt-1 ml-1">
                          <CopyButton text={msg.content} />
                          <button type="button" className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-emerald-400 transition-colors" title="Helpful">
                            <ThumbsUp size={12} />
                          </button>
                          <button type="button" className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-rose-400 transition-colors" title="Not helpful">
                            <ThumbsDown size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-start">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 mt-0.5 shadow-lg shadow-emerald-500/20">
                    <Bot size={15} className="text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-700/50 bg-slate-800/90 px-5 py-3">
                    <span className="text-[11px] text-slate-400 mr-1">Thinking</span>
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ── INPUT AREA ── */}
          <div className="border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl px-4 md:px-8 py-4">
            {/* Suggestion pills (show early in conversation) */}
            {messages.length <= 3 && (
              <div className="max-w-3xl mx-auto mb-3 flex flex-wrap gap-2">
                {suggestionPills.map((pill) => (
                  <button
                    key={pill}
                    type="button"
                    onClick={() => void sendMessage(pill)}
                    className="rounded-full border border-slate-600/40 bg-slate-800/50 px-3 py-1.5 text-[11px] text-slate-300 transition-all hover:border-emerald-500/40 hover:bg-slate-700/60 hover:text-white hover:scale-[1.02]"
                  >
                    {pill}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
              className="max-w-3xl mx-auto"
            >
              <div className="relative flex items-end gap-2 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-1.5 transition-all focus-within:border-emerald-500/40 focus-within:ring-2 focus-within:ring-emerald-500/10 focus-within:shadow-lg focus-within:shadow-emerald-500/5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder="Ask DhanGuru anything about your finances..."
                  rows={1}
                  disabled={isTyping}
                  className="min-h-10 max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 text-white shadow-lg shadow-emerald-500/25 transition-all hover:brightness-110 hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
                >
                  <SendHorizontal className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-[9px] text-slate-600">
                Powered by Groq Mixtral-8x7B — Educational information only, not financial advice
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Algorithm explanation */}
      <div className="px-6 py-3 border-t border-slate-700/50 bg-slate-950/60">
        <AlgorithmExplanation sections={ALGO_SECTIONS} />
      </div>
    </div>
  );
}
