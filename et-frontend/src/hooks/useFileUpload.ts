"use client";
import { useState, useCallback } from "react";
import api from "@/lib/api";

export function useFileUpload(endpoint: string) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (file: File, extraParams?: Record<string, string>) => {
      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (extraParams) {
          Object.entries(extraParams).forEach(([key, val]) => {
            formData.append(key, val);
          });
        }

        const res = await api.post(endpoint, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (e) => {
            if (e.total) {
              setProgress(Math.round((e.loaded / e.total) * 100));
            }
          },
        });

        setIsUploading(false);
        setProgress(100);
        return res.data;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setIsUploading(false);
        throw err;
      }
    },
    [endpoint]
  );

  return { upload, isUploading, progress, error };
}
