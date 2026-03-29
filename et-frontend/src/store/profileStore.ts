import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import { LOCAL_KEYS, ensureLocalDataBelongsToUser } from "@/lib/localKeys";

export interface MoneyProfileWizardPayload {
  age?: number;
  city?: string;
  is_metro?: boolean;
  marital_status?: string;
  dependents?: number;
  monthly_income?: number;
  basic_salary?: number;
  hra_received?: number;
  other_income?: number;
  monthly_expenses?: number;
  rent_paid?: number;
  expense_breakdown?: Record<string, number>;
  investments?: Array<{ type: string; name: string; value: number; monthly_sip?: number }>;
  emergency_fund?: number;
  life_insurance_cover?: number;
  health_insurance_cover?: number;
  has_term_plan?: boolean;
  total_debts?: number;
  monthly_emi?: number;
  risk_profile?: string;
  retirement_age?: number;
  goals?: Array<{ name: string; category: string; target_amount: number; target_date: string }>;
  tax_regime?: string;
  professional_tax?: number;
  section_80c?: { epf: number; ppf: number; elss: number; life_insurance: number; total: number };
  section_80d?: { self_premium: number; parents_premium: number; preventive_health: number; total: number };
  nps_80ccd_1b?: number;
  home_loan_interest_24b?: number;
  education_loan_80e?: number;
  donations_80g?: number;
  savings_interest_80tta?: number;
}

export interface FinancialProfile {
  employment_type: string;
  annual_income: { gross: number; net: number };
  monthly_expenses: Record<string, number>;
  salary_structure?: Record<string, number>;
  existing_investments: Record<string, number>;
  debts: Array<Record<string, number | string>>;
  insurance: Record<string, Record<string, number | boolean>>;
  emergency_fund: { current_amount: number; months_covered: number };
  risk_profile: string;
  tax_regime: string;
  age?: number | null;
  city?: string | null;
  is_metro?: boolean | null;
  marital_status?: string | null;
  dependents?: number | null;
  retirement_age?: number | null;
  money_profile_snapshot?: Record<string, unknown> | null;
}

export function getDefaultLocalProfile(): FinancialProfile {
  return {
    employment_type: "salaried",
    annual_income: { gross: 0, net: 0 },
    monthly_expenses: {
      rent: 0, emi: 0, groceries: 0, utilities: 0,
      entertainment: 0, education: 0, other: 0, total: 0,
    },
    existing_investments: {
      ppf: 0, epf: 0, nps: 0, elss: 0, fd: 0,
      stocks: 0, mutual_funds: 0, real_estate: 0, gold: 0, crypto: 0, other: 0,
    },
    debts: [],
    insurance: {
      life: { has_cover: false, sum_assured: 0, premium: 0 },
      health: { has_cover: false, sum_assured: 0, premium: 0, family_floater: false },
    },
    emergency_fund: { current_amount: 0, months_covered: 0 },
    risk_profile: "moderate",
    tax_regime: "new",
  };
}

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

function writeLocal(profile: FinancialProfile, userId?: string | null) {
  if (typeof window === "undefined") return;
  if (userId) ensureLocalDataBelongsToUser(userId);
  const { money_profile_snapshot: _, ...rest } = profile;
  localStorage.setItem(LOCAL_KEYS.profile, JSON.stringify(rest));
}

function readLocal(userId?: string | null): FinancialProfile | null {
  if (typeof window === "undefined") return null;
  if (userId) ensureLocalDataBelongsToUser(userId);
  try {
    const raw = localStorage.getItem(LOCAL_KEYS.profile);
    return raw ? (JSON.parse(raw) as FinancialProfile) : null;
  } catch {
    return null;
  }
}

function salaryBasic(s?: Record<string, number>): number {
  return s?.basic ?? s?.basic_salary ?? 0;
}
function salaryHra(s?: Record<string, number>): number {
  return s?.hra ?? s?.hra_received ?? 0;
}
function salaryOther(s?: Record<string, number>): number {
  return s?.other_income ?? 0;
}

function mapInvType(t: string): string {
  const x = t.toLowerCase();
  if (x === "mutual_fund" || x === "mutual_funds") return "mutual_funds";
  if (["ppf", "nps", "fd", "elss", "stocks", "real_estate", "gold"].includes(x)) return x;
  return "other";
}

/* ------------------------------------------------------------------ */
/*  Sync helpers — write related tables from wizard payload            */
/* ------------------------------------------------------------------ */

async function syncIncomeTable(userId: string, full: FinancialProfile) {
  const { error } = await supabase.from("income").upsert(
    {
      user_id: userId,
      gross_salary: full.annual_income.gross,
      basic_salary: salaryBasic(full.salary_structure),
      hra_received: salaryHra(full.salary_structure),
      special_allowance: full.salary_structure?.special_allowance ?? 0,
      other_income: salaryOther(full.salary_structure),
      monthly_expenses: full.monthly_expenses?.total || 0,
      rent_paid: full.monthly_expenses?.rent || 0,
      expense_breakdown: full.monthly_expenses,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

async function syncRelatedTables(userId: string, w: MoneyProfileWizardPayload) {
  // Goals
  await supabase.from("goals").delete().eq("user_id", userId);
  const goals = w.goals ?? [];
  if (goals.length > 0) {
    await supabase.from("goals").insert(
      goals.map((g) => ({
        user_id: userId,
        name: g.name,
        category: g.category,
        target_amount: g.target_amount,
        target_date: g.target_date.slice(0, 10),
      })),
    );
  }

  // Investments
  await supabase.from("investments").delete().eq("user_id", userId);
  const invs = w.investments ?? [];
  if (invs.length > 0) {
    await supabase.from("investments").insert(
      invs.map((i) => ({
        user_id: userId,
        type: i.type,
        name: i.name || i.type,
        current_value: i.value,
        invested_amount: i.value,
        monthly_sip: i.monthly_sip ?? 0,
      })),
    );
  }

  // Debts
  await supabase.from("debts").delete().eq("user_id", userId);
  if ((w.total_debts ?? 0) > 0 || (w.monthly_emi ?? 0) > 0) {
    await supabase.from("debts").insert({
      user_id: userId,
      type: "aggregate",
      outstanding_amount: w.total_debts ?? 0,
      emi_monthly: w.monthly_emi ?? 0,
    });
  }

  // Insurance
  await supabase.from("insurance").delete().eq("user_id", userId);
  const insRows: Record<string, unknown>[] = [];
  if ((w.life_insurance_cover ?? 0) > 0 || w.has_term_plan) {
    insRows.push({ user_id: userId, type: "life", cover_amount: w.life_insurance_cover ?? 0, premium_annual: 0 });
  }
  if ((w.health_insurance_cover ?? 0) > 0) {
    insRows.push({ user_id: userId, type: "health", cover_amount: w.health_insurance_cover ?? 0, premium_annual: 0 });
  }
  if (insRows.length > 0) {
    await supabase.from("insurance").insert(insRows);
  }
}

/* ------------------------------------------------------------------ */
/*  Read helpers — fetch related tables back                           */
/* ------------------------------------------------------------------ */

async function readInvestmentsAgg(userId: string): Promise<FinancialProfile["existing_investments"]> {
  const base = getDefaultLocalProfile().existing_investments;
  const { data } = await supabase.from("investments").select("type,current_value").eq("user_id", userId);
  if (!data?.length) return base;
  const out = { ...base };
  for (const r of data) {
    const k = mapInvType(String(r.type || "other"));
    (out as Record<string, number>)[k] = ((out as Record<string, number>)[k] || 0) + (Number(r.current_value) || 0);
  }
  return out;
}

async function readDebts(userId: string): Promise<FinancialProfile["debts"]> {
  const { data } = await supabase.from("debts").select("*").eq("user_id", userId);
  if (!data?.length) return [];
  return data.map((d) => ({ type: d.type || "loan", outstanding: d.outstanding_amount ?? 0, emi: d.emi_monthly ?? 0 }));
}

async function readInsurance(userId: string): Promise<FinancialProfile["insurance"]> {
  const def = getDefaultLocalProfile().insurance;
  const { data } = await supabase.from("insurance").select("*").eq("user_id", userId);
  if (!data?.length) return def;
  let life = { ...def.life };
  let health = { ...def.health };
  for (const r of data) {
    if (String(r.type).toLowerCase() === "life") life = { ...life, has_cover: (r.cover_amount ?? 0) > 0, sum_assured: r.cover_amount ?? 0 };
    if (String(r.type).toLowerCase() === "health") health = { ...health, has_cover: (r.cover_amount ?? 0) > 0, sum_assured: r.cover_amount ?? 0 };
  }
  return { life, health };
}

/* ------------------------------------------------------------------ */
/*  Zustand store                                                      */
/* ------------------------------------------------------------------ */

interface ProfileState {
  profile: FinancialProfile | null;
  isLoading: boolean;
  lastSyncedAt: string | null;
  dbConnected: boolean;
  fetchProfile: () => Promise<void>;
  saveProfile: (data: Partial<FinancialProfile>) => Promise<void>;
  saveFullProfile: (full: FinancialProfile, moneyWizard?: MoneyProfileWizardPayload) => Promise<void>;
  patchMoneyProfile: (patch: Partial<MoneyProfileWizardPayload>) => Promise<void>;
  resetProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  isLoading: false,
  lastSyncedAt: null,
  dbConnected: false,

  /* ---- FETCH ---- */
  fetchProfile: async () => {
    set({ isLoading: true });
    const userId = await getUserId();

    if (userId) {
      ensureLocalDataBelongsToUser(userId);
      try {
        const { data: row } = await supabase
          .from("profiles").select("*").eq("id", userId).maybeSingle();

        const { data: incomeRow } = await supabase
          .from("income").select("*").eq("user_id", userId).maybeSingle();

        const mp = (row as Record<string, unknown> | null)?.money_profile as Record<string, unknown> | null | undefined;
        const hasMP = mp && typeof mp === "object" && Object.keys(mp).length > 0;

        const [invAgg, debtsDb, insDb] = await Promise.all([
          readInvestmentsAgg(userId), readDebts(userId), readInsurance(userId),
        ]);

        const gross = incomeRow?.gross_salary || 0;
        const eb = (incomeRow?.expense_breakdown as Record<string, number> | null) || getDefaultLocalProfile().monthly_expenses;

        const profile: FinancialProfile = {
          employment_type: row?.employment_type || "salaried",
          annual_income: { gross, net: gross > 0 ? Math.round(gross * 0.9) : 0 },
          monthly_expenses: eb,
          salary_structure: {
            basic: incomeRow?.basic_salary || 0,
            hra: incomeRow?.hra_received || 0,
            special_allowance: incomeRow?.special_allowance || 0,
            other_income: incomeRow?.other_income || 0,
          },
          existing_investments: invAgg,
          debts: debtsDb,
          insurance: insDb,
          emergency_fund: {
            current_amount: typeof mp?.emergency_fund === "number" ? mp.emergency_fund : 0,
            months_covered: 0,
          },
          risk_profile: row?.risk_profile || "moderate",
          tax_regime: row?.tax_regime || "new",
          age: row?.age ?? null,
          city: row?.city ?? null,
          is_metro: row?.is_metro ?? null,
          marital_status: row?.marital_status ?? null,
          dependents: row?.dependents ?? null,
          retirement_age: typeof mp?.retirement_age === "number" ? mp.retirement_age : null,
          money_profile_snapshot: hasMP ? mp : null,
        };

        if (profile.monthly_expenses?.total > 0 && profile.emergency_fund.current_amount > 0) {
          profile.emergency_fund.months_covered =
            Math.round((profile.emergency_fund.current_amount / profile.monthly_expenses.total) * 10) / 10;
        }

        writeLocal(profile, userId);
        set({
          profile,
          isLoading: false, dbConnected: true, lastSyncedAt: new Date().toISOString(),
        });
        return;
      } catch {
        /* Supabase unavailable — fall through to localStorage */
      }
    }

    const local = userId ? readLocal(userId) : null;
    set({ profile: local, isLoading: false, dbConnected: false });
  },

  /* ---- PARTIAL SAVE (used by other pages) ---- */
  saveProfile: async (data) => {
    set({ isLoading: true });
    const userId = await getUserId();
    const merged: FinancialProfile = { ...(get().profile || getDefaultLocalProfile()), ...data };
    writeLocal(merged, userId);
    set({ profile: merged });

    if (!userId) { set({ isLoading: false, dbConnected: false }); return; }

    try {
      await supabase.from("profiles").upsert({
        id: userId,
        employment_type: merged.employment_type,
        risk_profile: merged.risk_profile,
        tax_regime: merged.tax_regime,
        age: merged.age ?? null,
        city: merged.city ?? null,
        is_metro: merged.is_metro ?? false,
        marital_status: merged.marital_status ?? "single",
        dependents: merged.dependents ?? 0,
        updated_at: new Date().toISOString(),
      });

      await syncIncomeTable(userId, merged);
      set({ isLoading: false, dbConnected: true, lastSyncedAt: new Date().toISOString() });
    } catch {
      set({ isLoading: false, dbConnected: false });
    }
  },

  /* ---- FULL SAVE (from Money Profile wizard) ---- */
  saveFullProfile: async (full, moneyWizard) => {
    set({ isLoading: true });
    const userId = await getUserId();
    const snap: FinancialProfile = moneyWizard
      ? { ...full, money_profile_snapshot: moneyWizard as unknown as Record<string, unknown> }
      : full;
    writeLocal(snap, userId);
    set({ profile: snap });
    if (!userId) {
      set({ isLoading: false, dbConnected: false });
      throw new Error("Login karein pehle — profile cloud mein save karne ke liye login zaroori hai.");
    }

    const now = new Date().toISOString();
    const errors: string[] = [];

    // ---- 1. PROFILES table ----
    const profileRow: Record<string, unknown> = {
      id: userId,
      employment_type: full.employment_type,
      risk_profile: full.risk_profile,
      tax_regime: full.tax_regime,
      age: (moneyWizard?.age ?? full.age) || null,
      city: (moneyWizard?.city?.trim() || full.city) || null,
      is_metro: moneyWizard?.is_metro ?? full.is_metro ?? false,
      marital_status: moneyWizard?.marital_status || full.marital_status || "single",
      dependents: moneyWizard?.dependents ?? full.dependents ?? 0,
      updated_at: now,
    };

    // Try with money_profile JSONB; if column missing, retry without
    if (moneyWizard) {
      const { error } = await supabase.from("profiles").upsert({
        ...profileRow,
        money_profile: moneyWizard as unknown as Record<string, unknown>,
      });
      if (error) {
        const { error: e2 } = await supabase.from("profiles").upsert(profileRow);
        if (e2) errors.push("profiles: " + e2.message);
      }
    } else {
      const { error } = await supabase.from("profiles").upsert(profileRow);
      if (error) errors.push("profiles: " + error.message);
    }

    // ---- 2. INCOME table ----
    try {
      await syncIncomeTable(userId, full);
    } catch (e) {
      errors.push("income: " + (e instanceof Error ? e.message : String(e)));
    }

    // ---- 3. GOALS, INVESTMENTS, DEBTS, INSURANCE ----
    if (moneyWizard) {
      try { await syncRelatedTables(userId, moneyWizard); }
      catch (e) { errors.push("related: " + (e instanceof Error ? e.message : String(e))); }
    }

    if (errors.length > 0) {
      set({ isLoading: false, dbConnected: true, lastSyncedAt: now });
      throw new Error("Kuch tables save nahi hue: " + errors.join(" | "));
    }

    set({ isLoading: false, dbConnected: true, lastSyncedAt: now });
  },

  /* ---- PATCH (merge partial data into money_profile JSONB) ---- */
  patchMoneyProfile: async (patch) => {
    const userId = await getUserId();
    if (!userId) return;
    const existing = (get().profile?.money_profile_snapshot ?? {}) as Record<string, unknown>;
    const merged = { ...existing, ...patch };
    try {
      await supabase
        .from("profiles")
        .update({ money_profile: merged, updated_at: new Date().toISOString() })
        .eq("id", userId);
      await get().fetchProfile();
    } catch {
      // column may not exist yet — silently ignore
    }
  },

  /* ---- RESET (clear all in-memory state on logout / user switch) ---- */
  resetProfile: () => {
    set({ profile: null, isLoading: false, lastSyncedAt: null, dbConnected: false });
  },
}));
