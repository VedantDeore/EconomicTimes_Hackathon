/** Loose shape from API or local JSON */
export type ProfileLike = {
  emergency_fund?: { months_covered?: number; current_amount?: number };
  existing_investments?: Record<string, number>;
  debts?: Array<{ emi?: number; principal?: number; outstanding?: number; type?: string }>;
  insurance?: {
    life?: { has_cover?: boolean; sum_assured?: number; term_cover?: number };
    health?: { has_cover?: boolean; family_floater?: boolean; self_cover?: boolean };
  };
  annual_income?: { net?: number; gross?: number };
  monthly_expenses?: Record<string, number>;
  tax_regime?: string;
} | null;

export interface HealthInputs {
  emergency_months: number;
  has_term_insurance: boolean;
  health_insurance_ok: boolean;
  investment_types_count: number;
  debt_to_income_pct: number;
  uses_80c: boolean;
  retirement_savings_rate_pct: number;
}

const defaultInputs: HealthInputs = {
  emergency_months: 2,
  has_term_insurance: false,
  health_insurance_ok: true,
  investment_types_count: 2,
  debt_to_income_pct: 35,
  uses_80c: true,
  retirement_savings_rate_pct: 12,
};

export function profileToHealthInputs(profile: ProfileLike): HealthInputs {
  if (!profile) return { ...defaultInputs };

  /* --- Emergency months: prefer months_covered, else compute from amount/expenses --- */
  let months = profile.emergency_fund?.months_covered ?? 0;
  if (months <= 0) {
    const efAmt = profile.emergency_fund?.current_amount ?? 0;
    const expTotal = profile.monthly_expenses?.total ?? 0;
    if (efAmt > 0 && expTotal > 0) {
      months = Math.round((efAmt / expTotal) * 10) / 10;
    } else if (efAmt > 0) {
      // If we know the amount but not expenses, estimate ~3 months as baseline
      months = 3;
    } else {
      months = defaultInputs.emergency_months;
    }
  }

  const inv = profile.existing_investments || {};
  const investment_types_count = Math.max(1, Object.keys(inv).filter((k) => (inv[k] ?? 0) > 0).length);

  const grossAnnual = profile.annual_income?.gross || 0;
  const netAnnual = profile.annual_income?.net || grossAnnual;
  const debtTotal = (profile.debts || []).reduce((s, d) => {
    const fromEmi = (Number(d.emi) || 0) * 12;
    const fromOut = Number(d.outstanding) || 0;
    const v = fromEmi > 0 ? fromEmi : fromOut > 0 ? fromOut * 0.15 : 0;
    return s + (Number.isFinite(v) ? v : 0);
  }, 0);
  const debt_to_income_pct = netAnnual > 0
    ? Math.min(100, Math.round((debtTotal / netAnnual) * 100))
    : (debtTotal > 0 ? 50 : defaultInputs.debt_to_income_pct);

  const life = profile.insurance?.life || {};
  const has_term_insurance = Boolean(
    life.has_cover || (life.sum_assured && Number(life.sum_assured) > 0) || (life.term_cover && Number(life.term_cover) > 0)
  );

  const hi = profile.insurance?.health || {};
  const health_insurance_ok = Boolean(hi.has_cover || hi.family_floater || hi.self_cover);

  const expTotal = profile.monthly_expenses?.total ?? 0;
  const annualExpenses = expTotal > 0 ? expTotal * 12 : 0;
  let savingsRate = defaultInputs.retirement_savings_rate_pct;
  if (netAnnual > 0 && annualExpenses > 0 && annualExpenses < netAnnual) {
    savingsRate = Math.min(50, Math.max(0, Math.round(((netAnnual - annualExpenses) / netAnnual) * 100)));
  }

  return {
    emergency_months: Math.min(12, Math.max(0, months)),
    has_term_insurance,
    health_insurance_ok,
    investment_types_count,
    debt_to_income_pct,
    uses_80c: profile.tax_regime === "old",
    retirement_savings_rate_pct: savingsRate,
  };
}

export function mergeHealthInputs(
  base: HealthInputs,
  partial: Partial<HealthInputs>
): HealthInputs {
  return { ...base, ...partial };
}

export interface DimensionData {
  score: number;
  status: string;
  details: string;
  actions: string[];
}

export interface HealthReport {
  overall_score: number;
  dimensions: Record<string, DimensionData>;
  ai_summary: string;
  top_3_actions: Array<{ priority: number; action: string; impact: string; category: string }>;
}

export function computeHealthReport(inputs: HealthInputs): HealthReport {
  const emergency = Math.min(100, Math.round((inputs.emergency_months / 6) * 100));
  const insuranceLife = inputs.has_term_insurance ? 78 : 38;
  const insuranceHealth = inputs.health_insurance_ok ? 72 : 40;
  const insurance = Math.round((insuranceLife + insuranceHealth) / 2);

  const diversification = Math.min(100, inputs.investment_types_count * 18 + 28);
  const debt = Math.max(0, 100 - Math.min(100, inputs.debt_to_income_pct * 2));
  const tax_eff = inputs.uses_80c ? 68 : 52;
  const retirement = Math.min(100, inputs.retirement_savings_rate_pct * 4);

  const dimensions: Record<string, DimensionData> = {
    emergency: {
      score: emergency,
      status: emergency >= 70 ? "Strong" : emergency >= 40 ? "Building" : "Weak",
      details:
        inputs.emergency_months >= 6
          ? "You are near the 6-month emergency fund guideline."
          : `Aim for 6 months of expenses in liquid assets (currently ~${inputs.emergency_months} months).`,
      actions:
        inputs.emergency_months < 6
          ? ["Park 3–6 months expenses in FD/liquid funds.", "Avoid investing lump sums until buffer is set."]
          : ["Revisit buffer yearly as expenses change."],
    },
    debt: {
      score: debt,
      status: debt >= 70 ? "Healthy" : debt >= 45 ? "OK" : "Stress",
      details:
        inputs.debt_to_income_pct <= 40
          ? "Debt load looks manageable vs income."
          : "High EMI burden — prioritize high-interest debt.",
      actions:
        inputs.debt_to_income_pct > 40
          ? ["List loans by interest rate; prepay costliest first.", "Avoid new consumer debt until ratio improves."]
          : ["Keep one low-cost home loan if tax-efficient; avoid revolving credit."],
    },
    insurance: {
      score: insurance,
      status: insurance >= 70 ? "Adequate" : "Gaps",
      details: inputs.has_term_insurance
        ? "Term cover appears considered; review sum assured vs liabilities."
        : "Term life cover is the core protection for dependents.",
      actions: inputs.has_term_insurance
        ? ["Review cover every 2–3 years or on major life events."]
        : ["Buy pure term insurance for income replacement.", "Keep health floater with adequate sum insured."],
    },
    investments: {
      score: diversification,
      status: diversification >= 65 ? "Diversified" : "Concentrated",
      details:
        inputs.investment_types_count >= 4
          ? "You use multiple buckets — good for diversification."
          : "Add equity (index/ELSS), debt, and gold international if missing.",
      actions: ["Use low-cost index funds for core equity.", "Rebalance once a year."],
    },
    tax_efficiency: {
      score: tax_eff,
      status: tax_eff >= 65 ? "Decent" : "Improve",
      details: inputs.uses_80c
        ? "You likely use some 80C/80D; compare old vs new regime yearly."
        : "New regime users should still optimize NPS 80CCD(1B) and employer benefits.",
      actions: ["Run Tax Wizard for regime comparison.", "Use NPS 80CCD(1B) if it fits liquidity."],
    },
    savings: {
      score: retirement,
      status: retirement >= 60 ? "On track" : "Low",
      details: `Retirement readiness proxy from savings rate (~${inputs.retirement_savings_rate_pct}% of income).`,
      actions: ["Automate SIPs on salary day.", "Increase SIP ~10% yearly."],
    },
  };

  const keys = Object.keys(dimensions);
  const overall_score = Math.round(keys.reduce((s, k) => s + dimensions[k].score, 0) / keys.length);

  const flat = keys.flatMap((k) =>
    dimensions[k].actions.map((a) => ({
      priority: 100 - dimensions[k].score,
      action: a,
      impact: dimensions[k].score < 50 ? "high" : "medium",
      category: k,
    }))
  );
  flat.sort((a, b) => b.priority - a.priority);
  const top_3_actions = flat.slice(0, 3).map((x, i) => ({ ...x, priority: i + 1 }));

  const ai_summary = `Overall wellness is ${overall_score}/100. Strongest levers: ${
    keys.sort((a, b) => dimensions[a].score - dimensions[b].score)[0]
  } (lowest dimension). This score is indicative only — not financial advice.`;

  return { overall_score, dimensions, ai_summary, top_3_actions };
}
