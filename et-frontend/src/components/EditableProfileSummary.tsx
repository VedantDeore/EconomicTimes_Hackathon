"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, X, Save, User, Loader2 } from "lucide-react";
import { useProfileStore, type FinancialProfile } from "@/store/profileStore";
import { formatCurrency } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FieldKind = "currency" | "number" | "select";

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  /** Getter: extract display value from profile */
  get: (p: FinancialProfile) => string | number;
  /** Patcher: return a partial FinancialProfile & money_profile patch */
  patch: (val: string | number) => {
    profilePatch?: Partial<FinancialProfile>;
    moneyPatch?: Record<string, unknown>;
  };
  color?: string;
}

const RISK_OPTIONS = ["conservative", "moderate", "aggressive"];
const TAX_OPTIONS = ["old", "new"];

const FIELDS: FieldDef[][] = [
  // Left column — Income & Expenses
  [
    {
      key: "gross_income",
      label: "Annual Gross Income",
      kind: "currency",
      get: (p) => p.annual_income?.gross || 0,
      patch: (v) => {
        const n = Number(v) || 0;
        return {
          profilePatch: { annual_income: { gross: n, net: Math.round(n * 0.9) } },
          moneyPatch: { monthly_income: Math.round(n / 12) },
        };
      },
    },
    {
      key: "monthly_expenses",
      label: "Monthly Expenses",
      kind: "currency",
      get: (p) => p.monthly_expenses?.total || 0,
      patch: (v) => {
        const n = Number(v) || 0;
        return {
          profilePatch: { monthly_expenses: { total: n } as Record<string, number> },
          moneyPatch: { monthly_expenses: n },
        };
      },
    },
    {
      key: "risk_profile",
      label: "Risk Profile",
      kind: "select",
      options: RISK_OPTIONS,
      get: (p) => p.risk_profile || "moderate",
      patch: (v) => ({
        profilePatch: { risk_profile: String(v) },
        moneyPatch: { risk_profile: String(v) },
      }),
      color: "text-[#00D09C]",
    },
    {
      key: "tax_regime",
      label: "Tax Regime",
      kind: "select",
      options: TAX_OPTIONS,
      get: (p) => p.tax_regime || "new",
      patch: (v) => ({
        profilePatch: { tax_regime: String(v) },
        moneyPatch: { tax_regime: String(v) },
      }),
      color: "text-[#00D09C]",
    },
  ],
  // Right column — Emergency & Insurance
  [
    {
      key: "emergency_fund",
      label: "Emergency Fund",
      kind: "currency",
      get: (p) => p.emergency_fund?.current_amount || 0,
      patch: (v) => ({
        moneyPatch: { emergency_fund: Number(v) || 0 },
      }),
    },
    {
      key: "months_covered",
      label: "Months Covered",
      kind: "number",
      get: (p) => p.emergency_fund?.months_covered || 0,
      patch: () => ({}),
    },
    {
      key: "total_investments",
      label: "Total Investments",
      kind: "currency",
      get: (p) => {
        if (!p.existing_investments) return 0;
        return Object.values(p.existing_investments).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
      },
      patch: () => ({}),
      color: "text-[#00D09C]",
    },
    {
      key: "age",
      label: "Age",
      kind: "number",
      get: (p) => p.age || 0,
      patch: (v) => ({
        profilePatch: { age: Number(v) || null },
        moneyPatch: { age: Number(v) || 0 },
      }),
    },
  ],
];

const COLUMN_HEADERS = ["Income & Expenses", "Emergency & Savings"];

/* ------------------------------------------------------------------ */
/*  Inline editable field                                              */
/* ------------------------------------------------------------------ */

function InlineField({
  field,
  value,
  editing,
  onChange,
}: {
  field: FieldDef;
  value: string | number;
  editing: boolean;
  onChange: (val: string | number) => void;
}) {
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);
  const isComputed = field.key === "months_covered" || field.key === "total_investments";

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const displayValue = () => {
    if (field.kind === "currency") return formatCurrency(Number(value));
    if (field.kind === "select") return String(value);
    if (field.key === "months_covered") return `${value} mo`;
    return String(value);
  };

  return (
    <div className="flex items-center justify-between gap-3 group min-h-[32px]">
      <span className="text-gray-500 text-sm">{field.label}</span>

      {editing && !isComputed ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {field.kind === "select" ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={String(value)}
                onChange={(e) => onChange(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm capitalize text-gray-900 transition-all focus:border-[#00D09C]/50 focus:outline-none focus:ring-2 focus:ring-[#00D09C]/50"
              >
                {field.options?.map((o) => (
                  <option key={o} value={o} className="capitalize">{o}</option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="number"
                value={value === 0 ? "" : value}
                placeholder="0"
                onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1 text-right text-sm text-gray-900 transition-all focus:border-[#00D09C]/50 focus:outline-none focus:ring-2 focus:ring-[#00D09C]/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <span className={`text-sm font-medium ${isComputed ? "italic text-gray-500" : (field.color || "text-gray-900")}`}>
          {displayValue()}
          {isComputed && editing && (
            <span className="ml-1 text-[10px] text-gray-400">(auto)</span>
          )}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function EditableProfileSummary({ className }: { className?: string }) {
  const { profile, saveProfile, patchMoneyProfile, fetchProfile } = useProfileStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<Record<string, string | number>>({});
  const [flash, setFlash] = useState<string | null>(null);

  const initDraft = useCallback(() => {
    if (!profile) return;
    const d: Record<string, string | number> = {};
    for (const col of FIELDS) {
      for (const f of col) {
        d[f.key] = f.get(profile);
      }
    }
    setDraft(d);
  }, [profile]);

  const handleEdit = () => {
    initDraft();
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft({});
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      let profilePatch: Partial<FinancialProfile> = {};
      let moneyPatch: Record<string, unknown> = {};

      for (const col of FIELDS) {
        for (const f of col) {
          const v = draft[f.key];
          if (v === undefined) continue;
          const { profilePatch: pp, moneyPatch: mp } = f.patch(v);
          if (pp) profilePatch = { ...profilePatch, ...pp };
          if (mp) moneyPatch = { ...moneyPatch, ...mp };
        }
      }

      if (Object.keys(profilePatch).length > 0) {
        await saveProfile(profilePatch);
      }
      if (Object.keys(moneyPatch).length > 0) {
        await patchMoneyProfile(moneyPatch);
      }

      await fetchProfile();
      setEditing(false);
      setFlash("Profile updated! Changes synced across all features.");
      setTimeout(() => setFlash(null), 3000);
    } catch {
      setFlash("Failed to save. Please try again.");
      setTimeout(() => setFlash(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (!profile || (profile.annual_income?.gross <= 0 && !profile.age)) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className || ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User size={18} className="text-[#00D09C]" />
          Financial Profile Summary
        </h3>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg border border-[#00D09C]/40 bg-[#00D09C]/10 text-xs font-medium text-[#00D09C] transition-colors hover:bg-[#00D09C]/15 disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 transition-all hover:border-[#00D09C]/40 hover:bg-[#00D09C]/10 hover:text-[#00D09C]"
            >
              <Pencil size={13} /> Quick Edit
            </button>
          )}
        </div>
      </div>

      {/* Flash message */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              flash.includes("Failed")
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-[#00D09C]/20 bg-[#00D09C]/10 text-[#00D09C]"
            }`}
          >
            <Check size={13} /> {flash}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FIELDS.map((col, ci) => (
          <div key={ci} className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {COLUMN_HEADERS[ci]}
            </p>
            <div className="space-y-2.5">
              {col.map((f) => (
                <InlineField
                  key={f.key}
                  field={f}
                  value={editing ? (draft[f.key] ?? f.get(profile)) : f.get(profile)}
                  editing={editing}
                  onChange={(val) => setDraft((d) => ({ ...d, [f.key]: val }))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <p className="mt-4 text-center text-[11px] text-gray-400">
          Months Covered & Total Investments are auto-calculated and cannot be edited here.
        </p>
      )}
    </motion.div>
  );
}
