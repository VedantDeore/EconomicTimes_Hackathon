import type { ProfileLike } from "@/lib/engine/health";
import { computeTaxAnalysis, type TaxAnalyzePayload } from "@/lib/engine/tax";

export interface CoupleOptimizeInput {
  profileSelf: ProfileLike;
  profilePartner: ProfileLike | null;
  partnerEmail?: string;
}

export interface CoupleOptimization {
  hra_split?: { recommended_claimer: string; savings: number; reason: string };
  insurance_plan?: { joint_vs_individual: string; recommendations: string[] };
  combined_net_worth?: { total: number; partner_1_share: number; partner_2_share: number };
  nps_note?: string;
  sip_split_note?: string;
}

function netWorthFromProfile(p: ProfileLike): number {
  if (!p) return 0;
  const inv = p.existing_investments || {};
  const invSum = Object.values(inv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const efd = p.emergency_fund?.current_amount || 0;
  const debt = (p.debts || []).reduce((s, d) => s + (Number(d.outstanding) || 0), 0);
  return Math.max(0, invSum + efd - debt);
}

export function computeCoupleOptimization(input: CoupleOptimizeInput): { optimization: CoupleOptimization } {
  const nw1 = netWorthFromProfile(input.profileSelf);
  const nw2 = netWorthFromProfile(input.profilePartner);
  const total = nw1 + nw2;
  const p1s = total > 0 ? Math.round((nw1 / total) * 100) : 50;
  const p2s = 100 - p1s;

  const tax1 = input.profileSelf?.tax_regime === "new" ? "new" : "old";
  const tax2 = input.profilePartner?.tax_regime === "new" ? "new" : "old";

  const hra_split = {
    recommended_claimer:
      tax1 === "old" && tax2 !== "old" ? "Partner 1 (old regime)" : tax2 === "old" && tax1 !== "old" ? "Partner 2 (old regime)" : "Higher marginal slab partner",
    savings: Math.round((input.profileSelf?.annual_income?.net || 600000) * 0.06),
    reason:
      "HRA exemption usually helps more when claimed by the partner on old regime with higher taxable income. Verify rent agreement and landlord PAN rules.",
  };

  return {
    optimization: {
      combined_net_worth: { total: total, partner_1_share: p1s, partner_2_share: p2s },
      hra_split,
      insurance_plan: {
        joint_vs_individual: "floater_for_kids_individual_topup",
        recommendations: [
          "Family floater for shared household + super top-up for large SI.",
          "Term cover typically individual (income replacement), equal to 10–15× income each.",
        ],
      },
      nps_note: "If both salaried, each can use 80CCD(2) employer NPS — compare with take-home impact.",
      sip_split_note:
        "Route ELSS/80C via the partner with higher slab on old regime; automate SIPs from joint account for discipline.",
    },
  };
}

export function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ------------------------------------------------------------------ */
/*  Couples Planner — salary inputs + rent (optimization demo)        */
/* ------------------------------------------------------------------ */

export interface CouplesPartnerFields {
  name: string;
  gross_salary: number;
  basic_salary: number;
  hra_received: number;
  sec_80c: number;
  total_investments: number;
  total_debts: number;
}

export interface CouplesPartnerFieldsExt extends CouplesPartnerFields {
  age: number;
  monthly_expenses: number;
  monthly_sip: number;
  risk_profile: "conservative" | "moderate" | "aggressive";
  emergency_fund: number;
}

export interface CouplesPlannerOptimization {
  combined_net_worth: number;
  income_split_a_pct: number;
  hra: { claimant: "A" | "B"; claimant_label: string; savings: number; explanation: string };
  split_80c: { title: string; suggestion: string; potential_savings: number };
  insurance: { title: string; suggestion: string; potential_savings: number };
  nps: { title: string; suggestion: string; potential_savings: number };
  sip: { title: string; suggestion: string; potential_savings: number };
  tax_a: { old: number; new: number; best: "old" | "new"; taxable_old: number; taxable_new: number };
  tax_b: { old: number; new: number; best: "old" | "new"; taxable_old: number; taxable_new: number };
  combined_optimal_tax: number;
  naive_combined_tax: number;
  total_savings_vs_naive: number;
}

function taxPayload(p: CouplesPartnerFields, rentPaidMonthly: number | undefined): TaxAnalyzePayload {
  return {
    financial_year: "2025-26",
    income_details: {
      gross_salary: p.gross_salary,
      basic_salary: p.basic_salary,
      hra_received: p.hra_received,
      rent_paid: rentPaidMonthly && rentPaidMonthly > 0 ? rentPaidMonthly : undefined,
      is_metro: true,
      standard_deduction: 50000,
      professional_tax: 2400,
    },
    deductions: {
      section_80c: { total: Math.min(p.sec_80c, 150000) },
      section_80d: { total: 25000 },
    },
  };
}

function bestTax(rc: { old_regime: { total_tax: number }; new_regime: { total_tax: number }; recommended_regime: "old" | "new" }) {
  return rc.recommended_regime === "old" ? rc.old_regime.total_tax : rc.new_regime.total_tax;
}

function forcedNewTax(rc: { new_regime: { total_tax: number } }) {
  return rc.new_regime.total_tax;
}

export function computeCouplesPlannerOptimization(
  partnerA: CouplesPartnerFields,
  partnerB: CouplesPartnerFields,
  monthlyRent: number
): CouplesPlannerOptimization {
  const nw =
    Math.max(0, partnerA.total_investments - partnerA.total_debts) +
    Math.max(0, partnerB.total_investments - partnerB.total_debts);
  const g = partnerA.gross_salary + partnerB.gross_salary;
  const splitA = g > 0 ? Math.round((partnerA.gross_salary / g) * 100) : 50;

  const aClaims = {
    ta: computeTaxAnalysis(taxPayload(partnerA, monthlyRent)),
    tb: computeTaxAnalysis(taxPayload(partnerB, undefined)),
  };
  const bClaims = {
    ta: computeTaxAnalysis(taxPayload(partnerA, undefined)),
    tb: computeTaxAnalysis(taxPayload(partnerB, monthlyRent)),
  };

  const sumA =
    bestTax(aClaims.ta.regime_comparison) + bestTax(aClaims.tb.regime_comparison);
  const sumB =
    bestTax(bClaims.ta.regime_comparison) + bestTax(bClaims.tb.regime_comparison);

  const aBetter = sumA <= sumB;
  const savings = Math.abs(sumA - sumB);
  const claimant: "A" | "B" = aBetter ? "A" : "B";
  const active = aBetter ? aClaims : bClaims;
  const nameA = partnerA.name.trim() || "Partner A";
  const nameB = partnerB.name.trim() || "Partner B";

  const rcA = active.ta.regime_comparison;
  const rcB = active.tb.regime_comparison;

  const combinedOptimal = bestTax(rcA) + bestTax(rcB);

  const naiveA = computeTaxAnalysis(taxPayload(partnerA, monthlyRent));
  const naiveB = computeTaxAnalysis(taxPayload(partnerB, undefined));
  const naiveCombined = forcedNewTax(naiveA.regime_comparison) + forcedNewTax(naiveB.regime_comparison);

  const marginalA = rcA.old_regime.taxable_income > rcB.old_regime.taxable_income ? nameA : nameB;
  const c80a = Math.min(partnerA.sec_80c, 150000);
  const c80b = Math.min(partnerB.sec_80c, 150000);
  const gap = 150000 - Math.min(c80a + c80b, 300000);
  const split80 = {
    title: "80C split",
    suggestion: `${marginalA} likely benefits more from loading ELSS/PPF within the ₹1.5L cap on old regime, if that partner stays old; align proofs with employer before March.`,
    potential_savings: Math.min(45000, Math.round(gap * 0.3)),
  };

  return {
    combined_net_worth: nw,
    income_split_a_pct: splitA,
    hra: {
      claimant,
      claimant_label: claimant === "A" ? nameA : nameB,
      savings,
      explanation:
        "HRA exemption is modeled on rent paid versus basic and metro rules. The partner with the rent agreement should claim, subject to employer and landlord PAN rules; this comparison picks the lower combined tax under current inputs.",
    },
    split_80c: split80,
    insurance: {
      title: "Insurance review",
      suggestion:
        "Family floater for the household plus individual term cover for income replacement (roughly 10–15× annual income each) usually beats duplicate retail health policies.",
      potential_savings: Math.round((partnerA.gross_salary + partnerB.gross_salary) * 0.004),
    },
    nps: {
      title: "NPS strategy",
      suggestion:
        "If both employers offer 80CCD(2), compare take-home impact of employer NPS; additional deduction under 80CCD(1B) up to ₹50k each is outside the 80C cap.",
      potential_savings: Math.round(Math.min(50000, partnerA.gross_salary * 0.05) * 0.3),
    },
    sip: {
      title: "SIP split",
      suggestion:
        "Route ELSS and voluntary 80C investments via the partner on old regime with higher marginal rate; automate SIPs from a joint account for visibility.",
      potential_savings: Math.round(savings * 0.15),
    },
    tax_a: {
      old: rcA.old_regime.total_tax,
      new: rcA.new_regime.total_tax,
      best: rcA.recommended_regime,
      taxable_old: rcA.old_regime.taxable_income,
      taxable_new: rcA.new_regime.taxable_income,
    },
    tax_b: {
      old: rcB.old_regime.total_tax,
      new: rcB.new_regime.total_tax,
      best: rcB.recommended_regime,
      taxable_old: rcB.old_regime.taxable_income,
      taxable_new: rcB.new_regime.taxable_income,
    },
    combined_optimal_tax: combinedOptimal,
    naive_combined_tax: naiveCombined,
    total_savings_vs_naive: Math.max(0, naiveCombined - combinedOptimal),
  };
}

/* ================================================================== */
/*  Money Compatibility Score (6-dimension radar)                      */
/* ================================================================== */

export interface CompatibilityDimension {
  label: string;
  score: number;
  insight: string;
}

export interface MoneyCompatibilityResult {
  overall_score: number;
  grade: string;
  dimensions: CompatibilityDimension[];
  strengths: string[];
  growth_areas: string[];
}

export function computeMoneyCompatibility(
  a: CouplesPartnerFieldsExt,
  b: CouplesPartnerFieldsExt,
  taxResult: CouplesPlannerOptimization,
): MoneyCompatibilityResult {
  const maxInc = Math.max(a.gross_salary, b.gross_salary, 1);
  const incRatio = Math.min(a.gross_salary, b.gross_salary) / maxInc;
  const incomeBalance = Math.round(incRatio * 80 + 20);

  const totalDebt = a.total_debts + b.total_debts;
  const totalIncome = a.gross_salary + b.gross_salary;
  const dti = totalIncome > 0 ? totalDebt / totalIncome : 1;
  const debtHealth = Math.round(Math.max(0, Math.min(100, (1 - dti * 2.5) * 100)));

  const invA = a.total_investments / Math.max(a.gross_salary, 1);
  const invB = b.total_investments / Math.max(b.gross_salary, 1);
  const investmentScore = Math.round(Math.min(100, ((invA + invB) / 2) * 250));

  const taxEff = totalIncome > 0
    ? Math.min(100, (taxResult.total_savings_vs_naive / totalIncome) * 1200 + 40)
    : 50;

  const monthlyIncome = totalIncome / 12;
  const totalExp = a.monthly_expenses + b.monthly_expenses;
  const savRate = monthlyIncome > 0 ? Math.max(0, (monthlyIncome - totalExp) / monthlyIncome) : 0;
  const savingsScore = Math.round(Math.min(100, savRate * 200));

  const totalEmg = a.emergency_fund + b.emergency_fund;
  const emgMonths = totalExp > 0 ? totalEmg / totalExp : 0;
  const emergencyScore = Math.round(Math.min(100, (emgMonths / 6) * 100));

  const dimensions: CompatibilityDimension[] = [
    {
      label: "Income Balance",
      score: incomeBalance,
      insight: incRatio > 0.7
        ? "Well-balanced earning power reduces single-income risk"
        : "Consider cross-skilling or income diversification strategies",
    },
    {
      label: "Debt Health",
      score: debtHealth,
      insight: dti < 0.15
        ? "Very low debt burden — strong financial foundation"
        : dti < 0.35
          ? "Manageable debt — accelerating payoff frees cash flow"
          : "High combined debt — prioritize aggressive repayment",
    },
    {
      label: "Investment Rate",
      score: investmentScore,
      insight: (invA + invB) / 2 > 0.3
        ? "Strong investment-to-income ratio — keep compounding"
        : "Room to grow — aim for 25-30% of annual income invested",
    },
    {
      label: "Tax Efficiency",
      score: Math.round(taxEff),
      insight: taxResult.total_savings_vs_naive > 50000
        ? "Significant tax optimization unlocked by joint planning"
        : "Already fairly optimized — small tweaks possible",
    },
    {
      label: "Savings Rate",
      score: savingsScore,
      insight: savRate > 0.3
        ? "Excellent combined savings discipline"
        : savRate > 0.15
          ? "Good start — target 30%+ for accelerated wealth building"
          : "Low savings rate — review expense categories together",
    },
    {
      label: "Emergency Buffer",
      score: emergencyScore,
      insight: emgMonths >= 6
        ? "Healthy emergency fund covers 6+ months"
        : `Build ${Math.max(1, Math.ceil(6 - emgMonths))} more months of coverage`,
    },
  ];

  const overall = Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length);

  const grade =
    overall >= 85 ? "Power Couple"
      : overall >= 70 ? "Strong Together"
        : overall >= 55 ? "Growing Together"
          : overall >= 40 ? "Building Foundation"
            : "Early Days";

  return {
    overall_score: overall,
    grade,
    dimensions,
    strengths: dimensions.filter((d) => d.score >= 70).map((d) => d.insight),
    growth_areas: dimensions.filter((d) => d.score < 55).map((d) => d.insight),
  };
}

/* ================================================================== */
/*  Joint FIRE Calculator (Monte Carlo + milestones)                   */
/* ================================================================== */

export interface JointFireMilestone {
  year: number;
  corpus: number;
  pct: number;
  label: string;
}

export interface JointFireResult {
  fire_number: number;
  lean_fire: number;
  fat_fire: number;
  coast_fire: number;
  years_to_fire: number;
  current_corpus: number;
  monthly_sip_needed: number;
  sip_split_a: number;
  sip_split_b: number;
  projected_corpus: number;
  success_probability: number;
  milestones: JointFireMilestone[];
}

export function computeJointFire(
  a: CouplesPartnerFieldsExt,
  b: CouplesPartnerFieldsExt,
): JointFireResult {
  const annualExp = (a.monthly_expenses + b.monthly_expenses) * 12;
  const currentCorpus = a.total_investments + b.total_investments;
  const annualSip = (a.monthly_sip + b.monthly_sip) * 12;
  const nominalReturn = 0.12;
  const inflationRate = 0.06;
  const realReturn = (1 + nominalReturn) / (1 + inflationRate) - 1;
  const swr = 0.04;

  const fireNumber = Math.round(annualExp / swr);
  const leanFire = Math.round((annualExp * 0.7) / swr);
  const fatFire = Math.round((annualExp * 1.3) / swr);

  let years = 0;
  let corpus = currentCorpus;
  while (corpus < fireNumber && years < 50) {
    corpus = corpus * (1 + realReturn) + annualSip;
    years++;
  }
  if (years >= 50) years = 50;

  const targetYears = Math.max(10, Math.min(35, 55 - Math.min(a.age, b.age)));
  const mr = realReturn / 12;
  const months = targetYears * 12;
  const fvFactor = months > 0 ? (Math.pow(1 + mr, months) - 1) / mr : 1;
  const corpusGrowth = currentCorpus * Math.pow(1 + mr, months);
  const sipNeeded = Math.max(0, Math.round((fireNumber - corpusGrowth) / fvFactor));

  const totalIncome = a.gross_salary + b.gross_salary;
  const splitRatio = totalIncome > 0 ? a.gross_salary / totalIncome : 0.5;

  const projectedCorpus = Math.round(
    currentCorpus * Math.pow(1 + realReturn, years) +
    annualSip * (years > 0 ? (Math.pow(1 + realReturn, years) - 1) / realReturn : 0),
  );

  let successes = 0;
  const sims = 1000;
  for (let s = 0; s < sims; s++) {
    let sim = currentCorpus;
    let hit = false;
    for (let y = 0; y < targetYears; y++) {
      const r = realReturn + (Math.random() + Math.random() + Math.random() - 1.5) * 0.12;
      sim = sim * (1 + r) + annualSip;
      if (sim >= fireNumber) { hit = true; break; }
    }
    if (hit) successes++;
  }

  const coastFire = Math.round(fireNumber / Math.pow(1 + realReturn, targetYears));

  const milestones: JointFireMilestone[] = [];
  let running = currentCorpus;
  let leanHit = false, fireHit = false, fatHit = false;
  for (let y = 1; y <= Math.min(years + 5, 45); y++) {
    running = running * (1 + realReturn) + annualSip;
    const pct = Math.min(100, Math.round((running / fireNumber) * 100));
    if (!leanHit && running >= leanFire) {
      milestones.push({ year: y, corpus: Math.round(running), pct, label: "Lean FIRE" });
      leanHit = true;
    } else if (!fireHit && running >= fireNumber) {
      milestones.push({ year: y, corpus: Math.round(running), pct: 100, label: "FIRE" });
      fireHit = true;
    } else if (!fatHit && running >= fatFire) {
      milestones.push({ year: y, corpus: Math.round(running), pct, label: "Fat FIRE" });
      fatHit = true;
    } else if (y % 5 === 0) {
      milestones.push({ year: y, corpus: Math.round(running), pct, label: `Year ${y}` });
    }
  }

  return {
    fire_number: fireNumber,
    lean_fire: leanFire,
    fat_fire: fatFire,
    coast_fire: coastFire,
    years_to_fire: years,
    current_corpus: currentCorpus,
    monthly_sip_needed: sipNeeded,
    sip_split_a: Math.round(sipNeeded * splitRatio),
    sip_split_b: Math.round(sipNeeded * (1 - splitRatio)),
    projected_corpus: projectedCorpus,
    success_probability: Math.round((successes / sims) * 100),
    milestones,
  };
}

/* ================================================================== */
/*  Fair Split Calculator (proportional vs equal)                      */
/* ================================================================== */

export interface FairSplitCategory {
  category: string;
  total: number;
  equal_a: number;
  equal_b: number;
  prop_a: number;
  prop_b: number;
}

export interface FairSplitResult {
  ratio_a: number;
  ratio_b: number;
  recommended: "proportional" | "equal";
  categories: FairSplitCategory[];
  total_monthly: number;
  prop_a_total: number;
  prop_b_total: number;
  equal_each: number;
  disposable_a: number;
  disposable_b: number;
  insight: string;
}

export function computeFairSplit(
  a: CouplesPartnerFieldsExt,
  b: CouplesPartnerFieldsExt,
  monthlyRent: number,
): FairSplitResult {
  const mA = a.gross_salary / 12;
  const mB = b.gross_salary / 12;
  const mTotal = mA + mB;
  const rA = mTotal > 0 ? mA / mTotal : 0.5;
  const rB = 1 - rA;

  const shared = a.monthly_expenses + b.monthly_expenses;
  const raw: { category: string; total: number }[] = [
    { category: "Rent", total: monthlyRent },
    { category: "Groceries & Food", total: Math.round(shared * 0.25) },
    { category: "Utilities & Bills", total: Math.round(shared * 0.10) },
    { category: "Transport", total: Math.round(shared * 0.10) },
    { category: "Entertainment", total: Math.round(shared * 0.08) },
    { category: "Insurance", total: Math.round(shared * 0.05) },
    { category: "Miscellaneous", total: Math.round(shared * 0.07) },
  ];

  const categories: FairSplitCategory[] = raw.map((c) => ({
    ...c,
    equal_a: Math.round(c.total / 2),
    equal_b: c.total - Math.round(c.total / 2),
    prop_a: Math.round(c.total * rA),
    prop_b: c.total - Math.round(c.total * rA),
  }));

  const totalMonthly = categories.reduce((s, c) => s + c.total, 0);
  const propATotal = categories.reduce((s, c) => s + c.prop_a, 0);
  const propBTotal = categories.reduce((s, c) => s + c.prop_b, 0);
  const equalEach = Math.round(totalMonthly / 2);

  const dispA = Math.round(mA - propATotal);
  const dispB = Math.round(mB - propBTotal);

  const pctA = mA > 0 ? (mA - propATotal) / mA : 0;
  const pctB = mB > 0 ? (mB - propBTotal) / mB : 0;
  const eqPctA = mA > 0 ? (mA - equalEach) / mA : 0;
  const eqPctB = mB > 0 ? (mB - equalEach) / mB : 0;

  const recommended: "proportional" | "equal" =
    Math.abs(pctA - pctB) <= Math.abs(eqPctA - eqPctB) ? "proportional" : "equal";

  const insight =
    Math.abs(rA - 0.5) > 0.1
      ? `With a ${Math.round(rA * 100)}:${Math.round(rB * 100)} income split, proportional sharing ensures both retain similar discretionary-income percentages.`
      : "Incomes are fairly balanced, so equal splitting is practical and fair.";

  return {
    ratio_a: Math.round(rA * 100),
    ratio_b: Math.round(rB * 100),
    recommended,
    categories,
    total_monthly: totalMonthly,
    prop_a_total: propATotal,
    prop_b_total: propBTotal,
    equal_each: equalEach,
    disposable_a: dispA,
    disposable_b: dispB,
    insight,
  };
}

/* ================================================================== */
/*  Full Combined Analysis (runs all engines)                          */
/* ================================================================== */

export interface CouplesFullResult {
  tax: CouplesPlannerOptimization;
  compatibility: MoneyCompatibilityResult;
  fire: JointFireResult;
  fairSplit: FairSplitResult;
  partnerA: CouplesPartnerFieldsExt;
  partnerB: CouplesPartnerFieldsExt;
  monthlyRent: number;
  timestamp: string;
}

export function computeFullCouplesAnalysis(
  a: CouplesPartnerFieldsExt,
  b: CouplesPartnerFieldsExt,
  monthlyRent: number,
): CouplesFullResult {
  const tax = computeCouplesPlannerOptimization(a, b, monthlyRent);
  const compatibility = computeMoneyCompatibility(a, b, tax);
  const fire = computeJointFire(a, b);
  const fairSplit = computeFairSplit(a, b, monthlyRent);

  return {
    tax,
    compatibility,
    fire,
    fairSplit,
    partnerA: { ...a },
    partnerB: { ...b },
    monthlyRent,
    timestamp: new Date().toISOString(),
  };
}
