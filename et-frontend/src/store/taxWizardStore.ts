import { create } from "zustand";
import api from "@/lib/api";

interface RegimeResult {
  taxable_income: number;
  tax_payable: number;
  cess: number;
  total_tax: number;
}

interface TaxAnalysis {
  financial_year: string;
  regime_comparison: {
    old_regime: RegimeResult;
    new_regime: RegimeResult;
    recommended_regime: string;
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
  ai_summary: string;
}

interface TaxWizardState {
  analysis: TaxAnalysis | null;
  isAnalyzing: boolean;
  analyze: (data: Record<string, unknown>) => Promise<void>;
  uploadForm16: (file: File) => Promise<Record<string, unknown>>;
}

export const useTaxWizardStore = create<TaxWizardState>((set) => ({
  analysis: null,
  isAnalyzing: false,

  analyze: async (data) => {
    set({ isAnalyzing: true });
    try {
      const res = await api.post("/tax/analyze", data);
      set({ analysis: res.data, isAnalyzing: false });
    } catch {
      set({ isAnalyzing: false });
      throw new Error("Tax analysis failed");
    }
  },

  uploadForm16: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/tax/upload-form16", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
}));
