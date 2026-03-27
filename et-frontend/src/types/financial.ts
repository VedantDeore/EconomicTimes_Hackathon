export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  city?: string;
  is_verified: boolean;
  avatar_url?: string;
  partner_id?: string;
}

export interface FinancialProfile {
  id: string;
  user_id: string;
  employment_type: "salaried" | "self_employed" | "freelancer" | "business";
  annual_income: { gross: number; net: number; currency: string };
  monthly_expenses: {
    rent: number;
    emi: number;
    groceries: number;
    utilities: number;
    entertainment: number;
    education: number;
    other: number;
    total: number;
  };
  salary_structure?: {
    basic: number;
    hra: number;
    da: number;
    special_allowance: number;
    lta: number;
    pf_contribution: number;
  };
  existing_investments: {
    ppf: number;
    epf: number;
    nps: number;
    elss: number;
    fd: number;
    stocks: number;
    mutual_funds: number;
    real_estate: number;
    gold: number;
    crypto: number;
    other: number;
  };
  debts: Array<{
    type: string;
    principal: number;
    outstanding: number;
    interest_rate: number;
    emi: number;
    tenure_months: number;
    remaining_months: number;
  }>;
  insurance: {
    life: { has_cover: boolean; sum_assured: number; premium: number; type?: string };
    health: { has_cover: boolean; sum_assured: number; premium: number; family_floater?: boolean };
  };
  emergency_fund: { current_amount: number; months_covered: number };
  risk_profile: "conservative" | "moderate" | "aggressive" | "very_aggressive";
  tax_regime: "old" | "new";
}
