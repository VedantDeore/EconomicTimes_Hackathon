"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  LayoutDashboard,
  Wallet,
  Flame,
  Heart,
  Calculator,
  PieChart,
  Users,
  FileText,
  Sparkles,
} from "lucide-react";

interface ActionLink {
  label: string;
  href: string;
}

interface Props {
  links: ActionLink[];
}

const ICON_MAP: Record<string, React.ElementType> = {
  "/dashboard": LayoutDashboard,
  "/money-profile": Wallet,
  "/fire-planner": Flame,
  "/money-health": Heart,
  "/tax-wizard": Calculator,
  "/mf-xray": PieChart,
  "/couples-planner": Users,
  "/reports": FileText,
  "/mentor": Sparkles,
  "/profile": Wallet,
};

const COLOR_MAP: Record<string, string> = {
  "/dashboard": "from-emerald-600 to-cyan-600",
  "/money-profile": "from-violet-600 to-indigo-600",
  "/fire-planner": "from-orange-600 to-rose-600",
  "/money-health": "from-pink-600 to-rose-600",
  "/tax-wizard": "from-amber-600 to-orange-600",
  "/mf-xray": "from-indigo-600 to-violet-600",
  "/profile": "from-cyan-600 to-blue-600",
};

export default function ActionLinkBar({ links }: Props) {
  if (!links || links.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {links.map((link) => {
        const Icon = ICON_MAP[link.href] || ArrowUpRight;
        const gradient = COLOR_MAP[link.href] || "from-slate-600 to-slate-700";

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r ${gradient} px-3 py-1.5 text-[11px] font-medium text-white shadow-sm transition-all hover:brightness-110 hover:shadow-md`}
          >
            <Icon size={12} />
            {link.label}
            <ArrowUpRight size={10} className="opacity-60" />
          </Link>
        );
      })}
    </div>
  );
}
