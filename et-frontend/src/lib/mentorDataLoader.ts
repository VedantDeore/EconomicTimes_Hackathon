import { supabase } from "@/lib/supabase";
import {
  getLatestHealthScore,
  getLatestTaxAnalysis,
  getLatestFirePlan,
} from "@/lib/supabaseHistory";

export interface MentorContext {
  profile: {
    full_name: string | null;
    age: number | null;
    city: string | null;
    is_metro: boolean;
    marital_status: string;
    dependents: number;
    risk_profile: string;
    employment_type: string;
    tax_regime: string;
  } | null;
  income: {
    gross_salary: number;
    basic_salary: number;
    hra_received: number;
    other_income: number;
    monthly_expenses: number;
    rent_paid: number;
    expense_breakdown: Record<string, number>;
  } | null;
  investments: Array<{
    type: string;
    name: string;
    current_value: number;
    invested_amount: number;
    monthly_sip: number;
  }>;
  insurance: Array<{
    type: string;
    cover_amount: number;
    premium_annual: number;
    provider: string | null;
  }>;
  debts: Array<{
    type: string;
    outstanding_amount: number;
    emi_monthly: number;
    interest_rate: number;
    remaining_months: number | null;
  }>;
  goals: Array<{
    name: string;
    category: string;
    target_amount: number;
    target_date: string;
    current_savings: number;
    monthly_sip: number;
  }>;
  health_score: {
    overall_score: number;
    recommendations: Record<string, unknown>;
    calculated_at: string;
  } | null;
  tax_analysis: {
    recommended_regime: string;
    old_regime_tax: number;
    new_regime_tax: number;
    savings_potential: number;
    missed_deductions: unknown[];
    analyzed_at: string;
  } | null;
  fire_plan: {
    fire_number: number;
    years_to_fire: number;
    monthly_sip_required: number;
    success_probability: number;
  } | null;
  mf_portfolio: {
    total_invested: number;
    current_value: number;
    xirr: number;
    holdings_count: number;
  } | null;
  computed: {
    net_worth: number;
    total_investments: number;
    total_debt: number;
    monthly_surplus: number;
    life_cover_gap: number;
    health_cover_adequate: boolean;
  };
}

async function getUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function loadFullMentorContext(): Promise<MentorContext | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const [
    profileRes,
    incomeRes,
    investmentsRes,
    insuranceRes,
    debtsRes,
    goalsRes,
    healthScore,
    taxAnalysis,
    firePlan,
    mfRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("income").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("investments").select("*").eq("user_id", userId),
    supabase.from("insurance").select("*").eq("user_id", userId),
    supabase.from("debts").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    getLatestHealthScore(),
    getLatestTaxAnalysis(),
    getLatestFirePlan(),
    supabase
      .from("mf_portfolios")
      .select("*")
      .eq("user_id", userId)
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  const income = incomeRes.data;
  const investments = investmentsRes.data ?? [];
  const insurance = insuranceRes.data ?? [];
  const debts = debtsRes.data ?? [];
  const goals = goalsRes.data ?? [];
  const mfPortfolio = mfRes.data;

  const totalInvestments = investments.reduce(
    (s, i) => s + (Number(i.current_value) || 0),
    0
  );
  const totalDebt = debts.reduce(
    (s, d) => s + (Number(d.outstanding_amount) || 0),
    0
  );
  const grossSalary = Number(income?.gross_salary) || 0;
  const monthlyExpenses = Number(income?.monthly_expenses) || 0;
  const monthlySurplus =
    grossSalary > 0 ? grossSalary / 12 - monthlyExpenses : 0;

  const lifeCover = insurance
    .filter((i) => String(i.type).toLowerCase() === "life")
    .reduce((s, i) => s + (Number(i.cover_amount) || 0), 0);
  const idealLifeCover = grossSalary * 10;
  const lifeCoverGap =
    idealLifeCover > 0 ? Math.max(0, idealLifeCover - lifeCover) : 0;

  const healthCover = insurance
    .filter((i) => String(i.type).toLowerCase() === "health")
    .reduce((s, i) => s + (Number(i.cover_amount) || 0), 0);

  return {
    profile: profile
      ? {
          full_name: profile.full_name,
          age: profile.age,
          city: profile.city,
          is_metro: profile.is_metro ?? false,
          marital_status: profile.marital_status ?? "single",
          dependents: profile.dependents ?? 0,
          risk_profile: profile.risk_profile ?? "moderate",
          employment_type: profile.employment_type ?? "salaried",
          tax_regime: profile.tax_regime ?? "new",
        }
      : null,
    income: income
      ? {
          gross_salary: Number(income.gross_salary) || 0,
          basic_salary: Number(income.basic_salary) || 0,
          hra_received: Number(income.hra_received) || 0,
          other_income: Number(income.other_income) || 0,
          monthly_expenses: Number(income.monthly_expenses) || 0,
          rent_paid: Number(income.rent_paid) || 0,
          expense_breakdown:
            (income.expense_breakdown as Record<string, number>) || {},
        }
      : null,
    investments: investments.map((i) => ({
      type: i.type ?? "other",
      name: i.name ?? i.type ?? "Unknown",
      current_value: Number(i.current_value) || 0,
      invested_amount: Number(i.invested_amount) || 0,
      monthly_sip: Number(i.monthly_sip) || 0,
    })),
    insurance: insurance.map((i) => ({
      type: i.type ?? "other",
      cover_amount: Number(i.cover_amount) || 0,
      premium_annual: Number(i.premium_annual) || 0,
      provider: i.provider ?? null,
    })),
    debts: debts.map((d) => ({
      type: d.type ?? "loan",
      outstanding_amount: Number(d.outstanding_amount) || 0,
      emi_monthly: Number(d.emi_monthly) || 0,
      interest_rate: Number(d.interest_rate) || 0,
      remaining_months: d.remaining_months ?? null,
    })),
    goals: goals.map((g) => ({
      name: g.name ?? "Goal",
      category: g.category ?? "general",
      target_amount: Number(g.target_amount) || 0,
      target_date: g.target_date ?? "",
      current_savings: Number(g.current_savings) || 0,
      monthly_sip: Number(g.monthly_sip) || 0,
    })),
    health_score: healthScore
      ? {
          overall_score: Number(healthScore.overall_score) || 0,
          recommendations:
            (healthScore.recommendations as Record<string, unknown>) || {},
          calculated_at: healthScore.calculated_at,
        }
      : null,
    tax_analysis: taxAnalysis
      ? {
          recommended_regime: taxAnalysis.recommended_regime ?? "new",
          old_regime_tax: Number(taxAnalysis.old_regime_tax) || 0,
          new_regime_tax: Number(taxAnalysis.new_regime_tax) || 0,
          savings_potential: Number(taxAnalysis.savings_potential) || 0,
          missed_deductions:
            (taxAnalysis.missed_deductions as unknown[]) || [],
          analyzed_at: taxAnalysis.analyzed_at,
        }
      : null,
    fire_plan: firePlan
      ? {
          fire_number: Number(firePlan.fire_number) || 0,
          years_to_fire: Number(firePlan.years_to_fire) || 0,
          monthly_sip_required: Number(firePlan.monthly_sip_required) || 0,
          success_probability: Number(firePlan.success_probability) || 0,
        }
      : null,
    mf_portfolio: mfPortfolio
      ? {
          total_invested: Number(mfPortfolio.total_invested) || 0,
          current_value: Number(mfPortfolio.current_value) || 0,
          xirr: Number(mfPortfolio.xirr) || 0,
          holdings_count: Array.isArray(mfPortfolio.holdings)
            ? mfPortfolio.holdings.length
            : 0,
        }
      : null,
    computed: {
      net_worth: totalInvestments - totalDebt,
      total_investments: totalInvestments,
      total_debt: totalDebt,
      monthly_surplus: Math.round(monthlySurplus),
      life_cover_gap: lifeCoverGap,
      health_cover_adequate: healthCover >= 500000,
    },
  };
}
