import { create } from "zustand";
import api from "@/lib/api";

interface FinancialProfile {
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
}

interface ProfileState {
  profile: FinancialProfile | null;
  isLoading: boolean;
  fetchProfile: () => Promise<void>;
  saveProfile: (data: Partial<FinancialProfile>) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get("/profile");
      set({ profile: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  saveProfile: async (data) => {
    set({ isLoading: true });
    try {
      const res = await api.post("/profile/onboarding", data);
      set({ profile: res.data, isLoading: false });
    } catch {
      set({ isLoading: false });
      throw new Error("Failed to save profile");
    }
  },
}));
