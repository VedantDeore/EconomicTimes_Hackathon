"use client";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { Bell, Search, Sparkles } from "lucide-react";
import { getGreeting } from "@/lib/utils";

export default function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          {getGreeting()}, <span className="text-[#00D09C] font-bold">{user?.full_name?.split(" ")[0] || "User"}</span>
        </h2>
        <p className="text-xs text-gray-400">Let&apos;s build your wealth today</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search features..."
            className="w-64 pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl
              text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#00D09C]/50
              focus:ring-1 focus:ring-[#00D09C]/20 transition-all"
          />
        </div>

        <Link href="/mentor"
          className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all
            bg-[#00D09C]/8 border-[#00D09C]/20 text-[#00D09C] hover:bg-[#00D09C]/12 font-medium">
          <Sparkles size={16} />
          <span className="hidden sm:inline">AI Mentor</span>
        </Link>

        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00D09C] rounded-full"></span>
        </button>

        <Link href="/profile">
          <div className="w-9 h-9 rounded-xl bg-[#00D09C] flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:opacity-90 transition-all">
            {user?.full_name?.charAt(0) || "U"}
          </div>
        </Link>
      </div>
    </header>
  );
}
