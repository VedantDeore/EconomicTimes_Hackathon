"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Heart,
  Calculator,
  PieChart,
  Calendar,
  Users,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import AnimatedCounter from "@/components/shared/AnimatedCounter";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "FIRE Planner",
    desc: "Month-by-month roadmap to financial independence with SIP targets, glide paths, and scenario planning.",
    icon: Flame,
    gradient: "from-orange-500 to-rose-600",
    href: "/fire-planner",
  },
  {
    title: "Money Health",
    desc: "Holistic score across savings, debt, insurance, tax, and goals so you see the full picture.",
    icon: Heart,
    gradient: "from-pink-500 to-rose-500",
    href: "/money-health",
  },
  {
    title: "Tax Wizard",
    desc: "Old vs new regime, missed deductions, and ranked tax-saving moves tailored to your salary structure.",
    icon: Calculator,
    gradient: "from-amber-500 to-orange-500",
    href: "/tax-wizard",
  },
  {
    title: "MF X-Ray",
    desc: "Upload statements for XIRR, overlap, expense drag, and AI-assisted rebalancing ideas.",
    icon: PieChart,
    gradient: "from-violet-500 to-indigo-600",
    href: "/mf-xray",
  },
  {
    title: "Life Events",
    desc: "Bonus, inheritance, marriage, relocation modeled against your portfolio and tax bracket.",
    icon: Calendar,
    gradient: "from-sky-500 to-blue-600",
    href: "/life-events",
  },
  {
    title: "Couples Planner",
    desc: "Joint net worth, HRA, NPS, SIP splits, and insurance designed for two incomes.",
    icon: Users,
    gradient: "from-fuchsia-500 to-violet-600",
    href: "/couples-planner",
  },
];

const steps = [
  { title: "Sign Up", body: "Create a free account in under a minute. No card, no sales calls." },
  { title: "Complete Profile", body: "Tell us about income, goals, and risk so models stay personal." },
  { title: "Get Your Plan", body: "See dashboards, alerts, and AI guidance tuned to Indian rules." },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D09C] text-sm font-black text-white">
              ET
            </div>
            <span className="text-lg font-bold text-gray-900">
              DhanGuru
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-gray-500 transition-colors hover:text-gray-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#00D09C] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#00B386] hover:shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <motion.div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute -left-1/4 top-0 h-[28rem] w-[28rem] rounded-full bg-[#00D09C]/5 blur-[120px]" />
          <div className="absolute -right-1/4 top-24 h-[24rem] w-[24rem] rounded-full bg-[#00D09C]/5 blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 h-[20rem] w-[20rem] rounded-full bg-[#00D09C]/5 blur-[90px]" />
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(0,208,156,0.05),transparent)]"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00D09C]/20 bg-[#00D09C]/8 px-4 py-1.5"
          >
            <Sparkles size={14} className="text-[#00D09C]" />
            <span className="text-xs font-medium text-[#00D09C]">
              DhanGuru Money Mentor
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mx-auto max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl"
          >
            Your AI Financial Advisor.{" "}
            <span className="text-[#00D09C]">
              Free. Forever.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-gray-500"
          >
            95% of Indians don&apos;t have a financial plan. We&apos;re changing that.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#00D09C] px-8 py-3.5 text-lg font-bold text-white transition-all hover:bg-[#00B386] hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight size={20} />
            </Link>
            <Link
              href="/money-health"
              className="rounded-xl border border-gray-300 px-8 py-3.5 text-lg font-medium text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-50"
            >
              Explore Tools
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="relative border-y border-gray-200 bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <h2 className="mb-3 text-3xl font-black text-gray-900 md:text-4xl">
              Six tools. One calm money brain.
            </h2>
            <p className="mx-auto max-w-xl text-lg text-gray-500">
              Everything is built for Indian taxes, instruments, and real-life milestones.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <Link
                  href={f.href}
                  className={cn(
                    "group flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300",
                    "hover:border-[#00D09C]/30 hover:shadow-md",
                  )}
                >
                  <div
                    className={cn(
                      "mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      `bg-gradient-to-br ${f.gradient}`,
                      "transition-transform group-hover:scale-110",
                    )}
                  >
                    <f.icon size={28} strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-[#00D09C]">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-14 text-center"
          >
            <h2 className="mb-3 text-3xl font-black text-gray-900 md:text-4xl">How it works</h2>
            <p className="text-gray-500">Three steps from signup to a living financial plan.</p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative rounded-2xl border border-gray-200 bg-white p-8 backdrop-blur-sm"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#00D09C]/10 text-sm font-bold text-[#00D09C]">
                  {i + 1}
                </span>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{s.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{s.body}</p>
                {i < steps.length - 1 ? (
                  <div
                    className="absolute -right-4 top-1/2 hidden h-px w-8 -translate-y-1/2 bg-[#00D09C]/30 md:block lg:w-12"
                    aria-hidden
                  />
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-gray-50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10 text-center"
          >
            <h2 className="text-2xl font-black text-gray-900 md:text-3xl">Built for scale</h2>
            <p className="mt-2 text-gray-500">Numbers that reflect real usage in simulations.</p>
          </motion.div>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {[
              {
                node: (
                  <AnimatedCounter
                    value={47000}
                    prefix="₹"
                    className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl"
                  />
                ),
                label: "avg tax savings",
              },
              {
                node: (
                  <AnimatedCounter
                    value={10000}
                    suffix="+"
                    className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl"
                  />
                ),
                label: "simulations run",
              },
              {
                node: (
                  <AnimatedCounter
                    value={6}
                    className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl"
                  />
                ),
                label: "financial dimensions",
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="font-black text-gray-900">{stat.node}</div>
                <p className="mt-2 text-sm font-medium uppercase tracking-wider text-gray-500">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-4xl rounded-3xl border border-[#00D09C]/20 bg-[#00D09C]/5 px-8 py-14 text-center"
        >
          <h2 className="text-3xl font-black text-gray-900 md:text-4xl">
            Start free. Stay in control.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-500">
            Join DhanGuru and let AI translate your goals into a plan you can actually follow.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#00D09C] px-10 py-4 text-lg font-bold text-white transition-all hover:bg-[#00B386] hover:shadow-xl"
          >
            Create your account
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00D09C] text-xs font-black text-white">
              ET
            </div>
            <span className="text-sm text-gray-500">DhanGuru Money Mentor</span>
          </div>
          <p className="text-xs text-gray-400">Economic Times Hackathon 2026</p>
        </div>
      </footer>
    </div>
  );
}
