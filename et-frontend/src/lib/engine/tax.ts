const CESS = 0.04;

export interface TaxStep {
  label: string;
  amount: number;
  running_total: number;
  type: "income" | "deduction" | "slab" | "rebate" | "cess" | "total";
}

export interface TaxAnalyzePayload {
  financial_year: string;
  income_details: {
    gross_salary: number;
    basic_salary?: number;
    hra_received?: number;
    rent_paid?: number;
    is_metro?: boolean;
    standard_deduction?: number;
    professional_tax?: number;
    income_from_other_sources?: number;
    rental_income?: number;
    capital_gains?: { short_term?: number; long_term?: number };
  };
  deductions: {
    section_80c: { total?: number; epf?: number; ppf?: number; elss?: number; life_insurance?: number };
    section_80d: { total?: number };
    nps_80ccd_1b?: number;
    home_loan_interest_24b?: number;
    education_loan_80e?: number;
    donations_80g?: number;
    savings_interest_80tta?: number;
    hra_exemption?: number;
  };
}

export interface TaxRegimeResult {
  taxable_income: number;
  tax_payable: number;
  cess: number;
  total_tax: number;
  steps: TaxStep[];
}

export interface TaxAnalysisResult {
  financial_year: string;
  regime_comparison: {
    old_regime: TaxRegimeResult;
    new_regime: TaxRegimeResult;
    recommended_regime: "old" | "new";
    savings: number;
  };
  hra_calculation?: {
    actual_hra: number;
    percent_of_basic: number;
    rent_minus_10pct: number;
    exemption: number;
  };
  missed_deductions: Array<{
    section: string;
    description: string;
    potential_saving: number;
    investment_suggestion: string;
    severity: "high" | "medium" | "low";
  }>;
  tax_saving_investments: Array<{
    instrument: string;
    section: string;
    max_limit: number;
    risk_level: string;
    lock_in: string;
    liquidity: "high" | "medium" | "low" | "very_low";
    expected_returns: string;
    recommended?: boolean;
  }>;
  ai_summary: string;
}

export function computeHRA(
  basic: number,
  hra_received: number,
  rent_paid_annual: number,
  is_metro: boolean
): { actual_hra: number; percent_of_basic: number; rent_minus_10pct: number; exemption: number } {
  const actual_hra = hra_received;
  const percent_of_basic = basic * (is_metro ? 0.5 : 0.4);
  const rent_minus_10pct = Math.max(0, rent_paid_annual - basic * 0.1);
  const exemption = Math.max(0, Math.min(actual_hra, percent_of_basic, rent_minus_10pct));
  return { actual_hra, percent_of_basic, rent_minus_10pct, exemption };
}

function computeOldRegime(
  gross: number,
  std_ded: number,
  prof_tax: number,
  other_income: number,
  hra_exemption: number,
  sec80c: number,
  sec80d: number,
  nps: number,
  home_loan: number,
  edu_loan: number,
  donations: number,
  savings_int: number
): TaxRegimeResult {
  const steps: TaxStep[] = [];
  let running = 0;

  running = gross;
  steps.push({ label: "Gross Salary", amount: gross, running_total: running, type: "income" });

  if (other_income > 0) {
    running += other_income;
    steps.push({ label: "Other Income", amount: other_income, running_total: running, type: "income" });
  }

  const gross_total = running;

  running -= std_ded;
  steps.push({ label: "Less: Standard Deduction", amount: -std_ded, running_total: running, type: "deduction" });

  if (prof_tax > 0) {
    running -= prof_tax;
    steps.push({ label: "Less: Professional Tax", amount: -prof_tax, running_total: running, type: "deduction" });
  }

  const capped_hra = Math.min(hra_exemption, gross * 0.5);
  if (capped_hra > 0) {
    running -= capped_hra;
    steps.push({ label: "Less: HRA Exemption (Sec 10)", amount: -capped_hra, running_total: running, type: "deduction" });
  }

  const capped_80c = Math.min(sec80c, 150000);
  if (capped_80c > 0) {
    running -= capped_80c;
    steps.push({ label: `Less: Section 80C (₹${capped_80c.toLocaleString("en-IN")} of ₹1.5L)`, amount: -capped_80c, running_total: running, type: "deduction" });
  }

  const capped_80d = Math.min(sec80d, 100000);
  if (capped_80d > 0) {
    running -= capped_80d;
    steps.push({ label: "Less: Section 80D (Health Insurance)", amount: -capped_80d, running_total: running, type: "deduction" });
  }

  const capped_nps = Math.min(nps, 50000);
  if (capped_nps > 0) {
    running -= capped_nps;
    steps.push({ label: "Less: NPS 80CCD(1B)", amount: -capped_nps, running_total: running, type: "deduction" });
  }

  const capped_hl = Math.min(home_loan, 200000);
  if (capped_hl > 0) {
    running -= capped_hl;
    steps.push({ label: "Less: Home Loan Interest Sec 24(b)", amount: -capped_hl, running_total: running, type: "deduction" });
  }

  if (edu_loan > 0) {
    running -= edu_loan;
    steps.push({ label: "Less: Education Loan 80E", amount: -edu_loan, running_total: running, type: "deduction" });
  }
  if (donations > 0) {
    running -= donations;
    steps.push({ label: "Less: Donations 80G", amount: -donations, running_total: running, type: "deduction" });
  }
  if (savings_int > 0) {
    const capped = Math.min(savings_int, 10000);
    running -= capped;
    steps.push({ label: "Less: Savings Interest 80TTA", amount: -capped, running_total: running, type: "deduction" });
  }

  const taxable = Math.max(0, running);
  steps.push({ label: "Taxable Income (Old Regime)", amount: taxable, running_total: taxable, type: "total" });

  const slabs: [number, number, number, string][] = [
    [0, 250000, 0, "0 – 2.5L @ Nil"],
    [250000, 500000, 0.05, "2.5L – 5L @ 5%"],
    [500000, 1000000, 0.20, "5L – 10L @ 20%"],
    [1000000, Infinity, 0.30, "Above 10L @ 30%"],
  ];

  let tax = 0;
  for (const [lo, hi, rate, label] of slabs) {
    if (taxable <= lo) break;
    const slice = Math.min(taxable, hi) - lo;
    const slab_tax = Math.round(slice * rate);
    tax += slab_tax;
    if (rate > 0) {
      steps.push({ label: `Slab: ${label}`, amount: slab_tax, running_total: tax, type: "slab" });
    }
  }

  const rebate = taxable <= 500000 ? Math.min(tax, 12500) : 0;
  if (rebate > 0) {
    tax -= rebate;
    steps.push({ label: "Less: Rebate u/s 87A", amount: -rebate, running_total: tax, type: "rebate" });
  }

  const cess = Math.round(tax * CESS);
  if (cess > 0) {
    steps.push({ label: "Add: Health & Education Cess (4%)", amount: cess, running_total: tax + cess, type: "cess" });
  }

  const total = tax + cess;
  steps.push({ label: "Total Tax (Old Regime)", amount: total, running_total: total, type: "total" });

  return {
    taxable_income: taxable,
    tax_payable: tax,
    cess,
    total_tax: total,
    steps,
  };
}

function computeNewRegime(gross: number, other_income: number, prof_tax: number): TaxRegimeResult {
  const steps: TaxStep[] = [];
  let running = gross;
  steps.push({ label: "Gross Salary", amount: gross, running_total: running, type: "income" });

  if (other_income > 0) {
    running += other_income;
    steps.push({ label: "Other Income", amount: other_income, running_total: running, type: "income" });
  }

  const std_ded = 75000;
  running -= std_ded;
  steps.push({ label: "Less: Standard Deduction (₹75,000)", amount: -std_ded, running_total: running, type: "deduction" });

  if (prof_tax > 0) {
    running -= prof_tax;
    steps.push({ label: "Less: Professional Tax", amount: -prof_tax, running_total: running, type: "deduction" });
  }

  steps.push({ label: "No Chapter VI-A deductions in New Regime", amount: 0, running_total: running, type: "deduction" });

  const taxable = Math.max(0, running);
  steps.push({ label: "Taxable Income (New Regime)", amount: taxable, running_total: taxable, type: "total" });

  const slabs: [number, number, number, string][] = [
    [0, 400000, 0, "0 – 4L @ Nil"],
    [400000, 800000, 0.05, "4L – 8L @ 5%"],
    [800000, 1200000, 0.10, "8L – 12L @ 10%"],
    [1200000, 1600000, 0.15, "12L – 16L @ 15%"],
    [1600000, 2000000, 0.20, "16L – 20L @ 20%"],
    [2000000, 2400000, 0.25, "20L – 24L @ 25%"],
    [2400000, Infinity, 0.30, "Above 24L @ 30%"],
  ];

  let tax = 0;
  for (const [lo, hi, rate, label] of slabs) {
    if (taxable <= lo) break;
    const slice = Math.min(taxable, hi) - lo;
    const slab_tax = Math.round(slice * rate);
    tax += slab_tax;
    if (rate > 0) {
      steps.push({ label: `Slab: ${label}`, amount: slab_tax, running_total: tax, type: "slab" });
    }
  }

  const rebate = taxable <= 1200000 ? Math.min(tax, 60000) : 0;
  if (rebate > 0) {
    tax -= rebate;
    steps.push({ label: "Less: Rebate u/s 87A (New Regime)", amount: -rebate, running_total: tax, type: "rebate" });
  }

  const cess = Math.round(tax * CESS);
  if (cess > 0) {
    steps.push({ label: "Add: Health & Education Cess (4%)", amount: cess, running_total: tax + cess, type: "cess" });
  }

  const total = tax + cess;
  steps.push({ label: "Total Tax (New Regime)", amount: total, running_total: total, type: "total" });

  return {
    taxable_income: taxable,
    tax_payable: tax,
    cess,
    total_tax: total,
    steps,
  };
}

function getMarginalRate(taxable: number, regime: "old" | "new"): number {
  if (regime === "old") {
    if (taxable > 1000000) return 0.30;
    if (taxable > 500000) return 0.20;
    if (taxable > 250000) return 0.05;
    return 0;
  }
  if (taxable > 2400000) return 0.30;
  if (taxable > 2000000) return 0.25;
  if (taxable > 1600000) return 0.20;
  if (taxable > 1200000) return 0.15;
  if (taxable > 800000) return 0.10;
  if (taxable > 400000) return 0.05;
  return 0;
}

export function computeTaxAnalysis(payload: TaxAnalyzePayload): TaxAnalysisResult {
  const inc = payload.income_details;
  const ded = payload.deductions;
  const gross = inc.gross_salary || 0;
  const prof = inc.professional_tax || 0;
  const other = (inc.income_from_other_sources || 0) + (inc.rental_income || 0);

  let hra_calc: TaxAnalysisResult["hra_calculation"] | undefined;
  let hra_exemption = ded.hra_exemption ?? 0;

  if (inc.basic_salary && inc.hra_received && inc.rent_paid) {
    hra_calc = computeHRA(
      inc.basic_salary,
      inc.hra_received,
      inc.rent_paid * 12,
      inc.is_metro ?? true
    );
    hra_exemption = hra_calc.exemption;
  }

  const old_regime = computeOldRegime(
    gross, inc.standard_deduction ?? 50000, prof, other, hra_exemption,
    ded.section_80c?.total ?? 0, ded.section_80d?.total ?? 0,
    ded.nps_80ccd_1b ?? 0, ded.home_loan_interest_24b ?? 0,
    ded.education_loan_80e ?? 0, ded.donations_80g ?? 0,
    ded.savings_interest_80tta ?? 0
  );

  const new_regime = computeNewRegime(gross, other, prof);

  const recommended_regime: "old" | "new" = old_regime.total_tax <= new_regime.total_tax ? "old" : "new";
  const savings = Math.abs(old_regime.total_tax - new_regime.total_tax);

  const marginal = getMarginalRate(old_regime.taxable_income, "old");
  const cessMul = 1 + CESS;

  const missed: TaxAnalysisResult["missed_deductions"] = [];
  const c80 = ded.section_80c?.total ?? 0;
  if (c80 < 150000) {
    const gap = 150000 - c80;
    missed.push({
      section: "80C",
      description: `Only ₹${c80.toLocaleString("en-IN")} of ₹1,50,000 limit used. ₹${gap.toLocaleString("en-IN")} remaining.`,
      potential_saving: Math.round(gap * marginal * cessMul),
      investment_suggestion: "Invest in ELSS (3-yr lock-in, market returns) or PPF (safe, 7.1%) to fill the gap.",
      severity: gap > 100000 ? "high" : gap > 50000 ? "medium" : "low",
    });
  }
  const d80 = ded.section_80d?.total ?? 0;
  if (d80 < 25000) {
    const gap = 25000 - d80;
    missed.push({
      section: "80D",
      description: `Health insurance premium: ₹${d80.toLocaleString("en-IN")} used. Consider family floater up to ₹25K (₹50K if parents > 60).`,
      potential_saving: Math.round(gap * marginal * cessMul),
      investment_suggestion: "Get a ₹5L+ family floater. Add ₹5K preventive health check-up (100% deductible).",
      severity: "medium",
    });
  }
  const nps = ded.nps_80ccd_1b ?? 0;
  if (nps < 50000) {
    const gap = 50000 - nps;
    missed.push({
      section: "80CCD(1B)",
      description: `NPS additional deduction: ₹${nps.toLocaleString("en-IN")} of ₹50,000 used. This is OVER and ABOVE 80C limit.`,
      potential_saving: Math.round(gap * marginal * cessMul),
      investment_suggestion: "Invest ₹50K in NPS Tier-1. Lock-in till 60, but extra ₹50K deduction beyond 80C.",
      severity: gap === 50000 ? "high" : "medium",
    });
  }
  const hl = ded.home_loan_interest_24b ?? 0;
  if (hl > 0 && hl < 200000) {
    missed.push({
      section: "24(b)",
      description: `Home loan interest: ₹${hl.toLocaleString("en-IN")} of ₹2L limit used.`,
      potential_saving: Math.round((200000 - hl) * marginal * cessMul),
      investment_suggestion: "Ensure you claim full interest paid. Consider prepaying to reduce interest burden.",
      severity: "low",
    });
  }
  if ((ded.education_loan_80e ?? 0) === 0) {
    missed.push({
      section: "80E",
      description: "Education loan interest: No deduction claimed. No upper limit on 80E.",
      potential_saving: 0,
      investment_suggestion: "If you have an education loan, the ENTIRE interest is deductible under 80E (no cap).",
      severity: "low",
    });
  }
  if ((ded.savings_interest_80tta ?? 0) === 0) {
    missed.push({
      section: "80TTA",
      description: "Savings account interest up to ₹10,000 is deductible. Most people miss this.",
      potential_saving: Math.round(10000 * marginal * cessMul),
      investment_suggestion: "Check your bank statements for savings interest earned and claim up to ₹10K.",
      severity: "low",
    });
  }

  const tax_saving_investments: TaxAnalysisResult["tax_saving_investments"] = [
    { instrument: "ELSS Mutual Fund", section: "80C", max_limit: 150000, risk_level: "moderate-high", lock_in: "3 years", liquidity: "medium", expected_returns: "12–15% (market-linked)", recommended: true },
    { instrument: "PPF (Public Provident Fund)", section: "80C", max_limit: 150000, risk_level: "zero (govt-backed)", lock_in: "15 years", liquidity: "very_low", expected_returns: "7.1% (guaranteed)" },
    { instrument: "NPS Tier-1", section: "80CCD(1B)", max_limit: 50000, risk_level: "moderate", lock_in: "Till age 60", liquidity: "very_low", expected_returns: "9–12% (market-linked)", recommended: true },
    { instrument: "Tax-Saver FD", section: "80C", max_limit: 150000, risk_level: "zero (bank)", lock_in: "5 years", liquidity: "low", expected_returns: "7–7.5% (taxable)" },
    { instrument: "SCSS", section: "80C", max_limit: 3000000, risk_level: "zero (govt)", lock_in: "5 years", liquidity: "low", expected_returns: "8.2% (for senior citizens)" },
    { instrument: "Health Insurance", section: "80D", max_limit: 100000, risk_level: "n/a", lock_in: "1 year", liquidity: "high", expected_returns: "Risk cover, not investment" },
    { instrument: "Home Loan Principal", section: "80C", max_limit: 150000, risk_level: "n/a", lock_in: "Loan tenure", liquidity: "very_low", expected_returns: "Saves interest cost" },
    { instrument: "Sukanya Samriddhi", section: "80C", max_limit: 150000, risk_level: "zero (govt)", lock_in: "21 years", liquidity: "very_low", expected_returns: "8.2% (tax-free)" },
  ];

  const oldStr = `₹${old_regime.total_tax.toLocaleString("en-IN")}`;
  const newStr = `₹${new_regime.total_tax.toLocaleString("en-IN")}`;
  const recStr = recommended_regime === "old" ? "Old" : "New";
  const savStr = `₹${savings.toLocaleString("en-IN")}`;
  const missedCount = missed.filter(m => m.severity !== "low").length;

  const ai_summary =
    `Tax under Old Regime: ${oldStr} (taxable ₹${old_regime.taxable_income.toLocaleString("en-IN")}). ` +
    `Tax under New Regime: ${newStr} (taxable ₹${new_regime.taxable_income.toLocaleString("en-IN")}). ` +
    `The ${recStr} Regime saves you ${savStr}. ` +
    (missedCount > 0
      ? `${missedCount} high/medium-priority deduction(s) missed — review the suggestions below to save more. `
      : `You are utilizing most deductions well. `) +
    `Always verify with a Chartered Accountant before filing.`;

  return {
    financial_year: payload.financial_year,
    regime_comparison: { old_regime, new_regime, recommended_regime, savings },
    hra_calculation: hra_calc,
    missed_deductions: missed,
    tax_saving_investments,
    ai_summary,
  };
}
