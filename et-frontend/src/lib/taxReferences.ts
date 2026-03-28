export interface TaxRef {
  label: string;
  url: string;
  section: string;
  explanation?: string;
  learnMoreUrl?: string;
}

export const TAX_REFERENCES: Record<string, TaxRef> = {
  slabs_new: {
    label: "New Regime Tax Slabs (Budget 2025)",
    url: "https://cleartax.in/s/income-tax-slabs",
    section: "Section 115BAC",
    explanation: "Budget 2025 introduced revised slabs: 0-4L nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, 24L+ 30%. Standard deduction ₹75,000. Rebate u/s 87A up to ₹60K if taxable income ≤ ₹12L.",
    learnMoreUrl: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
  },
  slabs_old: {
    label: "Old Regime Tax Slabs",
    url: "https://cleartax.in/s/income-tax-slabs",
    section: "Section 2-10",
    explanation: "Old regime slabs: 0-2.5L nil, 2.5-5L 5%, 5-10L 20%, 10L+ 30%. Standard deduction ₹50,000. Rebate u/s 87A up to ₹12,500 if taxable income ≤ ₹5L. Allows all Chapter VI-A deductions.",
    learnMoreUrl: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
  },
  section_80c: {
    label: "Section 80C – Tax Saving Investments",
    url: "https://cleartax.in/s/80c-80-deductions",
    section: "Section 80C",
    explanation: "Deduction up to ₹1,50,000 for: EPF, PPF, ELSS mutual funds, life insurance premiums, NSC, tax-saver FDs (5-year), tuition fees (max 2 children), home loan principal repayment, Sukanya Samriddhi.",
    learnMoreUrl: "https://cleartax.in/s/80c-80-deductions",
  },
  section_80d: {
    label: "Section 80D – Health Insurance Premium",
    url: "https://cleartax.in/s/medical-insurance",
    section: "Section 80D",
    explanation: "Deduction for health insurance premiums: ₹25,000 for self/spouse/children (₹50,000 if senior citizen). Additional ₹25,000-50,000 for parents. Preventive health check-up ₹5,000 within this limit.",
    learnMoreUrl: "https://cleartax.in/s/medical-insurance",
  },
  hra: {
    label: "HRA Exemption – House Rent Allowance",
    url: "https://cleartax.in/s/hra-house-rent-allowance",
    section: "Section 10(13A)",
    explanation: "HRA Exemption = minimum of: (a) Actual HRA received, (b) 50% of basic salary for metro cities (Mumbai, Delhi, Kolkata, Chennai) / 40% for non-metro, (c) Rent paid minus 10% of basic salary. Requires rent receipts as proof. Only available in Old Regime.",
    learnMoreUrl: "https://cleartax.in/s/hra-house-rent-allowance",
  },
  nps_80ccd: {
    label: "NPS – National Pension System",
    url: "https://cleartax.in/s/nps-national-pension-scheme",
    section: "Section 80CCD(1B)",
    explanation: "Additional ₹50,000 deduction OVER AND ABOVE the Section 80C limit of ₹1.5L. Only for NPS Tier-1 contributions. At retirement (age 60), 60% of corpus is tax-free lumpsum, 40% must be used for annuity.",
    learnMoreUrl: "https://cleartax.in/s/nps-national-pension-scheme",
  },
  section_24b: {
    label: "Home Loan Interest Deduction",
    url: "https://cleartax.in/s/home-loan-tax-benefit",
    section: "Section 24(b)",
    explanation: "Deduction up to ₹2,00,000 on interest paid on home loan for self-occupied property. For let-out property, entire interest is deductible. Principal repayment qualifies under 80C.",
    learnMoreUrl: "https://cleartax.in/s/home-loan-tax-benefit",
  },
  rebate_87a: {
    label: "Rebate under Section 87A",
    url: "https://cleartax.in/s/income-tax-rebate-us-87a",
    section: "Section 87A",
    explanation: "Old Regime: Rebate up to ₹12,500 if total taxable income ≤ ₹5,00,000 (effectively zero tax). New Regime (Budget 2025): Rebate up to ₹60,000 if total taxable income ≤ ₹12,00,000.",
    learnMoreUrl: "https://cleartax.in/s/income-tax-rebate-us-87a",
  },
  section_80e: {
    label: "Education Loan Interest Deduction",
    url: "https://cleartax.in/s/section-80e-deduction-interest-education-loan",
    section: "Section 80E",
    explanation: "Deduction on interest paid on education loan. NO upper limit. Available for 8 years from the year you start repaying. Loan must be for higher education of self, spouse, children, or a student you are legal guardian of.",
    learnMoreUrl: "https://cleartax.in/s/section-80e-deduction-interest-education-loan",
  },
  section_80tta: {
    label: "Savings Account Interest Deduction",
    url: "https://cleartax.in/s/claiming-deduction-on-interest-under-section-80tta",
    section: "Section 80TTA",
    explanation: "Deduction up to ₹10,000 on interest earned from savings bank accounts (not fixed deposits). For senior citizens, Section 80TTB allows up to ₹50,000.",
    learnMoreUrl: "https://cleartax.in/s/claiming-deduction-on-interest-under-section-80tta",
  },
  form16: {
    label: "Understanding Form 16",
    url: "https://cleartax.in/Guide/UnderstandingForm16",
    section: "Rule 31(1)(a)",
    explanation: "Form 16 is the TDS certificate issued by your employer. Part A shows TDS deducted and deposited. Part B shows salary breakup, deductions claimed, and tax computation. Required for filing ITR.",
    learnMoreUrl: "https://cleartax.in/Guide/UnderstandingForm16",
  },
  efiling: {
    label: "Income Tax e-Filing Portal",
    url: "https://eportal.incometax.gov.in/iec/foservices/#/login",
    section: "ITR Filing",
    explanation: "Official portal for filing Income Tax Returns (ITR). Use ITR-1 (Sahaj) for salaried individuals with income up to ₹50L. Due date: July 31 for non-audit cases.",
    learnMoreUrl: "https://cleartax.in/s/how-to-e-file-your-income-tax-return",
  },
  standard_deduction: {
    label: "Standard Deduction from Salary",
    url: "https://cleartax.in/s/income-tax-slabs",
    section: "Section 16(ia)",
    explanation: "Flat deduction from salary income. Old Regime: ₹50,000. New Regime (Budget 2025): ₹75,000. No proof or investment required — automatically available to all salaried individuals.",
    learnMoreUrl: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
  },
  cess: {
    label: "Health & Education Cess (4%)",
    url: "https://cleartax.in/s/income-tax-slabs",
    section: "Finance Act",
    explanation: "4% cess is charged on total income tax (including surcharge if applicable). This funds health and education initiatives. Calculated as: Tax × 0.04. Not deductible from taxable income.",
    learnMoreUrl: "https://cleartax.in/s/income-tax-slabs",
  },
  budget_2025: {
    label: "Union Budget 2025-26",
    url: "https://www.indiabudget.gov.in/",
    section: "Finance Act 2025",
    explanation: "The Union Budget 2025 introduced new tax slabs for the New Regime, increased standard deduction to ₹75,000, and raised the rebate limit to ₹12L. All calculations on this page use Budget 2025 rates.",
    learnMoreUrl: "https://www.indiabudget.gov.in/",
  },
  regime_comparison: {
    label: "Old vs New Regime Comparison",
    url: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
    section: "Regime Choice",
    explanation: "Every salaried individual can choose between Old and New Regime each year. New Regime is default since FY 2023-24. You need to opt-out to use Old Regime by filing Form 10-IEA.",
    learnMoreUrl: "https://cleartax.in/s/old-tax-regime-vs-new-tax-regime",
  },
};

export function getRefForSection(section: string): TaxRef | undefined {
  const key = section.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (key.includes("80c") && !key.includes("80ccd")) return TAX_REFERENCES.section_80c;
  if (key.includes("80ccd") || key.includes("nps")) return TAX_REFERENCES.nps_80ccd;
  if (key.includes("80d")) return TAX_REFERENCES.section_80d;
  if (key.includes("80e")) return TAX_REFERENCES.section_80e;
  if (key.includes("80tta") || key.includes("80ttb")) return TAX_REFERENCES.section_80tta;
  if (key.includes("24b") || key.includes("homeloan")) return TAX_REFERENCES.section_24b;
  if (key.includes("hra") || key.includes("1013a")) return TAX_REFERENCES.hra;
  if (key.includes("87a") || key.includes("rebate")) return TAX_REFERENCES.rebate_87a;
  return undefined;
}
