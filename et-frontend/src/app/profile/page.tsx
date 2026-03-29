"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Phone, Calendar, Shield, Heart, TrendingUp, Wallet, Edit, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { formatCurrency } from "@/lib/utils";
import { getLatestHealthScore, getLatestTaxAnalysis, getLatestFirePlan } from "@/lib/supabaseHistory";
import { supabase } from "@/lib/supabase";
import EditableProfileSummary from "@/components/EditableProfileSummary";

function sumInvestments(inv: Record<string, number> | undefined): number {
  if (!inv) return 0;
  return Object.values(inv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
}

export default function ProfilePage() {
  useAuth();
  const { user } = useAuthStore();
  const { profile, fetchProfile } = useProfileStore();
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [lastTaxDate, setLastTaxDate] = useState<string | null>(null);
  const [firePlanNumber, setFirePlanNumber] = useState<number | null>(null);

  useEffect(() => {
    void fetchProfile();
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.created_at) setCreatedAt(session.user.created_at);
    });
    void getLatestHealthScore().then((r) => { if (r) setHealthScore(r.overall_score); });
    void getLatestTaxAnalysis().then((r) => { if (r) setLastTaxDate(new Date(r.analyzed_at).toLocaleDateString()); });
    void getLatestFirePlan().then((r) => { if (r) setFirePlanNumber(r.fire_number); });
  }, [fetchProfile]);

  const netWorth = useMemo(() => {
    if (!profile) return 0;
    const investments = sumInvestments(profile.existing_investments);
    const emergency = profile.emergency_fund?.current_amount ?? 0;
    return investments + emergency;
  }, [profile]);

  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-medium text-[#00D09C]">Your Profile</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900">Account & Financial Summary</h1>
      </motion.div>

      {/* User info card */}
      <motion.div variants={item} initial="hidden" animate="show"
        className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-sm shrink-0">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900">{user?.full_name || "User"}</h2>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail size={15} className="text-gray-400" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone size={15} className="text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={15} className="text-gray-400" />
                  <span>Member since {new Date(createdAt).toLocaleDateString()}</span>
                </div>
              )}
              {profile?.employment_type && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin size={15} className="text-gray-400" />
                  <span className="capitalize">{profile.employment_type}</span>
                </div>
              )}
            </div>
          </div>
          <Link href="/money-profile"
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#00D09C]/40 bg-[#00D09C]/10 text-[#00D09C] text-sm font-medium hover:bg-[#00D09C]/20 transition-colors">
            <Edit size={14} /> Edit Profile
          </Link>
        </div>
      </motion.div>

      {/* Financial quick stats */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Net Worth", value: netWorth > 0 ? formatCurrency(netWorth) : "—", icon: Wallet, color: "text-[#00D09C]" },
          { label: "Health Score", value: healthScore !== null ? `${Math.round(healthScore)}/100` : "—", icon: Heart, color: "text-pink-400" },
          { label: "Last Tax Analysis", value: lastTaxDate || "Not run yet", icon: Shield, color: "text-amber-500" },
          { label: "FIRE Number", value: firePlanNumber ? formatCurrency(firePlanNumber) : "—", icon: TrendingUp, color: "text-[#00D09C]" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={16} className={stat.color} />
              <span className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Financial profile summary — inline editable */}
      <EditableProfileSummary />

      {/* Quick links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
        className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: "/money-profile", label: "Edit Money Profile", className: "rounded-xl bg-[#00D09C] p-3 text-center text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90" },
            { href: "/money-health", label: "Check Health Score", className: "rounded-xl border border-pink-200 bg-pink-50 p-3 text-center text-sm font-semibold text-pink-700 shadow-sm transition-all hover:bg-pink-100" },
            { href: "/tax-wizard", label: "Run Tax Wizard", className: "rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm font-semibold text-amber-800 shadow-sm transition-all hover:bg-amber-100" },
            { href: "/fire-planner", label: "FIRE Planner", className: "rounded-xl border border-violet-200 bg-violet-50 p-3 text-center text-sm font-semibold text-violet-800 shadow-sm transition-all hover:bg-violet-100" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className={link.className}>
              {link.label}
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
