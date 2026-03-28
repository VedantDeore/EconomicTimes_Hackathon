/**
 * Maps saved Money Profile → FIRE planner fields (investable corpus, cashflow, defaults).
 */

export type ProfileLike = {
  annual_income?: { gross?: number; net?: number };
  monthly_expenses?: Record<string, number>;
  existing_investments?: Record<string, number>;
  emergency_fund?: { current_amount?: number };
  risk_profile?: string;
} | null;

export function sumMonthlyExpenses(monthly: Record<string, number> | undefined): number {
  if (!monthly) return 0;
  const t = monthly.total;
  if (typeof t === "number" && t > 0) return t;
  return Object.entries(monthly).reduce((s, [k, v]) => {
    if (k === "total") return s;
    return s + (typeof v === "number" ? v : 0);
  }, 0);
}

/** Liquid + invested: emergency cash + all investment buckets (includes illiquid like real_estate at full value — user can edit). */
export function investableCorpusFromProfile(profile: ProfileLike): number {
  if (!profile) return 0;
  const inv = profile.existing_investments || {};
  const invSum = Object.values(inv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const cash = profile.emergency_fund?.current_amount || 0;
  return Math.round(invSum + cash);
}

export function monthlyIncomeFromProfile(profile: ProfileLike): number {
  if (!profile?.annual_income) return 0;
  const net = profile.annual_income.net;
  const gross = profile.annual_income.gross;
  if (typeof net === "number" && net > 0) return Math.round(net / 12);
  if (typeof gross === "number" && gross > 0) return Math.round(gross / 12);
  return 0;
}

export function defaultReturnFromRisk(risk: string | undefined): number {
  const r = (risk || "moderate").toLowerCase();
  if (r.includes("conservative")) return 9;
  if (r.includes("aggressive") || r.includes("very")) return 12;
  return 10;
}

export function fireDefaultsFromProfile(profile: ProfileLike): {
  existing_corpus: number;
  monthly_expenses: number;
  monthly_income: number;
  expected_return_rate: number;
} | null {
  if (!profile) return null;
  const existing_corpus = investableCorpusFromProfile(profile);
  const monthly_expenses = sumMonthlyExpenses(profile.monthly_expenses);
  const monthly_income = monthlyIncomeFromProfile(profile);
  const expected_return_rate = defaultReturnFromRisk(profile.risk_profile);
  if (existing_corpus <= 0 && monthly_expenses <= 0 && monthly_income <= 0) return null;
  return {
    existing_corpus: Math.max(0, existing_corpus),
    monthly_expenses: Math.max(0, monthly_expenses),
    monthly_income: Math.max(0, monthly_income),
    expected_return_rate,
  };
}
