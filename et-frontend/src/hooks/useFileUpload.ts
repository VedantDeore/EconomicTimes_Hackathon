"use client";
import { useState, useCallback } from "react";
import api from "@/lib/api";
import { isLocalEngineMode } from "@/lib/config";
import { buildPortfolioFromText, type MfPortfolioResult } from "@/lib/engine/mf";

export function useFileUpload(endpoint: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const localMode = isLocalEngineMode();

  const upload = useCallback(
    async (file: File, extraParams?: Record<string, string>): Promise<MfPortfolioResult> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        if (localMode) {
          const text = await file.text();
          const result = buildPortfolioFromText(file.name, text);
          setProgress(100);
          setIsUploading(false);
          return result;
        }

        const formData = new FormData();
        formData.append("file", file);
        if (extraParams) {
          Object.entries(extraParams).forEach(([key, val]) => {
            formData.append(key, val);
          });
        }

        setProgress(35);
        const res = await api.post<MfPortfolioResult>(endpoint, formData);
        setProgress(100);
        setIsUploading(false);
        return res.data;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setIsUploading(false);
        throw err;
      }
    },
    [endpoint, localMode]
  );

  return { upload, isUploading, progress, error };
}
