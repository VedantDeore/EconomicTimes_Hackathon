"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import AnimatedCounter from "./AnimatedCounter";

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: number; isPositive: boolean };
  subtitle?: string;
  className?: string;
}

export default function KPICard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
}: KPICardProps) {
  const isNumeric = typeof value === "number";

  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
        className,
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {title}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-2">
            {isNumeric ? (
              <AnimatedCounter
                value={value}
                className="text-2xl font-bold tracking-tight text-gray-900"
              />
            ) : (
              <span className="text-2xl font-bold tracking-tight text-gray-900">
                {value}
              </span>
            )}
            {trend ? (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-semibold",
                  trend.isPositive ? "text-[#00D09C]" : "text-red-500",
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                )}
                {Math.abs(trend.value)}%
              </span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
          ) : null}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00D09C]/10 text-[#00D09C]"
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
