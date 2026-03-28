import { create } from "zustand";
import api from "@/lib/api";
import { isLocalEngineMode } from "@/lib/config";
import { computeTaxAnalysis, type TaxAnalyzePayload, type TaxAnalysisResult } from "@/lib/engine/tax";

interface TaxWizardState {
  analysis: TaxAnalysisResult | null;
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
      if (isLocalEngineMode()) {
        const analysis = computeTaxAnalysis(data as unknown as TaxAnalyzePayload);
        set({ analysis, isAnalyzing: false });
        return;
      }
      const res = await api.post<TaxAnalysisResult>("/tax/analyze", data);
      set({ analysis: res.data, isAnalyzing: false });
    } catch {
      set({ isAnalyzing: false });
      throw new Error("Tax analysis failed");
    }
  },

  uploadForm16: async (file) => {
    if (isLocalEngineMode()) {
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (isPdf) {
        return {
          parsed: false,
          message:
            "Local mode cannot read PDF. Use the salary fields above or export a CSV summary. Gross salary left unchanged.",
        };
      }
      const text = await file.text();
      const lines = text.split(/\r?\n/).slice(0, 40).join("\n");
      const nums = lines.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""), 10)) || [];
      const guess = nums.filter((n) => n > 500000).sort((a, b) => b - a)[0];
      return {
        parsed: Boolean(guess),
        suggested_gross_salary: guess || null,
        snippet: lines.slice(0, 500),
      };
    }
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<Record<string, unknown>>("/tax/upload-form16", formData);
    return res.data;
  },
}));
