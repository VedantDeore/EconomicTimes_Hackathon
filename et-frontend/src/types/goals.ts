export interface Goal {
  id: string;
  user_id: string;
  name: string;
  category: "retirement" | "home" | "education" | "wedding" | "car" | "travel" | "emergency" | "custom";
  target_amount: number;
  current_savings: number;
  target_date: string;
  priority: "high" | "medium" | "low";
  inflation_adjusted: boolean;
  inflation_rate: number;
  sip_required: number;
  recommended_asset_allocation: {
    equity: number;
    debt: number;
    gold: number;
    cash: number;
  };
  status: "active" | "achieved" | "paused" | "cancelled";
  monthly_roadmap: Array<{
    month: string;
    sip_amount: number;
    cumulative: number;
    projected_value: number;
  }>;
}

export interface FirePlan {
  fire_number: number;
  years_to_fire: number;
  monthly_sip_needed: number;
  goals: Goal[];
  asset_allocation: { equity: number; debt: number; gold: number; cash: number };
  insurance_gaps: Array<{ type: string; gap: string; recommendation: string }>;
  tax_saving_moves: Array<{ section: string; action: string; saving: string }>;
  emergency_fund_target: number;
  ai_summary: string;
}

export interface MoneyHealthScore {
  overall_score: number;
  dimensions: {
    emergency_preparedness: DimensionScore;
    insurance_coverage: DimensionScore;
    investment_diversification: DimensionScore;
    debt_health: DimensionScore;
    tax_efficiency: DimensionScore;
    retirement_readiness: DimensionScore;
  };
  ai_summary: string;
  top_3_actions: Array<{
    priority: number;
    action: string;
    impact: "high" | "medium" | "low";
    category: string;
  }>;
}

export interface DimensionScore {
  score: number;
  status: "excellent" | "good" | "needs_improvement" | "critical";
  details: string;
  actions: string[];
}

export interface LifeEvent {
  id: string;
  user_id: string;
  event_type: string;
  event_date: string;
  event_data: { amount?: number; description?: string };
  ai_advice?: {
    summary: string;
    tax_implications: string;
    investment_recommendations: Array<{
      instrument: string;
      amount: number;
      reason: string;
      urgency: string;
    }>;
    action_checklist: Array<{
      item: string;
      completed: boolean;
      deadline?: string;
    }>;
  };
}

export interface TaxAnalysis {
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
}
