import Link from "next/link";
import {
  Flame, Heart, Calendar, Calculator, Users, PieChart,
  ArrowRight, Sparkles, Shield, TrendingUp, CheckCircle2,
} from "lucide-react";

const features = [
  {
    title: "FIRE Path Planner",
    desc: "Complete month-by-month financial roadmap with SIP amounts per goal, asset allocation shifts, insurance gaps, and tax-saving moves.",
    icon: <Flame size={28} />,
    gradient: "from-orange-500 to-red-500",
    href: "/fire-planner",
  },
  {
    title: "Money Health Score",
    desc: "5-minute onboarding gives a comprehensive score across emergency preparedness, insurance, investments, debt, tax, and retirement.",
    icon: <Heart size={28} />,
    gradient: "from-pink-500 to-rose-500",
    href: "/money-health",
  },
  {
    title: "Life Event Advisor",
    desc: "AI advisor for bonus, inheritance, marriage, new baby — customized to your tax bracket, portfolio, and goals.",
    icon: <Calendar size={28} />,
    gradient: "from-blue-500 to-indigo-500",
    href: "/life-events",
  },
  {
    title: "Tax Wizard",
    desc: "Upload Form 16 or input salary. AI finds every missed deduction, compares regimes, and suggests tax-saving investments.",
    icon: <Calculator size={28} />,
    gradient: "from-amber-500 to-orange-500",
    href: "/tax-wizard",
  },
  {
    title: "Couple's Money Planner",
    desc: "India's first AI joint planner — HRA claims, NPS matching, SIP splits, joint vs individual insurance, combined net worth.",
    icon: <Users size={28} />,
    gradient: "from-violet-500 to-pink-500",
    href: "/couples-planner",
  },
  {
    title: "MF Portfolio X-Ray",
    desc: "Upload CAMS/KFintech statement for XIRR, overlap analysis, expense ratio drag, benchmark comparison, and AI rebalancing.",
    icon: <PieChart size={28} />,
    gradient: "from-violet-500 to-purple-500",
    href: "/mf-xray",
  },
];

const stats = [
  { value: "95%", label: "Indians lack a financial plan" },
  { value: "₹25K+", label: "Yearly advisor cost you save" },
  { value: "6", label: "AI-powered financial tools" },
  { value: "< 5 min", label: "To get your Money Health Score" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-black text-sm">
              ET
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Finance Mentor
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-semibold text-sm
                hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <Sparkles size={14} className="text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">AI-Powered Financial Planning for India</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black max-w-4xl mx-auto leading-tight mb-6">
            Turn Confused Savers Into{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Confident Investors
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Financial planning as accessible as checking WhatsApp. AI builds your complete
            financial roadmap — investments, tax savings, insurance, and retirement — personalized to you.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/register"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 font-bold text-lg
                hover:shadow-xl hover:shadow-emerald-500/30 transition-all flex items-center gap-2">
              Start Free <ArrowRight size={20} />
            </Link>
            <Link href="/money-health"
              className="px-8 py-3.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-lg
                hover:bg-slate-800/60 hover:border-slate-600 transition-all">
              Check Health Score
            </Link>
          </div>
        </div>
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {s.value}
              </p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
            6 Powerful Financial Tools
          </h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Everything you need to take control of your money, powered by AI
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Link key={f.title} href={f.href}
              className="group p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50
                hover:border-slate-600/50 hover:bg-slate-800/60 transition-all duration-300">
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-white mb-4
                shadow-lg group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                {f.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-slate-900/30 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-3xl font-black text-white text-center mb-12">Why ET Finance Mentor?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Shield size={24} />, title: "100% Personalized", desc: "AI tailors every recommendation to your income, tax bracket, risk profile, and goals." },
              { icon: <TrendingUp size={24} />, title: "India-First Design", desc: "Built for Indian tax laws, instruments (PPF, NPS, ELSS), and financial realities." },
              { icon: <CheckCircle2 size={24} />, title: "Actionable, Not Generic", desc: "Get specific SIP amounts, exact deduction sections, and month-by-month plans." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-4xl font-black text-white mb-4">
          Ready to Take Control of Your Money?
        </h2>
        <p className="text-lg text-slate-500 mb-8 max-w-lg mx-auto">
          Join thousands of Indians building their financial future with AI.
        </p>
        <Link href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500
            text-slate-900 font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/30 transition-all">
          Get Started Free <ArrowRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-slate-900 font-black text-xs">
              ET
            </div>
            <span className="text-sm text-slate-500">Finance Mentor © 2026</span>
          </div>
          <p className="text-xs text-slate-600">AI-Powered Personal Finance for India</p>
        </div>
      </footer>
    </div>
  );
}
