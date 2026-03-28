/** Demo portfolio reconstruction from simple CSV (Fund Name, Invested, Current) or fallback sample. */

export interface ParsedHolding {
  fund_name: string;
  fund_house: string;
  category: string;
  current_value: number;
  invested_amount: number;
  xirr: number;
  expense_ratio: number;
}

export interface MfPortfolioResult {
  holdings: ParsedHolding[];
  portfolio_summary: {
    total_invested: number;
    total_current_value: number;
    total_returns: number;
    overall_xirr: number;
    expense_ratio_drag: number;
    overlap_pct: number;
  };
  overlap_analysis: Array<{ stock_name: string; funds_holding: string[]; total_weight_pct: number }>;
  rebalancing_suggestions: Array<{ action: string; fund_name: string; reason: string; target_allocation_pct?: number }>;
  ai_summary: string;
}

function parseCsv(text: string): Array<{ name: string; inv: number; cur: number }> {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const rows: Array<{ name: string; inv: number; cur: number }> = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]/).map((p) => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const name = parts[0];
    if (/fund|scheme|name/i.test(name) && rows.length === 0) continue;
    const nums = parts.slice(1).map((p) => parseFloat(p.replace(/[₹,]/g, ""))).filter((n) => !Number.isNaN(n));
    if (nums.length >= 2) {
      rows.push({ name, inv: nums[0], cur: nums[1] });
    } else if (nums.length === 1) {
      rows.push({ name, inv: nums[0], cur: nums[0] });
    }
  }
  return rows;
}

function demoHoldings(): ParsedHolding[] {
  return [
    {
      fund_name: "Nifty 50 Index Fund",
      fund_house: "Demo AMC",
      category: "large_cap_index",
      invested_amount: 400000,
      current_value: 512000,
      xirr: 14.2,
      expense_ratio: 0.2,
    },
    {
      fund_name: "Flexi Cap Fund",
      fund_house: "Demo AMC",
      category: "flexi_cap",
      invested_amount: 300000,
      current_value: 318000,
      xirr: 9.1,
      expense_ratio: 1.05,
    },
    {
      fund_name: "Corporate Bond Fund",
      fund_house: "Demo AMC",
      category: "debt",
      invested_amount: 200000,
      current_value: 214000,
      xirr: 7.3,
      expense_ratio: 0.35,
    },
  ];
}

export function buildPortfolioFromText(fileName: string, text: string): MfPortfolioResult {
  const parsed = parseCsv(text);
  const holdings: ParsedHolding[] =
    parsed.length > 0
      ? parsed.map((r) => {
          const ret = r.inv > 0 ? ((r.cur - r.inv) / r.inv) * 100 : 0;
          const xirrApprox = Math.min(22, Math.max(-15, ret * 0.35 + 8));
          return {
            fund_name: r.name.slice(0, 80),
            fund_house: "From statement",
            category: "unknown",
            invested_amount: Math.round(r.inv),
            current_value: Math.round(r.cur),
            xirr: Math.round(xirrApprox * 10) / 10,
            expense_ratio: 0.8,
          };
        })
      : demoHoldings();

  const total_invested = holdings.reduce((s, h) => s + h.invested_amount, 0);
  const total_current_value = holdings.reduce((s, h) => s + h.current_value, 0);
  const total_returns = total_current_value - total_invested;
  const wXirr = total_current_value > 0
    ? holdings.reduce((s, h) => s + h.xirr * h.current_value, 0) / total_current_value
    : 0;
  const expense_ratio_drag = Math.round(total_current_value * 0.0075);
  const overlap_pct = holdings.length > 2 ? 18 : 12;

  const overlap_analysis =
    holdings.length > 1
      ? [
          {
            stock_name: "HDFC Bank (illustrative)",
            funds_holding: holdings.slice(0, 2).map((h) => h.fund_name),
            total_weight_pct: overlap_pct,
          },
        ]
      : [];

  const rebalancing_suggestions = holdings.map((h, i) => ({
    action: h.category === "debt" ? "hold" : i === 0 ? "hold" : "trim",
    fund_name: h.fund_name,
    reason:
      h.expense_ratio > 0.8
        ? "Expense ratio above ~0.8% — consider index core."
        : "Within tolerance vs benchmark.",
    target_allocation_pct: Math.round(100 / holdings.length),
  }));

  const ai_summary =
    parsed.length > 0
      ? `Parsed ${parsed.length} line(s) from ${fileName}. Figures are approximate; for real XIRR/overlap use official CAS PDF parsing or upload to a verified tool.`
      : `No tabular data detected in file — showing a sample portfolio. Export CAMS/KFintech as CSV with columns: Fund Name, Invested, Current Value and re-upload.`;

  return {
    holdings,
    portfolio_summary: {
      total_invested,
      total_current_value,
      total_returns,
      overall_xirr: Math.round(wXirr * 10) / 10,
      expense_ratio_drag,
      overlap_pct,
    },
    overlap_analysis,
    rebalancing_suggestions,
    ai_summary,
  };
}
