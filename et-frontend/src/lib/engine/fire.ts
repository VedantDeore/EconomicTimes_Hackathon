export interface FireGoalInput {
  name: string;
  category: string;
  target_amount: number;
  current_savings: number;
  target_date: string;
  priority: string;
}

export interface FirePlanInput {
  age: number;
  retirement_age: number;
  monthly_income: number;
  monthly_expenses: number;
  existing_corpus: number;
  expected_return_rate: number;
  inflation_rate: number;
  goals: FireGoalInput[];
}

export interface FirePlanResult {
  fire_number: number;
  years_to_fire: number;
  monthly_sip_needed: number;
  asset_allocation: Record<string, number>;
  insurance_gaps: Array<Record<string, string>>;
  tax_saving_moves: Array<Record<string, string>>;
  emergency_fund_target: number;
  ai_summary: string;
  goals: Array<{
    name: string;
    category: string;
    target_amount: number;
    current_savings: number;
    target_date: string;
    priority: string;
    sip_required?: number;
    recommended_asset_allocation?: Record<string, number>;
    status?: string;
  }>;
}

function fvLumpSum(pv: number, annualRate: number, years: number): number {
  if (years <= 0) return pv;
  return pv * Math.pow(1 + annualRate / 100, years);
}

function pmtForFv(fv: number, annualRate: number, years: number): number {
  if (fv <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (r < 1e-8) return fv / n;
  return (fv * r) / (Math.pow(1 + r, n) - 1);
}

function assetMixByAge(age: number): Record<string, number> {
  const equity = Math.min(70, Math.max(25, 100 - age));
  const rest = 100 - equity;
  const debt = Math.round(rest * 0.72);
  const gold = rest - debt;
  return { equity, debt, gold, cash: 0 };
}

export function computeFirePlan(input: FirePlanInput): FirePlanResult {
  const years = Math.max(0, input.retirement_age - input.age);
  const infl = input.inflation_rate / 100;
  const annualExpRetirement = input.monthly_expenses * 12 * Math.pow(1 + infl, years);
  const fireNumber = Math.round(annualExpRetirement * 25);
  const fvCurrent = fvLumpSum(input.existing_corpus, input.expected_return_rate, years);
  const shortfall = Math.max(0, fireNumber - fvCurrent);
  const monthlySip = Math.round(pmtForFv(shortfall, input.expected_return_rate, years));
  const emergencyFundTarget = Math.round(input.monthly_expenses * 6);

  const goals = input.goals.map((g) => {
    const target = new Date(g.target_date);
    const now = new Date();
    const gy = Math.max(0, (target.getTime() - now.getTime()) / (365.25 * 24 * 3600 * 1000));
    const need = Math.max(0, g.target_amount - g.current_savings);
    const sip = Math.round(pmtForFv(need, input.expected_return_rate, gy));
    return {
      ...g,
      sip_required: sip,
      recommended_asset_allocation: assetMixByAge(input.age),
      status: need <= 0 ? "on_track" : sip > 0 ? "needs_sip" : "review",
    };
  });

  const insuranceGaps: Array<Record<string, string>> = [];
  const lifeCover = input.monthly_income * 12 * 10;
  insuranceGaps.push({
    type: "term_life",
    message: `Target life cover ~₹${(lifeCover / 1e7).toFixed(1)}Cr (10× annual income) if dependents rely on you.`,
  });
  if (emergencyFundTarget > input.existing_corpus * 0.15) {
    insuranceGaps.push({
      type: "emergency",
      message: `Build emergency fund to ₹${emergencyFundTarget.toLocaleString("en-IN")} (6 months expenses) before aggressive investing.`,
    });
  }

  const taxMoves: Array<Record<string, string>> = [
    { action: "80C", detail: "Use ₹1.5L via EPF+ELSS+PPF if on old regime." },
    { action: "NPS", detail: "Extra ₹50k under 80CCD(1B) for long-term retirement tilt." },
    { action: "Health_80D", detail: "Maximize 80D for self/parents to protect wealth." },
  ];

  const surplus = input.monthly_income - input.monthly_expenses;
  const ai_summary =
    years > 0
      ? `At ${input.inflation_rate}% inflation, you need about ₹${(fireNumber / 1e7).toFixed(2)}Cr at age ${input.retirement_age} (25× annual expenses). ` +
        `Your corpus may grow to ~₹${(fvCurrent / 1e7).toFixed(2)}Cr at ${input.expected_return_rate}% — gap ₹${(shortfall / 1e7).toFixed(2)}Cr. ` +
        `A monthly SIP of ~₹${monthlySip.toLocaleString("en-IN")} bridges that if returns match assumptions. ` +
        `Monthly surplus ~₹${Math.round(surplus).toLocaleString("en-IN")}: ${surplus >= monthlySip ? "enough to fund the SIP if you prioritize it." : "raise income, cut expenses, or push FIRE age slightly."}`
      : "Retirement age is at or below current age — adjust ages to see a roadmap.";

  return {
    fire_number: fireNumber,
    years_to_fire: years,
    monthly_sip_needed: monthlySip,
    asset_allocation: assetMixByAge(input.age),
    insurance_gaps: insuranceGaps,
    tax_saving_moves: taxMoves,
    emergency_fund_target: emergencyFundTarget,
    ai_summary,
    goals,
  };
}
