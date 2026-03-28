export interface EducationCard {
  id: string;
  title: string;
  icon: string;
  emoji: string;
  color: string;
  summary: string;
  content: string;
  analogy: string;
  details: string;
  example?: string;
  refUrl?: string;
}

export interface SectionDeepDive {
  id: string;
  section: string;
  title: string;
  emoji: string;
  color: string;
  whatIsIt: string;
  whyItMatters: string;
  howItWorks: string;
  example: string;
  proTip: string;
  maxLimit: string;
  refUrl: string;
}

export interface TaxJourneyStep {
  step: number;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export const TAX_JOURNEY_STEPS: TaxJourneyStep[] = [
  { step: 1, label: "Your Salary (CTC)", emoji: "💰", description: "Your company pays you this total amount. This is the starting point — like the MRP on a product.", color: "emerald" },
  { step: 2, label: "Subtract Exemptions", emoji: "🏠", description: "HRA (if you pay rent), LTA, food coupons — these are removed first. Think of it as the first round of discounts.", color: "cyan" },
  { step: 3, label: "Standard Deduction", emoji: "✂️", description: "A flat ₹50K (old) or ₹75K (new) discount the government gives every salaried person automatically. No proof needed!", color: "amber" },
  { step: 4, label: "Deductions (80C, 80D, NPS...)", emoji: "🛡️", description: "The big discounts! Invest in PPF, ELSS, pay health insurance, contribute to NPS — and that much gets removed from your taxable amount.", color: "violet" },
  { step: 5, label: "Taxable Income", emoji: "📊", description: "What's left after all discounts. Tax is calculated only on this amount — not your full salary!", color: "sky" },
  { step: 6, label: "Apply Tax Slabs", emoji: "📏", description: "Different portions of your taxable income are taxed at different rates — like different tiers on a mobile recharge plan.", color: "orange" },
  { step: 7, label: "Subtract Rebate (87A)", emoji: "🎁", description: "If your taxable income is low enough (≤₹5L old / ≤₹12L new), the government gives you a rebate — your tax becomes zero or very low!", color: "pink" },
  { step: 8, label: "Add 4% Cess", emoji: "➕", description: "A small 4% extra charge on your tax for health and education. Everyone pays this. Final answer = your tax!", color: "red" },
];

export const TAX_EDUCATION_CARDS: EducationCard[] = [
  {
    id: "how-tax-works",
    title: "How Indian Income Tax Works",
    icon: "book",
    emoji: "📖",
    color: "amber",
    summary: "Understand income tax in 60 seconds — even if you've never filed before",
    content: "Imagine you earn ₹100 from a lemonade stand. The government says: 'I need some money to build roads, hospitals, and schools.' But instead of taking from all ₹100, they let you keep some for yourself first (deductions). Tax is only calculated on what's left.",
    analogy: "Think of it like ordering food on Swiggy:\n\n🍕 Your salary = the food price (MRP)\n🏷️ Deductions = discount coupons you apply\n💳 Taxable income = final amount after coupons\n📦 Tax slabs = delivery charges at different levels\n🧾 Cess = small packaging charge on top\n\nThe more coupons (deductions) you have, the less you pay!",
    details: "HERE'S WHAT ACTUALLY HAPPENS:\n\n1. Your company pays you a salary (called CTC — Cost to Company)\n2. From this, some parts are exempt (HRA, food coupons, etc.)\n3. Then you get a 'Standard Deduction' — a flat discount of ₹50,000 (old regime) or ₹75,000 (new regime)\n4. Then you can subtract investments (80C, 80D, NPS) — this is like applying discount coupons\n5. What's left = TAXABLE INCOME — this is the amount you actually pay tax on\n6. Tax is calculated in 'slabs' — different rates for different portions\n7. If your taxable income is low enough, you get a rebate (tax becomes zero!)\n8. Finally, 4% cess is added (a small extra charge for health & education)\n\nThis tool does ALL of this automatically. Just enter your numbers and see the magic!",
    example: "REAL EXAMPLE with ₹10 Lakh Salary (Old Regime):\n\n₹10,00,000 — Your salary\n- ₹50,000 — Standard deduction\n- ₹1,50,000 — 80C investments (PPF, ELSS)\n- ₹25,000 — Health insurance (80D)\n= ₹7,75,000 — Taxable income\n\nTax:\n₹0-2.5L = ₹0 (nil)\n₹2.5L-5L = ₹12,500 (5%)\n₹5L-7.75L = ₹55,000 (20%)\nTotal tax = ₹67,500\n+ 4% cess = ₹2,700\nFinal tax = ₹70,200\n\nWithout deductions, tax would be ₹1,17,000. You SAVED ₹46,800!",
    refUrl: "https://cleartax.in/s/income-tax-slabs",
  },
  {
    id: "old-vs-new",
    title: "Old Regime vs New Regime — Which to Choose?",
    icon: "scale",
    emoji: "⚖️",
    color: "cyan",
    summary: "India gives you 2 tax systems to pick from — here's how to decide in 10 seconds",
    content: "Imagine two mobile plans: Plan A (New Regime) has lower call rates but no free data. Plan B (Old Regime) has higher call rates but gives you lots of free data, free SMS, and free roaming. If you use a LOT of data (deductions), Plan B is cheaper. If you barely use data, Plan A wins.",
    analogy: "Think of it like two movie ticket options:\n\n🎬 NEW REGIME = Cheaper ticket (₹150) but no popcorn, no combo\n🎬 OLD REGIME = Expensive ticket (₹250) but includes popcorn, drink, nachos, parking\n\nIf you love combos (have many deductions like HRA, 80C, NPS), Old Regime saves money.\nIf you just want the movie (no deductions), New Regime is cheaper.",
    details: "NEW REGIME (Default since FY 2023-24):\n• Tax slabs: 0-4L nil, 4-8L at 5%, 8-12L at 10%, 12-16L at 15%, 16-20L at 20%, 20-24L at 25%, 24L+ at 30%\n• Standard deduction: ₹75,000\n• Almost NO other deductions — you lose HRA, 80C, 80D, NPS, home loan interest\n• Rebate: Zero tax if taxable income ≤ ₹12 lakh\n• Best for: People with salary under ₹12L, or those with very few deductions\n\nOLD REGIME:\n• Tax slabs: 0-2.5L nil, 2.5-5L at 5%, 5-10L at 20%, 10L+ at 30%\n• Standard deduction: ₹50,000\n• ALL deductions available — 80C, 80D, HRA, NPS, home loan, education loan, 80G\n• Rebate: Zero tax if taxable income ≤ ₹5 lakh\n• Best for: People with deductions totaling ₹3.75 lakh or more\n\nTHE GOLDEN RULE:\n• Your deductions > ₹3.75 lakh → Old Regime usually saves more\n• Your deductions < ₹1.5 lakh → New Regime is almost always better\n• In between → Enter your numbers here and we'll calculate BOTH!",
    example: "EXAMPLE — Same person, both regimes:\nSalary: ₹18L | HRA exemption: ₹2.1L | 80C: ₹1.5L | NPS: ₹50K | 80D: ₹20K | Home loan: ₹40K\n\nOLD REGIME: Deductions = ₹5.1L → Taxable = ₹12.4L → Tax = ₹1,74,720\nNEW REGIME: No deductions → Taxable = ₹17.23L → Tax = ₹1,82,520\n\nOld Regime saves ₹7,800! But if this person had NO deductions, New Regime would save ₹1.2L+",
    refUrl: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
  },
  {
    id: "key-terms",
    title: "Every Tax Term Explained — Like You're 10",
    icon: "glossary",
    emoji: "📚",
    color: "emerald",
    summary: "What does HRA, 80C, Cess, or Form 16 mean? Simple explanations for every term on this page",
    content: "Tax jargon can feel like a foreign language. But every term is actually simple once you understand the concept behind it. Below, we explain every term you'll see on this page — using everyday Indian examples that anyone can understand.",
    analogy: "Think of the tax system like a school report card:\n\n📝 Gross Salary = Total marks possible (100)\n✏️ Deductions = Bonus marks for good behavior (extra credit)\n📊 Taxable Income = Marks after adding bonus (this determines your grade)\n🎓 Tax Slabs = Grade boundaries (A, B, C)\n🏫 Cess = School development fund contribution\n📋 Form 16 = Your final report card from school",
    details: "DETAILED GLOSSARY:\n\nCTC (Cost to Company): Total amount your company spends on you per year. Includes salary + PF + gratuity + bonuses. This is the 'MRP' of your employment.\n\nGross Salary: Your CTC minus employer's PF and gratuity. This is what shows on your Form 16 Part B.\n\nHRA (House Rent Allowance): Part of your salary meant for paying rent. If you actually pay rent and live in a rented house, a portion of HRA becomes tax-free. It's like getting a discount coupon for rent. Formula: min(Actual HRA, 50/40% of Basic, Rent - 10% of Basic). Only works in Old Regime.\n\nSection 80C: The BIGGEST tax-saving tool. Invest up to ₹1.5 lakh in any of these: PPF, ELSS mutual funds, EPF, life insurance, tax-saver FD, home loan principal, children's tuition fees. That entire amount gets subtracted from your taxable income. Think of it as a ₹1.5 lakh coupon on your tax bill.\n\nSection 80D: Pay for health insurance and get a tax deduction. Self/family: up to ₹25,000 (₹50,000 if senior citizen). Parents: additional ₹25,000-₹50,000. It's like the government rewarding you for being health-conscious.\n\nNPS (National Pension System): A government retirement scheme. You get an EXTRA ₹50,000 deduction under 80CCD(1B) — this is ABOVE AND BEYOND the ₹1.5L 80C limit. Catch: locked till age 60.\n\nStandard Deduction: A flat discount every salaried person gets automatically. ₹50K in Old Regime, ₹75K in New Regime. No proof needed — it's free money!\n\nCess: A 4% extra charge on your tax amount. It funds health and education programs. If your tax is ₹1,00,000, cess = ₹4,000. Total = ₹1,04,000. Everyone pays it.\n\nRebate u/s 87A: A gift from the government — if your taxable income is below a threshold (₹5L old / ₹12L new), your entire tax is returned to you. Effectively zero tax!\n\nForm 16: Your tax report card from your employer. Part A = how much TDS (tax deducted from salary) was deposited. Part B = your salary breakup, deductions, and tax calculation. You need this to file your ITR (Income Tax Return).\n\nELSS: Equity Linked Savings Scheme — a type of mutual fund. Why it's special: gives 80C deduction + only 3-year lock-in (shortest among 80C options) + potential 12-15% returns. Best for young investors.\n\nPPF: Public Provident Fund — government savings scheme. ~7.1% guaranteed returns. 15-year lock-in. Completely tax-free (at investment, interest, AND withdrawal). Best for risk-averse savers.\n\nEPF: Employee Provident Fund — automatically deducted from your salary (12% of basic). Your employer matches it. Qualifies under 80C. You get it when you retire or leave your job.\n\nTaxable Income: Your income AFTER subtracting all deductions. Tax is calculated ONLY on this number — not your full salary. The whole game is to legally reduce this number.",
    refUrl: "https://cleartax.in/s/80c-80-deductions",
  },
];

export const SECTION_DEEP_DIVES: SectionDeepDive[] = [
  {
    id: "80c",
    section: "Section 80C",
    title: "The ₹1.5 Lakh Tax Coupon",
    emoji: "🎫",
    color: "emerald",
    whatIsIt: "Section 80C is like a ₹1,50,000 discount coupon that the government gives every taxpayer. Invest in specific things and that amount is subtracted from your taxable income.",
    whyItMatters: "If you're in the 30% tax bracket, investing ₹1.5L in 80C saves you ₹46,800 in tax (₹1.5L × 30% × 1.04 cess). That's almost ₹4,000 per month back in your pocket!",
    howItWorks: "1. You invest/spend money on eligible items (PPF, ELSS, EPF, life insurance, home loan principal, kids' school fees)\n2. Add up all these investments (capped at ₹1,50,000)\n3. This total is subtracted from your income before tax is calculated\n4. You pay tax on a smaller amount → you save money!",
    example: "Rahul earns ₹12L/year. Without 80C, his taxable income is ₹11.5L (after std deduction). Tax = ₹1,42,500.\n\nHe invests: EPF ₹21,600 + PPF ₹50,000 + ELSS ₹50,000 + LI ₹28,400 = ₹1,50,000\n\nNow taxable income = ₹10L. Tax = ₹1,12,500. He SAVED ₹30,000!",
    proTip: "ELSS mutual funds are the best 80C option for young investors: only 3-year lock-in (vs 15 years for PPF) and potential 12-15% returns. Start a ₹12,500/month SIP in ELSS to max out 80C automatically.",
    maxLimit: "₹1,50,000 per year",
    refUrl: "https://cleartax.in/s/80c-80-deductions",
  },
  {
    id: "80d",
    section: "Section 80D",
    title: "Health Insurance = Tax Saving",
    emoji: "🏥",
    color: "pink",
    whatIsIt: "Pay your health insurance premium and the government rewards you with a tax deduction. It's like getting a cashback on your insurance!",
    whyItMatters: "A ₹5L family floater health insurance costs about ₹15,000-25,000/year. If you claim full 80D deduction, you save ₹7,500-₹15,000 in tax. So the insurance effectively costs you much less!",
    howItWorks: "1. Pay health insurance premium for self/spouse/children → deduction up to ₹25,000 (₹50,000 if you're a senior citizen)\n2. Pay for parents' health insurance → additional ₹25,000 (₹50,000 if parents are senior citizens)\n3. Preventive health check-up → ₹5,000 deduction (included in above limits)\n4. Maximum possible deduction: ₹1,00,000 (if both you and parents are senior citizens)",
    example: "Priya pays ₹18,000/year for her family health insurance + ₹12,000 for her parents' insurance + ₹5,000 preventive check-up = ₹35,000 total.\n\nHer 80D deduction = ₹25,000 (self) + ₹12,000 (parents) = ₹37,000 (capped at actual amounts).\n\nAt 30% bracket, she saves ₹11,544 in tax!",
    proTip: "Don't skip health insurance to save the premium — a single hospital visit can cost ₹2-5 lakh. The tax benefit makes insurance even cheaper. Also, the ₹5,000 preventive check-up is cash-deductible (rest needs digital payment).",
    maxLimit: "₹25K-₹1L depending on age",
    refUrl: "https://cleartax.in/s/medical-insurance",
  },
  {
    id: "hra",
    section: "Section 10(13A)",
    title: "Living on Rent? Save Tax on HRA",
    emoji: "🏠",
    color: "sky",
    whatIsIt: "If you live in a rented house and your salary has an HRA component, part of that HRA becomes tax-free. The government is basically saying: 'Since you're spending money on rent, we'll tax you less.'",
    whyItMatters: "HRA exemption can be HUGE — for someone paying ₹25K/month rent in Mumbai with ₹9L basic salary, the exemption is ₹2,10,000. At 30% bracket, that's ₹65,520 saved in tax!",
    howItWorks: "HRA Exemption = Minimum of these 3 numbers:\n\n(a) Actual HRA received from employer\n(b) 50% of Basic Salary (metro cities) or 40% (non-metro)\n(c) Actual Rent Paid − 10% of Basic Salary\n\nThe smallest of these three = your tax-free HRA.\n\nMetro cities = Mumbai, Delhi, Kolkata, Chennai\nNon-metro = everywhere else (Bangalore, Pune, Hyderabad are non-metro for this!)",
    example: "Amit in Mumbai: Basic ₹9L, HRA ₹3.6L, Rent ₹25K/month (₹3L/year)\n\n(a) Actual HRA = ₹3,60,000\n(b) 50% of Basic = ₹4,50,000\n(c) Rent − 10% Basic = ₹3,00,000 − ₹90,000 = ₹2,10,000\n\nMinimum = ₹2,10,000 → This amount is TAX-FREE!\n\nIMPORTANT: You MUST have rent receipts as proof. If rent > ₹1L/year, you need landlord's PAN too.",
    proTip: "Even if you live with parents, you can pay rent to them and claim HRA! Your parent declares it as rental income (which may be in a lower tax bracket). Keep a rent agreement and bank transfer proof.",
    maxLimit: "No fixed limit — depends on salary and rent",
    refUrl: "https://cleartax.in/s/hra-house-rent-allowance",
  },
  {
    id: "nps",
    section: "Section 80CCD(1B)",
    title: "NPS — The Extra ₹50K Deduction",
    emoji: "🏦",
    color: "violet",
    whatIsIt: "National Pension System (NPS) is a government retirement savings scheme. The special thing: you get an EXTRA ₹50,000 deduction that's ABOVE the ₹1.5L 80C limit. So with NPS + 80C, you can deduct up to ₹2,00,000!",
    whyItMatters: "This ₹50K extra deduction saves ₹15,600 in tax (at 30% bracket). Over 25 years of investing, the NPS corpus itself could grow to ₹50L+ depending on market returns.",
    howItWorks: "1. Open an NPS Tier-1 account (takes 10 minutes online on enps.nsdl.com)\n2. Invest up to ₹50,000 in a financial year\n3. Choose your asset allocation (equity/debt/government bonds)\n4. Claim ₹50,000 deduction under 80CCD(1B) — OVER and ABOVE 80C\n5. At age 60: withdraw 60% as tax-free lumpsum, buy annuity with remaining 40%",
    example: "Sneha invests ₹50,000 in NPS Tier-1 and already maxes out her ₹1.5L in 80C.\n\nTotal deduction = ₹1,50,000 (80C) + ₹50,000 (NPS) = ₹2,00,000\n\nAt 30% bracket: saves ₹62,400 in tax (vs ₹46,800 without NPS). Extra ₹15,600 saved!",
    proTip: "NPS has a lock-in until age 60 (partial withdrawal allowed after 3 years for specific reasons). The returns are market-linked (8-12% historically). If you want the tax benefit but hate lock-in, ELSS (3-year lock-in) is a better alternative.",
    maxLimit: "₹50,000 (additional to 80C)",
    refUrl: "https://cleartax.in/s/nps-national-pension-scheme",
  },
  {
    id: "24b",
    section: "Section 24(b)",
    title: "Home Loan? Your Interest is Deductible",
    emoji: "🏡",
    color: "orange",
    whatIsIt: "If you have a home loan, the interest you pay to the bank can be deducted from your taxable income. Up to ₹2,00,000 per year for a self-occupied property. The principal repayment also qualifies under 80C!",
    whyItMatters: "On a ₹50L home loan at 8.5% interest, you pay about ₹4.2L interest in the first year. Claiming ₹2L deduction saves you ₹62,400 in tax (at 30% bracket). Over 20 years, the total tax savings can be ₹8-12 lakh.",
    howItWorks: "1. Take a home loan from a bank/NBFC for buying/constructing a house\n2. Each year, the interest portion of your EMI is deductible\n3. Self-occupied property: max ₹2,00,000 deduction\n4. Let-out (rented) property: ENTIRE interest is deductible (no limit!)\n5. Claim in your ITR — your bank gives you an interest certificate",
    example: "Vikram has a ₹40L home loan at 8.5% for 20 years.\nEMI = ₹34,716/month\nYear 1: Interest paid = ₹3,37,440 | Principal = ₹79,152\n\nHe claims: ₹2,00,000 under 24(b) + ₹79,152 under 80C\nAt 30% bracket: saves ₹86,901 in tax!\n\nHis effective EMI drops from ₹34,716 to ₹27,476/month after tax savings.",
    proTip: "If your home loan interest is only ₹40K (like in the sample data), you're using just 20% of the ₹2L limit. This is fine — don't take a bigger loan just for tax benefits! The deduction is a bonus, not the reason to buy a house.",
    maxLimit: "₹2,00,000 for self-occupied",
    refUrl: "https://cleartax.in/s/home-loan-tax-benefit",
  },
];

export const GLOSSARY_TERMS = [
  { term: "CTC", full: "Cost to Company", simple: "Total amount your company spends on you per year. Like the MRP of your employment.", emoji: "💼" },
  { term: "HRA", full: "House Rent Allowance", simple: "Salary component for rent. If you pay rent, part of this becomes tax-free — like a discount coupon for rent.", emoji: "🏠" },
  { term: "80C", full: "Section 80C", simple: "Invest up to ₹1.5L in PPF/ELSS/EPF and that entire amount is tax-free. The biggest tax coupon!", emoji: "🎫" },
  { term: "80D", full: "Section 80D", simple: "Pay health insurance → get up to ₹25K-₹1L deducted from taxable income. Like cashback on insurance!", emoji: "🏥" },
  { term: "NPS", full: "National Pension System", simple: "Government retirement fund. Extra ₹50K deduction ABOVE 80C. Locked till 60, but great tax benefit.", emoji: "🏦" },
  { term: "ELSS", full: "Equity Linked Savings Scheme", simple: "Tax-saving mutual fund. 3-year lock-in (shortest in 80C!), ~12-15% returns. Best for young investors.", emoji: "📈" },
  { term: "PPF", full: "Public Provident Fund", simple: "Government savings. 15-year lock-in, ~7.1% guaranteed, completely tax-free. Best for zero-risk savers.", emoji: "🏛️" },
  { term: "EPF", full: "Employee Provident Fund", simple: "12% auto-deducted from salary. Employer matches it. Like forced savings — you get it when you retire/leave.", emoji: "🔒" },
  { term: "Cess", full: "Health & Education Cess", simple: "4% surcharge on your tax. Funds hospitals and schools. ₹1L tax → ₹4K cess → ₹1.04L total.", emoji: "➕" },
  { term: "87A", full: "Rebate under Section 87A", simple: "Government gift: zero tax if income < ₹5L (old) or ₹12L (new regime). Like a full refund!", emoji: "🎁" },
  { term: "Form 16", full: "TDS Certificate", simple: "Your tax report card from your employer. Shows salary, deductions, and tax paid. Need it to file ITR.", emoji: "📋" },
  { term: "Slab Rate", full: "Income Tax Slab", simple: "Different % rates for different income levels. Like Jio plans — more data, higher price.", emoji: "📏" },
  { term: "TDS", full: "Tax Deducted at Source", simple: "Tax your employer already paid to govt from your salary. When you file ITR, you settle the difference.", emoji: "✂️" },
  { term: "ITR", full: "Income Tax Return", simple: "Annual form you file to tell the government how much you earned and what tax you owe. Due July 31.", emoji: "📝" },
];
