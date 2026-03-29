import { create } from "zustand";
import api from "@/lib/api";
import { isLocalEngineMode } from "@/lib/config";
import { computeFirePlan, type FirePlanInput, type FirePlanResult } from "@/lib/engine/fire";

interface Goal {
  id?: string;
  name: string;
  category: string;
  target_amount: number;
  current_savings: number;
  target_date: string;
  priority: string;
  sip_required?: number;
  months_to_goal?: number;
  assumed_annual_return_pct?: number;
  recommended_asset_allocation?: Record<string, number>;
  status?: string;
  funding_note?: string;
}

interface FirePlannerState {
  plan: FirePlanResult | null;
  goals: Goal[];
  isGenerating: boolean;
  generatePlan: (data: Record<string, unknown>) => Promise<void>;
  fetchRoadmap: () => Promise<void>;
  resetFireState: () => void;
}

export const useFirePlannerStore = create<FirePlannerState>((set) => ({
  plan: null,
  goals: [],
  isGenerating: false,

  generatePlan: async (data) => {
    set({ isGenerating: true });
    try {
      if (isLocalEngineMode()) {
        const plan = computeFirePlan(data as unknown as FirePlanInput);
        set({ plan, goals: plan.goals as Goal[], isGenerating: false });
        return;
      }
      const res = await api.post<FirePlanResult>("/fire/generate", data);
      set({ plan: res.data, goals: res.data.goals as Goal[], isGenerating: false });
    } catch {
      set({ isGenerating: false });
      throw new Error("Failed to generate FIRE plan");
    }
  },

  fetchRoadmap: async () => {
    try {
      if (isLocalEngineMode()) return;
      const res = await api.get<{ goals: Goal[] }>("/fire/roadmap");
      set({ goals: res.data.goals });
    } catch {
      /* optional */
    }
  },

  resetFireState: () => {
    set({ plan: null, goals: [], isGenerating: false });
  },
}));
