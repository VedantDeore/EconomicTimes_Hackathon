"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  LayoutDashboard, Flame, Heart, Calendar, Calculator,
  Users, PieChart, LogOut, X, ChevronRight, Wallet, FileText,
  Sparkles, User,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/money-profile", label: "Money Profile", icon: Wallet },
  { href: "/fire-planner", label: "FIRE Planner", icon: Flame },
  { href: "/money-health", label: "Money Health", icon: Heart },
  { href: "/life-events", label: "Life Events", icon: Calendar },
  { href: "/tax-wizard", label: "Tax Wizard", icon: Calculator },
  { href: "/couples-planner", label: "Couples Planner", icon: Users },
  { href: "/mf-xray", label: "MF X-Ray", icon: PieChart },
  { href: "/mentor", label: "AI Mentor", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-white
        border-r border-gray-200 transition-all duration-300 z-50
        ${collapsed ? "w-20" : "w-64"} flex flex-col`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00D09C] flex items-center justify-center text-white font-black text-sm">
              ET
            </div>
            <span className="text-lg font-bold text-gray-900">
              DhanGuru
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-[#00D09C]/8 text-[#00D09C] font-medium"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <Icon size={20} className={isActive ? "text-[#00D09C]" : "text-gray-400 group-hover:text-gray-600"} />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User & Logout */}
      <div className="p-4 border-t border-gray-100">
        {!collapsed && user && (
          <Link href="/profile" className="block mb-3 px-3 rounded-xl py-2 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00D09C] flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user.full_name?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          </Link>
        )}
        {collapsed && user && (
          <Link href="/profile" className="flex items-center justify-center mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#00D09C] flex items-center justify-center text-white text-sm font-bold">
              {user.full_name?.charAt(0) || <User size={16} />}
            </div>
          </Link>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-400
            hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
