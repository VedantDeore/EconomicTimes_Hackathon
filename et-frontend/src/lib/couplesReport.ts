import type { CouplesFullResult } from "@/lib/engine/couples";

function inr(n: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function scoreColor(s: number): string {
  if (s >= 70) return "#059669";
  if (s >= 45) return "#d97706";
  return "#dc2626";
}

function row(cells: string[], isHeader = false): string {
  const tag = isHeader ? "th" : "td";
  const style = isHeader
    ? 'style="background:#f1f5f9;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;padding:10px 14px;border:1px solid #e2e8f0;text-align:left;color:#475569"'
    : 'style="padding:10px 14px;border:1px solid #e2e8f0;font-size:13px;color:#1e293b"';
  return `<tr>${cells.map((c) => `<${tag} ${style}>${c}</${tag}>`).join("")}</tr>`;
}

export function downloadCouplesReport(result: CouplesFullResult): void {
  const nA = result.partnerA.name || "Partner A";
  const nB = result.partnerB.name || "Partner B";
  const c = result.compatibility;
  const t = result.tax;
  const f = result.fire;
  const s = result.fairSplit;
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Couples Financial Report — DhanGuru</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#1e293b;max-width:820px;margin:0 auto;padding:40px 32px;line-height:1.6}
  h1{font-size:22px;color:#059669;border-bottom:3px solid #059669;padding-bottom:10px;margin-bottom:4px}
  h2{font-size:16px;color:#0f766e;margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
  h3{font-size:13px;color:#334155;margin:16px 0 8px}
  .subtitle{font-size:12px;color:#64748b;margin-bottom:24px}
  .badge{display:inline-block;padding:4px 16px;border-radius:99px;font-weight:700;font-size:13px}
  .badge-green{background:#d1fae5;color:#065f46}
  .badge-amber{background:#fef3c7;color:#92400e}
  .badge-red{background:#fee2e2;color:#991b1b}
  table{width:100%;border-collapse:collapse;margin:12px 0}
  .metric-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin:16px 0}
  .metric-card{border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px}
  .metric-label{font-size:10px;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;font-weight:600}
  .metric-value{font-size:22px;font-weight:700;color:#059669;margin-top:2px}
  .metric-sub{font-size:11px;color:#94a3b8;margin-top:2px}
  .score-bar{height:8px;border-radius:4px;background:#e2e8f0;margin-top:4px;overflow:hidden}
  .score-fill{height:100%;border-radius:4px}
  .insight{font-size:11px;color:#64748b;margin-top:6px;line-height:1.5}
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:12px 0}
  .card{border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px}
  .disclaimer{margin-top:36px;padding:14px 18px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;font-size:11px;color:#854d0e;line-height:1.6}
  .footer{margin-top:20px;text-align:center;font-size:10px;color:#94a3b8}
  @media print{
    body{padding:20px 16px}
    h2{break-before:auto}
    .no-break{break-inside:avoid}
  }
</style>
</head>
<body>

<h1>DhanGuru — Couples Financial Report</h1>
<p class="subtitle">${nA} & ${nB} &bull; Generated on ${date}</p>

<!-- ============ COMPATIBILITY ============ -->
<h2>Money Compatibility Score</h2>
<div class="no-break" style="text-align:center;margin:20px 0">
  <span class="badge ${c.overall_score >= 70 ? "badge-green" : c.overall_score >= 45 ? "badge-amber" : "badge-red"}"
    style="font-size:28px;padding:8px 28px">${c.overall_score}/100</span>
  <p style="margin-top:8px;font-size:14px;font-weight:600;color:#334155">${c.grade}</p>
</div>

<table>
  ${row(["Dimension", "Score", "Insight"], true)}
  ${c.dimensions.map((d) => row([
    d.label,
    `<span style="font-weight:700;color:${scoreColor(d.score)}">${d.score}</span>`,
    `<span style="font-size:11px;color:#64748b">${d.insight}</span>`,
  ])).join("")}
</table>

${c.strengths.length > 0 ? `
<h3>Strengths</h3>
<ul style="padding-left:18px;font-size:12px;color:#065f46">
  ${c.strengths.map((s) => `<li style="margin-bottom:4px">${s}</li>`).join("")}
</ul>` : ""}

${c.growth_areas.length > 0 ? `
<h3>Areas to Improve</h3>
<ul style="padding-left:18px;font-size:12px;color:#92400e">
  ${c.growth_areas.map((g) => `<li style="margin-bottom:4px">${g}</li>`).join("")}
</ul>` : ""}

<!-- ============ KEY NUMBERS ============ -->
<h2>Key Financial Numbers</h2>
<div class="metric-grid no-break">
  <div class="metric-card">
    <div class="metric-label">Combined Net Worth</div>
    <div class="metric-value">${inr(t.combined_net_worth)}</div>
    <div class="metric-sub">Investments minus debts</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Joint Tax Savings</div>
    <div class="metric-value">${inr(t.total_savings_vs_naive)}</div>
    <div class="metric-sub">vs both on new regime</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">FIRE Target</div>
    <div class="metric-value">${inr(f.fire_number)}</div>
    <div class="metric-sub">${f.years_to_fire < 50 ? f.years_to_fire + " years to reach" : "50+ years"}</div>
  </div>
</div>

<!-- ============ TAX ============ -->
<h2>Tax Optimization</h2>
<div class="metric-grid no-break">
  <div class="metric-card">
    <div class="metric-label">Optimised Combined Tax</div>
    <div class="metric-value">${inr(t.combined_optimal_tax)}</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Naive Combined Tax</div>
    <div class="metric-value" style="color:#64748b">${inr(t.naive_combined_tax)}</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">You Save</div>
    <div class="metric-value">${inr(t.total_savings_vs_naive)}</div>
  </div>
</div>

<div class="two-col no-break">
  <div class="card">
    <div style="font-weight:600;color:#059669;margin-bottom:6px">${nA}</div>
    <div style="font-size:12px;color:#64748b">
      Old Regime: ${inr(t.tax_a.old)} (taxable ${inr(t.tax_a.taxable_old)})<br>
      New Regime: ${inr(t.tax_a.new)} (taxable ${inr(t.tax_a.taxable_new)})
    </div>
    <div style="margin-top:8px;font-size:13px">Best: <strong style="color:#059669">${t.tax_a.best === "old" ? "Old" : "New"} Regime</strong></div>
  </div>
  <div class="card">
    <div style="font-weight:600;color:#0891b2;margin-bottom:6px">${nB}</div>
    <div style="font-size:12px;color:#64748b">
      Old Regime: ${inr(t.tax_b.old)} (taxable ${inr(t.tax_b.taxable_old)})<br>
      New Regime: ${inr(t.tax_b.new)} (taxable ${inr(t.tax_b.taxable_new)})
    </div>
    <div style="margin-top:8px;font-size:13px">Best: <strong style="color:#0891b2">${t.tax_b.best === "old" ? "Old" : "New"} Regime</strong></div>
  </div>
</div>

<h3>Optimisation Strategies</h3>
<table>
  ${row(["Strategy", "Suggestion", "Potential Savings"], true)}
  ${row(["HRA — Claim by " + t.hra.claimant_label, t.hra.explanation.slice(0, 120) + "…", inr(t.hra.savings)])}
  ${row(["80C Split", t.split_80c.suggestion.slice(0, 120) + "…", inr(t.split_80c.potential_savings)])}
  ${row(["Insurance", t.insurance.suggestion.slice(0, 120) + "…", inr(t.insurance.potential_savings)])}
  ${row(["NPS Strategy", t.nps.suggestion.slice(0, 120) + "…", inr(t.nps.potential_savings)])}
  ${row(["SIP Split", t.sip.suggestion.slice(0, 120) + "…", inr(t.sip.potential_savings)])}
</table>

<!-- ============ FIRE ============ -->
<h2>Joint FIRE Projection</h2>
<div class="metric-grid no-break">
  <div class="metric-card">
    <div class="metric-label">Years to FIRE</div>
    <div class="metric-value">${f.years_to_fire < 50 ? f.years_to_fire : "50+"}</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Success Probability</div>
    <div class="metric-value">${f.success_probability}%</div>
    <div class="metric-sub">1,000 Monte Carlo simulations</div>
  </div>
  <div class="metric-card">
    <div class="metric-label">Current Corpus</div>
    <div class="metric-value">${inr(f.current_corpus)}</div>
  </div>
</div>

<table>
  ${row(["FIRE Variant", "Target Corpus", "What It Means"], true)}
  ${row(["Lean FIRE", inr(f.lean_fire), "70% of current expenses — frugal retirement"])}
  ${row(["Regular FIRE", inr(f.fire_number), "100% of current expenses — comfortable"])}
  ${row(["Fat FIRE", inr(f.fat_fire), "130% of current expenses — generous lifestyle"])}
  ${row(["Coast FIRE", inr(f.coast_fire), "Invest this much now, no more SIP needed"])}
</table>

<div class="two-col no-break">
  <div class="card" style="background:#f0fdf4">
    <div class="metric-label">Recommended Monthly SIP</div>
    <div class="metric-value">${inr(f.monthly_sip_needed)}</div>
    <div class="metric-sub">To reach FIRE in optimal timeframe</div>
  </div>
  <div class="card">
    <div style="font-size:12px;color:#64748b">
      <strong>${nA}'s share:</strong> ${inr(f.sip_split_a)}/month<br>
      <strong>${nB}'s share:</strong> ${inr(f.sip_split_b)}/month<br>
      <span style="font-size:11px">(Split proportionally by income)</span>
    </div>
  </div>
</div>

${f.milestones.length > 0 ? `
<h3>Milestones</h3>
<table>
  ${row(["Year", "Milestone", "Corpus", "Progress"], true)}
  ${f.milestones.map((m) => row([
    `Year ${m.year}`,
    `<strong>${m.label}</strong>`,
    inr(m.corpus),
    `${m.pct}%`,
  ])).join("")}
</table>` : ""}

<!-- ============ FAIR SPLIT ============ -->
<h2>Fair Expense Split</h2>
<p style="font-size:12px;color:#64748b;margin-bottom:12px">
  Income ratio — ${nA}: ${s.ratio_a}% | ${nB}: ${s.ratio_b}% &bull;
  Recommended: <strong>${s.recommended === "proportional" ? "Proportional" : "Equal"} split</strong>
</p>
<p style="font-size:12px;color:#475569;margin-bottom:12px">${s.insight}</p>

<table>
  ${row(["Category", "Total", nA + " (Proportional)", nB + " (Proportional)", nA + " (Equal)", nB + " (Equal)"], true)}
  ${s.categories.map((c) => row([c.category, inr(c.total), inr(c.prop_a), inr(c.prop_b), inr(c.equal_a), inr(c.equal_b)])).join("")}
  ${row([
    "<strong>Total</strong>",
    `<strong>${inr(s.total_monthly)}</strong>`,
    `<strong>${inr(s.prop_a_total)}</strong>`,
    `<strong>${inr(s.prop_b_total)}</strong>`,
    `<strong>${inr(s.equal_each)}</strong>`,
    `<strong>${inr(s.equal_each)}</strong>`,
  ])}
</table>

<div class="two-col no-break">
  <div class="card" style="background:#f0fdf4">
    <div class="metric-label">${nA} — Monthly Disposable</div>
    <div class="metric-value">${inr(s.disposable_a)}</div>
    <div class="metric-sub">After proportional expense share</div>
  </div>
  <div class="card" style="background:#ecfeff">
    <div class="metric-label">${nB} — Monthly Disposable</div>
    <div class="metric-value" style="color:#0891b2">${inr(s.disposable_b)}</div>
    <div class="metric-sub">After proportional expense share</div>
  </div>
</div>

<!-- ============ PARTNER DETAILS ============ -->
<h2>Input Details (for reference)</h2>
<table>
  ${row(["Field", nA, nB], true)}
  ${row(["Gross Salary", inr(result.partnerA.gross_salary), inr(result.partnerB.gross_salary)])}
  ${row(["Basic Salary", inr(result.partnerA.basic_salary), inr(result.partnerB.basic_salary)])}
  ${row(["HRA Received", inr(result.partnerA.hra_received), inr(result.partnerB.hra_received)])}
  ${row(["Section 80C", inr(result.partnerA.sec_80c), inr(result.partnerB.sec_80c)])}
  ${row(["Total Investments", inr(result.partnerA.total_investments), inr(result.partnerB.total_investments)])}
  ${row(["Total Debts", inr(result.partnerA.total_debts), inr(result.partnerB.total_debts)])}
  ${row(["Age", String(result.partnerA.age), String(result.partnerB.age)])}
  ${row(["Monthly Expenses", inr(result.partnerA.monthly_expenses), inr(result.partnerB.monthly_expenses)])}
  ${row(["Monthly SIP", inr(result.partnerA.monthly_sip), inr(result.partnerB.monthly_sip)])}
  ${row(["Emergency Fund", inr(result.partnerA.emergency_fund), inr(result.partnerB.emergency_fund)])}
  ${row(["Risk Profile", result.partnerA.risk_profile, result.partnerB.risk_profile])}
  ${row(["Shared Monthly Rent", inr(result.monthlyRent), "—"])}
</table>

<div class="disclaimer">
  <strong>Disclaimer:</strong> This report is generated by DhanGuru for educational and illustrative purposes only.
  It is not financial, tax, or legal advice. Tax computations are based on Indian Income Tax rules for FY 2025-26
  and may not reflect your exact situation. Always consult a qualified Chartered Accountant or SEBI-registered
  financial advisor before making investment or tax decisions. Past performance does not guarantee future results.
  The FIRE projections use Monte Carlo simulations with assumed returns and may vary significantly from actual outcomes.
</div>

<p class="footer">Generated by DhanGuru — Your AI-Powered Financial Wellness Platform &bull; ${date}</p>

</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to download the report.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    setTimeout(() => win.print(), 300);
  };
}
