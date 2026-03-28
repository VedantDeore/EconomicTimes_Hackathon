/** Simplified India income-tax estimate for demo / education only — not tax advice. */

const CESS = 0.04;

function taxOldRegimeSlabs(taxable: number): number {
  if (taxable <= 0) return 0;
  const t = taxable;
  let tax = 0;
  const slab = [250000, 500000, 1000000];
  const rates = [0.05, 0.1, 0.2, 0.3];
  let prev = 0;
  for (let i = 0; i < slab.length; i++) {
    const cap = slab[i];
    if (t <= prev) break;
    const slice = Math.min(t, cap) - prev;
    if (slice > 0) tax += slice * rates[i];
    prev = cap;
  }
  if (t > slab[slab.length - 1]) {
    tax += (t - slab[slab.length - 1]) * rates[rates.length - 1];
  }
  const rebate = taxable <= 500000 ? Math.min(tax, 12500) : 0;
  tax = Math.max(0, tax - rebate);
  return Math.round(tax * (1 + CESS));
}

function taxNewRegimeSlabs(taxable: number): number {
  if (taxable <= 0) return 0;
  const slab = [300000, 600000, 900000, 1200000, 1500000];
  const rates = [0.05, 0.1, 0.15, 0.2, 0.3];
  let tax = 0;
  let prev = 0;
  for (let i = 0; i < slab.length; i++) {
    const slice = Math.min(taxable, slab[i]) - prev;
    if (slice > 0) tax += slice * rates[i];
    prev = slab[i];
  }
  if (taxable > slab[slab.length - 1]) {
    tax += (taxable - slab[slab.length - 1]) * 0.3;
  }
  const rebate = taxable <= 700000 ? Math.min(tax, 25000) : 0;
  tax = Math.max(0, tax - rebate);
  return Math.round(tax * (1 + CESS));
}

export interface TaxAnalyzePayload {
  financial_year: string;
  income_details: {
    gross_salary: number;
    hra_received?: number;
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

export interface TaxAnalysisResult {
  financial_year: string;
  regime_comparison: {
    old_regime: { taxable_income: number; tax_payable: number; cess: number; total_tax: number };
    new_regime: { taxable_income: number; tax_payable: number; cess: number; total_tax: number };
    recommended_regime: "old" | "new";
    savings: number;
  };
  missed_deductions: Array<{
    section: string;
    description: string;
    potential_saving: number;
    investment_suggestion: string;
  }>;
  tax_saving_investments: Array<{
    instrument: string;
    section: string;
    amount: number;
    risk_level: string;
    lock_in_years: number;
    liquidity: string;
    expected_returns: string;
  }>;
  ai_summary: string;
}

export function computeTaxAnalysis(payload: TaxAnalyzePayload): TaxAnalysisResult {
  const inc = payload.income_details;
  const ded = payload.deductions;
  const gross = inc.gross_salary || 0;
  const prof = inc.professional_tax || 0;
  const other = (inc.income_from_other_sources || 0) + (inc.rental_income || 0);
  const stcg = inc.capital_gains?.short_term || 0;
  const ltcg = inc.capital_gains?.long_term || 0;

  const stdOld = inc.standard_deduction ?? 50000;
  const chapter =
    (ded.section_80c?.total ?? 0) +
    (ded.section_80d?.total ?? 0) +
    (ded.nps_80ccd_1b ?? 0) +
    (ded.home_loan_interest_24b ?? 0) +
    (ded.education_loan_80e ?? 0) +
    (ded.donations_80g ?? 0) +
    (ded.savings_interest_80tta ?? 0) +
    (ded.hra_exemption ?? 0);

  const oldTaxable = Math.max(0, gross - stdOld - prof + other + stcg + ltcg * 0.625 - chapter);
  const oldTotal = taxOldRegimeSlabs(oldTaxable);

  const stdNew = 75000;
  const newTaxable = Math.max(0, gross - stdNew - prof + other + stcg + ltcg * 0.625);
  const newTotal = taxNewRegimeSlabs(newTaxable);

  const recommended_regime: "old" | "new" = oldTotal <= newTotal ? "old" : "new";
  const savings = Math.abs(oldTotal - newTotal);

  const missed: TaxAnalysisResult["missed_deductions"] = [];
  const c80 = ded.section_80c?.total ?? 0;
  if (c80 < 150000 && recommended_regime === "old") {
    missed.push({
      section: "80C",
      description: `You are using ₹${c80.toLocaleString("en-IN")} of ₹1.5L 80C limit.`,
      potential_saving: Math.round((150000 - c80) * 0.2 * 1.04),
      investment_suggestion: "Top up ELSS/PPF/NPS tier-2 mix based on lock-in comfort.",
    });
  }
  const d80 = ded.section_80d?.total ?? 0;
  if (d80 < 25000) {
    missed.push({
      section: "80D",
      description: "Health insurance premiums often under-used vs family needs.",
      potential_saving: 8000,
      investment_suggestion: "Family floater + preventive check-up within 80D limits.",
    });
  }
  if ((ded.nps_80ccd_1b ?? 0) < 50000 && recommended_regime === "old") {
    missed.push({
      section: "80CCD(1B)",
      description: "Additional NPS ₹50k deduction unused.",
      potential_saving: 6000,
      investment_suggestion: "Voluntary NPS Tier-1 ₹50k for extra deduction (lock-in to 60).",
    });
  }

  const tax_saving_investments = [
    {
      instrument: "ELSS",
      section: "80C",
      amount: 150000,
      risk_level: "moderate-high",
      lock_in_years: 3,
      liquidity: "low",
      expected_returns: "market-linked",
    },
    {
      instrument: "PPF",
      section: "80C",
      amount: 150000,
      risk_level: "low",
      lock_in_years: 15,
      liquidity: "very low",
      expected_returns: "~7-8% indicative",
    },
    {
      instrument: "NPS Tier-1",
      section: "80CCD(1B)",
      amount: 50000,
      risk_level: "moderate",
      lock_in_years: 60 - 30,
      liquidity: "retirement",
      expected_returns: "market-linked",
    },
  ];

  const ai_summary =
    `Old regime tax ~₹${oldTotal.toLocaleString("en-IN")} (taxable ~₹${Math.round(oldTaxable).toLocaleString("en-IN")}) vs new ~₹${newTotal.toLocaleString("en-IN")} (taxable ~₹${Math.round(newTaxable).toLocaleString("en-IN")}). ` +
    `For your inputs, the ${recommended_regime} regime looks lower. Verify with a CA before filing — slabs and rebates change.`;

  return {
    financial_year: payload.financial_year,
    regime_comparison: {
      old_regime: {
        taxable_income: Math.round(oldTaxable),
        tax_payable: Math.round(oldTotal / (1 + CESS)),
        cess: Math.round(oldTotal - oldTotal / (1 + CESS)),
        total_tax: oldTotal,
      },
      new_regime: {
        taxable_income: Math.round(newTaxable),
        tax_payable: Math.round(newTotal / (1 + CESS)),
        cess: Math.round(newTotal - newTotal / (1 + CESS)),
        total_tax: newTotal,
      },
      recommended_regime,
      savings,
    },
    missed_deductions: missed,
    tax_saving_investments,
    ai_summary,
  };
}
