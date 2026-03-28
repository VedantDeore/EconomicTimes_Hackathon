/** Copy for FIRE planner — how to use + example flows (for judges & users). */

export const FIRE_USE_CASES = [
  {
    title: "First job, building foundation",
    steps: [
      "Click “Fill from profile” so corpus = emergency + investments and expenses match your Money Profile.",
      "Set Age and Retire at (e.g. 24 → 50). Keep one life goal such as Home down payment with target date and saved-so-far.",
      "Hit Generate: check Total SIP vs your salary surplus; use the month-by-month table as a discipline checklist.",
    ],
  },
  {
    title: "Mid-career with multiple goals",
    steps: [
      "Add Home, Education, Wedding as separate rows with different target dates — each gets its own horizon-based SIP.",
      "Do not use category “Retirement” for funding math (that’s the FIRE corpus). Use Home/Education/etc. for dated lumps.",
      "Earmark “Saved” per goal; whatever is left in Existing corpus seeds the retirement/FIRE bucket automatically.",
    ],
  },
  {
    title: "Checking if FIRE date is realistic",
    steps: [
      "Tune inflation and expected return (conservative is better for stress-testing).",
      "Compare retirement SIP + life-goal SIPs to monthly surplus; if short, push Retire at later or trim goal targets.",
      "Read glide path: equity should fall as you approach retirement — rebalance yearly in real life.",
    ],
  },
] as const;

export function defaultTargetDateYearsAhead(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10);
}
