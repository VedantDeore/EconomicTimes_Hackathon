import { create } from "zustand";
import api from "@/lib/api";

interface Goal {
  id?: string;
  name: string;
  category: string;
  target_amount: number;
  current_savings: number;
  target_date: string;
  priority: string;
  sip_required?: number;
  recommended_asset_allocation?: Record<string, number>;
  status?: string;
}

interface FirePlan {
  fire_number: number;
  years_to_fire: number;
  monthly_sip_needed: number;
  asset_allocation: Record<string, number>;
  insurance_gaps: Array<Record<string, string>>;
  tax_saving_moves: Array<Record<string, string>>;
  emergency_fund_target: number;
  ai_summary: string;
  goals: Goal[];
}

interface FirePlannerState {
  plan: FirePlan | null;
  goals: Goal[];
  isGenerating: boolean;
  generatePlan: (data: Record<string, unknown>) => Promise<void>;
  fetchRoadmap: () => Promise<void>;
}

export const useFirePlannerStore = create<FirePlannerState>((set) => ({
  plan: null,
  goals: [],
  isGenerating: false,

  generatePlan: async (data) => {
    set({ isGenerating: true });
    try {
      const res = await api.post("/fire/generate", data);
      set({ plan: res.data, goals: res.data.goals, isGenerating: false });
    } catch {
      set({ isGenerating: false });
      throw new Error("Failed to generate FIRE plan");
    }
  },

  fetchRoadmap: async () => {
    try {
      const res = await api.get("/fire/roadmap");
      set({ goals: res.data.goals });
    } catch {
      // silently fail
    }
  },
}));
