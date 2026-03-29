"use client";

import { motion } from "framer-motion";
import {
  ShieldAlert,
  Smartphone,
  Zap,
  Activity,
  ArrowRightLeft,
  ChevronRight,
  Target,
  Users,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { useState } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// --- Types ---
export type HealthStats = {
  score: number;
  equityPct: number;
  debtPct: number;
  expenseDragTotal: number;
};

export type SwitchRec = {
  from: string;
  to: string;
  reason: string;
  impact: string;
  type: "expense" | "overlap" | "risk";
};

// 1. Health Score Component
export function HealthScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "text-red-500";
  let status = "Needs Attention";
  if (score >= 80) {
    color = "text-[#00D09C]";
    status = "Excellent";
  } else if (score >= 60) {
    color = "text-amber-500";
    status = "Fair";
  }

  return (
    <div className="flex h-full flex-col justify-center items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200" />
          <motion.circle
            cx="56" cy="56" r="45" stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={color}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold tracking-tighter text-gray-900">{Math.round(score)}</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <h4 className="text-sm font-semibold text-gray-900">Portfolio Score</h4>
        <p className={cn("text-xs font-bold uppercase tracking-widest mt-1", color)}>{status}</p>
      </div>
    </div>
  );
}

// 2. AI Persona Money Mentor
export function AIMentorPersona({
  age,
  risk,
  onAgeChange,
  onRiskChange,
  currentEquity,
  currentDebt,
}: {
  age: number;
  risk: string;
  onAgeChange: (a: number) => void;
  onRiskChange: (r: string) => void;
  currentEquity: number;
  currentDebt: number;
}) {
  let targetEquity = 100 - age;
  if (risk === "aggressive" || risk === "very_aggressive") targetEquity += 10;
  if (risk === "conservative") targetEquity -= 15;
  targetEquity = Math.max(10, Math.min(95, targetEquity)); 
  const targetDebt = 100 - targetEquity;

  const diff = Math.abs(currentEquity - targetEquity);
  let advice = `You're perfectly aligned with an optimized ${targetEquity}% equity strategy.`;
  if (currentEquity > targetEquity + 10) {
    advice = `You are heavily overexposed to Equity (${currentEquity.toFixed(0)}% vs target ${targetEquity.toFixed(0)}%). Consider securing downside risk with Debt/Gold.`;
  } else if (currentEquity < targetEquity - 10) {
    advice = `You are playing too safe! Boost your Equity allocation to ~${targetEquity.toFixed(0)}% for optimal long-term compounding based on your age.`;
  }

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 shadow-sm">
      <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-500/20 pb-2">
        <Users className="h-5 w-5" />
        <h3 className="font-semibold tracking-tight">AI Money Mentor</h3>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Age</label>
          <input
            type="number" min={18} max={100} value={age}
            onChange={(e) => onAgeChange(Number(e.target.value))}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Risk Profile</label>
          <select
            value={risk} onChange={(e) => onRiskChange(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>
      <div className="rounded-xl bg-indigo-500/10 p-3 mt-auto border border-indigo-500/20">
        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-1.5">
          <Target className="h-3.5 w-3.5 text-[#00D09C]" /> Target Mix: {targetEquity.toFixed(0)}% Eq / {targetDebt.toFixed(0)}% Debt
        </p>
        <p className="text-xs leading-relaxed text-indigo-900/90">{advice}</p>
      </div>
    </div>
  );
}

// 3. iPhone Expense Leakage
export function ExpenseLeakage({ expenseDrag10y }: { expenseDrag10y: number }) {
  const iphoneCost = 80000;
  const iphonesLost = (expenseDrag10y / iphoneCost).toFixed(1);

  if (expenseDrag10y < 10000) {
    return (
      <div className="flex h-full flex-col justify-center gap-3 rounded-2xl border border-[#00D09C]/20 bg-[#00D09C]/5 p-5 shadow-sm text-gray-700">
        <div className="flex items-center gap-2 border-b border-[#00D09C]/20 pb-2 mb-2">
          <Zap className="h-5 w-5 text-[#00D09C]" />
          <h3 className="font-semibold tracking-tight text-[#00D09C]">Unbeatable Efficiency</h3>
        </div>
        <p className="text-sm leading-relaxed">Your expense ratio drag is incredibly low! Excellent job hunting down highly optimized, direct funds. You are losing almost nothing to fees.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-rose-500/20 pb-2">
        <Smartphone className="h-5 w-5 text-rose-400" />
        <h3 className="font-semibold tracking-tight text-rose-800">Expense Fee Leakage</h3>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-red-600">{formatCurrency(expenseDrag10y)}</p>
        <p className="text-xs font-medium text-rose-600 uppercase tracking-widest mt-1">Lost to fees in 10Y</p>
      </div>
      <div className="rounded-xl bg-red-500/10 p-3 border border-red-500/20 mt-auto">
        <p className="text-xs leading-relaxed text-rose-800">
          That is equivalent to buying a brand new ₹80K iPhone every <strong className="text-rose-900">{(10 / parseFloat(iphonesLost)).toFixed(1)} years</strong>! Switch to Direct plans to plug this leak.
        </p>
      </div>
    </div>
  );
}

// 4. Actionable Target Switch Matrix
export function SwitchRecommendations({ recs }: { recs: SwitchRec[] }) {
  if (recs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3 opacity-20"><ArrowRightLeft size={64} className="text-amber-500" /></div>
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-amber-900 relative z-10 text-lg">
        <ArrowRightLeft className="h-5 w-5" />
        "What Should I Do Next?" Engine
      </h3>
      <div className="grid gap-4 lg:grid-cols-2 relative z-10">
        {recs.map((r, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl bg-white p-5 border border-amber-500/10 hover:border-amber-500/30 transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
              <span className="text-xs line-through text-gray-400 flex-1 truncate">{r.from}</span>
              <ChevronRight className="h-4 w-4 text-amber-500 shrink-0 hidden sm:block" />
              <span className="text-sm font-bold text-[#00D09C] flex-1 truncate">In: {r.to}</span>
            </div>
            <div>
              <p className="text-xs text-gray-600 leading-relaxed"><strong className="text-amber-700/80">Why:</strong> {r.reason}</p>
              <p className="mt-2 text-xs font-bold text-[#00D09C] flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5"/> {r.impact}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Upgrade: Smart Rebalancing Simulator (SIP & Shifts)
export function SmartRebalancingSimulator({
  totalValue,
  equityPct,
  debtPct
}: {
  totalValue: number;
  equityPct: number;
  debtPct: number;
}) {
  const [activeTab, setActiveTab] = useState<"stress" | "sip" | "shift">("stress");
  const [scenario, setScenario] = useState<"normal" | "crash" | "bull">("normal");

  // Stress Test
  const eqValue = totalValue * (equityPct / 100);
  const debtValue = totalValue * (debtPct / 100);
  let simulatedValue = totalValue;
  if (scenario === "crash") simulatedValue = (eqValue * 0.7) + debtValue;
  else if (scenario === "bull") simulatedValue = (eqValue * 1.25) + debtValue;
  const diff = simulatedValue - totalValue;

  // SIP Math (10y @ 12%)
  const sipPM = 10000;
  const months = 120;
  const rate = 0.12 / 12;
  const sipFV = sipPM * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
  const currentFV = totalValue * Math.pow(1.12, 10);
  const combinedSIPVal = currentFV + sipFV;

  // Shift Math (20% Eq to Debt) - illustrative return shifts
  const shiftEqValue = Math.max(0, eqValue - (totalValue * 0.2));
  const shiftDebtValue = debtValue + (totalValue * 0.2);
  const blendedReturnNormal = (equityPct * 0.12) + (debtPct * 0.07);
  const blendedReturnShift = ((shiftEqValue/totalValue)*0.12) + ((shiftDebtValue/totalValue)*0.07);

  return (
    <div className="rounded-2xl border border-[#00D09C]/20 bg-[#00D09C]/5 p-6 shadow-sm w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 border-b border-[#00D09C]/10 pb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-[#00D09C]" />
          <h3 className="font-semibold text-[#00D09C] text-lg">Smart Rebalancing Simulator</h3>
        </div>
        <div className="flex gap-1.5 rounded-lg bg-gray-100 p-1.5 border border-gray-200 flex-wrap">
          {(["stress", "sip", "shift"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-3 sm:px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors",
                activeTab === tab ? "bg-[#00D09C]/15 text-[#00D09C] border border-[#00D09C]/30" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {tab === "stress" ? "Stress Test" : tab === "sip" ? "SIP Plan" : "Shift Risk"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "stress" && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
          <div className="flex gap-2 rounded-lg bg-gray-100 p-1 w-full sm:w-fit flex-wrap">
            <button onClick={() => setScenario("crash")} className={cn("rounded-md px-4 py-2 text-xs font-bold transition flex-1 sm:flex-none", scenario === "crash" ? "bg-rose-500 text-white" : "text-gray-500 hover:bg-gray-200")}>-30% Market Crash</button>
            <button onClick={() => setScenario("normal")} className={cn("rounded-md px-4 py-2 text-xs font-bold transition flex-1 sm:flex-none", scenario === "normal" ? "bg-gray-600 text-white" : "text-gray-500 hover:bg-gray-200")}>Normal</button>
            <button onClick={() => setScenario("bull")} className={cn("rounded-md px-4 py-2 text-xs font-bold transition flex-1 sm:flex-none", scenario === "bull" ? "bg-[#00D09C] text-white" : "text-gray-500 hover:bg-gray-200")}>+25% Bull Run</button>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 items-center rounded-xl bg-gray-50 p-5 border border-gray-200">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Current Value</span>
              <span className="text-xl font-mono text-gray-700">{formatCurrency(totalValue)}</span>
            </div>
            <div className="flex flex-col gap-1 sm:border-l sm:border-r border-gray-200 sm:px-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Equity Protection</span>
              <span className="text-lg font-mono text-[#00D09C]">{debtPct.toFixed(0)}% Safe</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00D09C]">Simulated Worth</span>
              <div className="flex items-end gap-3 flex-wrap">
                <motion.span key={simulatedValue} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={cn("text-2xl font-mono font-bold", scenario === "crash" ? "text-rose-400" : scenario === "bull" ? "text-[#00D09C]" : "text-gray-900")}>
                  {formatCurrency(simulatedValue)}
                </motion.span>
                {scenario !== "normal" && (
                  <span className={cn("mb-1 text-sm font-bold", diff > 0 ? "text-[#00D09C]" : "text-rose-400")}>
                    {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "sip" && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <h4 className="font-bold text-gray-900 text-lg">Power of Compounding</h4>
            <p className="text-sm text-gray-500 mt-2">What happens if you start a ₹10,000/mo SIP today, assuming 12% CAGR over 10 years, combining with your current corpus?</p>
            <div className="mt-5 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs uppercase tracking-wider font-bold text-gray-400 mb-1">Total in 10 Years</p>
                <p className="text-3xl font-mono font-bold text-[#00D09C]">{formatCurrency(combinedSIPVal)}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
             <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"><span className="text-sm text-gray-600">Base Corpus Growth</span><span className="font-mono text-gray-900 text-sm">{formatCurrency(currentFV)}</span></div>
             <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"><span className="text-sm text-gray-600">New SIP Contribution (10Y)</span><span className="font-mono text-gray-900 text-sm">₹12,00,000</span></div>
             <div className="flex justify-between items-center bg-gray-100 p-3 rounded-lg"><span className="text-sm text-gray-600">SIP Wealth Gained</span><span className="font-mono text-[#00D09C] text-sm align-right">+{formatCurrency(sipFV - 1200000)}</span></div>
          </div>
        </motion.div>
      )}

      {activeTab === "shift" && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <h4 className="font-bold text-gray-900 text-lg">Shift 20% to Debt/Gold</h4>
            <p className="text-sm text-gray-500 mt-2">Simulate de-risking your portfolio by moving 20% of your current total from Equity into Safer assets (Debt/Gold).</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                 <p className="text-xs text-rose-700 mb-1">Exp. Annual Return</p>
                 <p className="text-lg font-bold text-rose-800">{blendedReturnNormal.toFixed(2)}% <span className="text-xs opacity-60">→ {blendedReturnShift.toFixed(2)}%</span></p>
              </div>
              <div className="bg-[#00D09C]/10 border border-[#00D09C]/20 p-3 rounded-xl">
                 <p className="text-xs text-[#00D09C] mb-1">Reduced Volatility</p>
                 <p className="text-lg font-bold text-gray-900">Highly Stable</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-100 rounded-xl p-5 border border-gray-200">
            <h5 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Allocation Shift</h5>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-gray-600"><span>Equity</span><span>{((shiftEqValue/totalValue)*100).toFixed(0)}%</span></div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 transition-all duration-1000" style={{width: `${(shiftEqValue/totalValue)*100}%`}}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5 text-gray-600"><span>Debt / Safe</span><span>{((shiftDebtValue/totalValue)*100).toFixed(0)}%</span></div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-[#00D09C] transition-all duration-1000" style={{width: `${(shiftDebtValue/totalValue)*100}%`}}></div></div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 6. Hidden Risk Detection
export function HiddenRiskDetection({
  funds
}: {
  funds: { name: string; category: string }[];
}) {
  if (funds.length === 0) return null;

  // Detect AMC Concentration
  const amcMap: Record<string, number> = {};
  funds.forEach(f => {
    const word = f.name.split(" ")[0].toUpperCase();
    if (word.length > 2) amcMap[word] = (amcMap[word] || 0) + 1;
  });
  
  const amcRisks = Object.entries(amcMap)
    .filter(([amc, count]) => count > 2 || (count >= 2 && funds.length <= 4))
    .map(([amc, count]) => ({
       title: `High AMC Concentration (${amc})`,
       desc: `${count} of your ${funds.length} funds are managed by ${amc}. This exposes you to institutional specific risks. Consider diversifying across fund houses.`
    }));

  // Detect Sector Concentration based on Category Heuristics
  const catMap: Record<string, number> = {};
  funds.forEach(f => { catMap[f.category] = (catMap[f.category] || 0) + 1; });
  
  const sectorRisks = [];
  const largeCount = (catMap["Large Cap"] || 0) + (catMap["Flexi Cap"] || 0);
  if (largeCount >= 2 && largeCount / funds.length >= 0.5) {
      sectorRisks.push({
         title: `Hidden Sector Risk: Financials & IT`,
         desc: `Because Large/Flexi Cap dominate your portfolio, you are heavily indirectly exposed to Banking and IT stocks. An underperforming sector will drag your whole portfolio.`
      });
  }

  const risks = [...amcRisks, ...sectorRisks];

  if (risks.length === 0) {
     return (
       <div className="rounded-2xl border border-[#00D09C]/20 bg-[#00D09C]/5 p-6 shadow-sm flex items-center gap-4">
         <ShieldAlert className="h-8 w-8 text-[#00D09C] shrink-0" />
         <div>
           <h3 className="font-semibold text-[#00D09C] text-lg">No Hidden Risks Detected</h3>
           <p className="text-sm text-gray-600 mt-1">Your AMC and categorized sector exposures look properly diversified across fund houses.</p>
         </div>
       </div>
     );
  }

  return (
    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 shadow-sm w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-500/20 p-2.5 rounded-xl"><ShieldAlert className="h-6 w-6 text-violet-400" /></div>
        <div>
          <h3 className="font-semibold text-violet-800 text-lg">Hidden Risk Detection</h3>
          <p className="text-[10px] text-violet-600 uppercase tracking-widest font-bold mt-1">Institution-Grade Heuristics</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {risks.map((r, i) => (
          <div key={i} className="bg-white border border-violet-500/20 p-5 rounded-xl">
            <h4 className="flex items-start sm:items-center gap-2 font-bold text-violet-800 text-sm mb-2"><Briefcase className="h-4 w-4 text-violet-400 shrink-0 mt-0.5 sm:mt-0"/> {r.title}</h4>
            <p className="text-sm text-gray-600 leading-relaxed text-indigo-900/90">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
