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
      color: "text-emerald-300",
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
      color: "text-cyan-300",
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
      color: "text-emerald-300",
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
      <span className="text-slate-400 text-sm">{field.label}</span>

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
                className="bg-slate-700/80 border border-emerald-500/40 rounded-lg px-3 py-1 text-sm text-white capitalize focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
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
                className="w-32 bg-slate-700/80 border border-emerald-500/40 rounded-lg px-3 py-1 text-sm text-white text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <span className={`text-sm font-medium ${isComputed ? "text-slate-500 italic" : (field.color || "text-white")}`}>
          {displayValue()}
          {isComputed && editing && (
            <span className="ml-1 text-[10px] text-slate-600">(auto)</span>
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
      className={`rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-md p-6 ${className || ""}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User size={18} className="text-emerald-400" />
          Financial Profile Summary
        </h3>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs font-medium hover:bg-slate-700/50 transition-colors"
              >
                <X size={13} /> Cancel
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 text-xs font-medium hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-300 transition-all"
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
            className={`mb-4 text-xs font-medium px-3 py-2 rounded-lg flex items-center gap-2 ${
              flash.includes("Failed")
                ? "bg-red-500/10 text-red-300 border border-red-500/30"
                : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
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
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
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
        <p className="mt-4 text-[11px] text-slate-600 text-center">
          Months Covered & Total Investments are auto-calculated and cannot be edited here.
        </p>
      )}
    </motion.div>
  );
}
