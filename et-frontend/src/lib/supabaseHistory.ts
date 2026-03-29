import { supabase } from "@/lib/supabase";

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export async function saveTaxAnalysis(result: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  const rc = result.regime_comparison as Record<string, unknown> | undefined;
  await supabase.from("tax_analyses").insert({
    user_id: userId,
    financial_year: (result.financial_year as string) || "2025-26",
    old_regime_tax: (rc?.old_regime as Record<string, number>)?.total_tax || 0,
    new_regime_tax: (rc?.new_regime as Record<string, number>)?.total_tax || 0,
    recommended_regime: (rc?.recommended_regime as string) || "new",
    missed_deductions: result.missed_deductions || [],
    savings_potential: (rc?.savings as number) || 0,
    full_result: result,
  });
}

export async function getTaxHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("tax_analyses")
    .select("*").eq("user_id", userId)
    .order("analyzed_at", { ascending: false }).limit(10);
  return data || [];
}

export async function saveHealthScore(report: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("health_scores").insert({
    user_id: userId,
    overall_score: report.overall_score,
    recommendations: report.dimensions || {},
  });
}

export async function getHealthHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("health_scores")
    .select("*").eq("user_id", userId)
    .order("calculated_at", { ascending: false }).limit(10);
  return data || [];
}

export async function saveFirePlan(plan: Record<string, unknown>, inputParams: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("fire_plans").insert({
    user_id: userId,
    fire_number: plan.fire_number,
    years_to_fire: plan.years_to_fire,
    monthly_sip_required: plan.monthly_sip_total || plan.monthly_sip_needed,
    success_probability: plan.success_probability || 0,
    allocation: plan.asset_allocation || {},
    glide_path: plan.glide_path_yearly || [],
    input_params: inputParams,
  });
}

export async function getFireHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("fire_plans")
    .select("*").eq("user_id", userId)
    .order("generated_at", { ascending: false }).limit(10);
  return data || [];
}

export async function saveMfPortfolio(analysis: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  const summary = (analysis.portfolio_summary || analysis) as Record<string, unknown>;
  await supabase.from("mf_portfolios").insert({
    user_id: userId,
    total_invested: summary.total_invested ?? (analysis as Record<string, unknown>).totalInvested ?? 0,
    current_value: summary.total_current_value ?? (analysis as Record<string, unknown>).totalCurrent ?? 0,
    xirr: summary.overall_xirr ?? (analysis as Record<string, unknown>).portfolioXirr ?? 0,
    holdings: analysis.holdings || (analysis as Record<string, unknown>).perFund || [],
    overlap_matrix: analysis.overlap_matrix || (analysis as Record<string, unknown>).overlapMatrix || [],
    rebalancing_plan: analysis.rebalancing_suggestions || (analysis as Record<string, unknown>).rebalance || {},
  });
}

export async function getMfHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("mf_portfolios")
    .select("*").eq("user_id", userId)
    .order("analyzed_at", { ascending: false }).limit(10);
  return data || [];
}

/* ---------- Life Events ---------- */

export async function saveLifeEvent(input: Record<string, unknown>, advice: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("life_events").insert({
    user_id: userId,
    event_type: input.event_type || "other",
    event_date: input.event_date || new Date().toISOString(),
    amount: input.amount || 0,
    description: input.description || "",
    advice,
  });
}

export async function getLifeEventHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("life_events")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: false }).limit(10);
  return data || [];
}

export async function saveChatMessage(role: string, content: string, toolUsed?: string, toolResult?: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase.from("chat_messages").insert({
    user_id: userId,
    role,
    content,
    tool_used: toolUsed || null,
    tool_result: toolResult || null,
  });
}

/* ---------- Couple Plans (uses existing `couples` table) ---------- */

export async function saveCouplePlan(result: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return;
  const tax = result.tax as Record<string, unknown> | undefined;
  const { error } = await supabase.from("couples").insert({
    partner_a: userId,
    status: "analyzed",
    optimization_results: result,
    combined_net_worth: (tax?.combined_net_worth as number) ?? 0,
  });
  if (error) throw error;
}

export async function getCouplePlanHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("couples")
    .select("*")
    .eq("partner_a", userId)
    .eq("status", "analyzed")
    .order("created_at", { ascending: false })
    .limit(10);
  return data || [];
}

export async function getLatestCouplePlan() {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("couples")
    .select("*")
    .eq("partner_a", userId)
    .eq("status", "analyzed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getChatHistory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("chat_messages")
    .select("*").eq("user_id", userId)
    .order("created_at", { ascending: true }).limit(100);
  return data || [];
}

export async function getLatestHealthScore() {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("health_scores")
    .select("*").eq("user_id", userId)
    .order("calculated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function getLatestTaxAnalysis() {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("tax_analyses")
    .select("*").eq("user_id", userId)
    .order("analyzed_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function getLatestFirePlan() {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("fire_plans")
    .select("*").eq("user_id", userId)
    .order("generated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}
