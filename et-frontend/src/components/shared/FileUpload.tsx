"use client";

import { motion } from "framer-motion";
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Upload, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  label?: string;
  isLoading?: boolean;
}

export default function FileUpload({
  onFileSelect,
  accept,
  label = "Drop a file here or click to browse",
  isLoading,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      setFileName(file.name);
      onFileSelect(file);
    },
    [onFileSelect],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      handleFile(file);
    },
    [handleFile],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  return (
    <div className="w-full">
      <motion.button
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "relative w-full rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          "bg-gray-50 hover:bg-gray-100",
          isDragging
            ? "border-[#00D09C]/60 bg-[#00D09C]/5"
            : "border-gray-300 hover:border-gray-400",
          isLoading && "pointer-events-none opacity-70",
        )}
        whileHover={isLoading ? undefined : { scale: 1.01 }}
        whileTap={isLoading ? undefined : { scale: 0.995 }}
        transition={{ duration: 0.2 }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={onInputChange}
          disabled={isLoading}
        />
        <div className="flex flex-col items-center gap-3">
          {isLoading ? (
            <Loader2
              className="h-10 w-10 text-[#00D09C] animate-spin"
              aria-hidden
            />
          ) : (
            <Upload
              className="h-10 w-10 text-gray-400"
              strokeWidth={1.5}
              aria-hidden
            />
          )}
          <p className="text-sm text-gray-500">{label}</p>
          {fileName ? (
            <p className="text-sm font-medium text-[#00D09C] truncate max-w-full px-2">
              {fileName}
            </p>
          ) : null}
        </div>
      </motion.button>
    </div>
  );
}
