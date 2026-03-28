import type { ProfileLike } from "@/lib/engine/health";

export interface CoupleOptimizeInput {
  profileSelf: ProfileLike;
  profilePartner: ProfileLike | null;
  partnerEmail?: string;
}

export interface CoupleOptimization {
  hra_split?: { recommended_claimer: string; savings: number; reason: string };
  insurance_plan?: { joint_vs_individual: string; recommendations: string[] };
  combined_net_worth?: { total: number; partner_1_share: number; partner_2_share: number };
  nps_note?: string;
  sip_split_note?: string;
}

function netWorthFromProfile(p: ProfileLike): number {
  if (!p) return 0;
  const inv = p.existing_investments || {};
  const invSum = Object.values(inv).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
  const efd = p.emergency_fund?.current_amount || 0;
  const debt = (p.debts || []).reduce((s, d) => s + (Number(d.outstanding) || 0), 0);
  return Math.max(0, invSum + efd - debt);
}

export function computeCoupleOptimization(input: CoupleOptimizeInput): { optimization: CoupleOptimization } {
  const nw1 = netWorthFromProfile(input.profileSelf);
  const nw2 = netWorthFromProfile(input.profilePartner);
  const total = nw1 + nw2;
  const p1s = total > 0 ? Math.round((nw1 / total) * 100) : 50;
  const p2s = 100 - p1s;

  const tax1 = input.profileSelf?.tax_regime === "new" ? "new" : "old";
  const tax2 = input.profilePartner?.tax_regime === "new" ? "new" : "old";

  const hra_split = {
    recommended_claimer:
      tax1 === "old" && tax2 !== "old" ? "Partner 1 (old regime)" : tax2 === "old" && tax1 !== "old" ? "Partner 2 (old regime)" : "Higher marginal slab partner",
    savings: Math.round((input.profileSelf?.annual_income?.net || 600000) * 0.06),
    reason:
      "HRA exemption usually helps more when claimed by the partner on old regime with higher taxable income. Verify rent agreement and landlord PAN rules.",
  };

  return {
    optimization: {
      combined_net_worth: { total: total, partner_1_share: p1s, partner_2_share: p2s },
      hra_split,
      insurance_plan: {
        joint_vs_individual: "floater_for_kids_individual_topup",
        recommendations: [
          "Family floater for shared household + super top-up for large SI.",
          "Term cover typically individual (income replacement), equal to 10–15× income each.",
        ],
      },
      nps_note: "If both salaried, each can use 80CCD(2) employer NPS — compare with take-home impact.",
      sip_split_note:
        "Route ELSS/80C via the partner with higher slab on old regime; automate SIPs from joint account for discipline.",
    },
  };
}

export function randomInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
