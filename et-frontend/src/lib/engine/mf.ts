/* ── Types ─────────────────────────────────────────────────── */

export interface StockHolding {
  stock: string;
  weight: number; // % weight within the fund
}

export interface Transaction {
  date: string; // ISO
  amount: number;
  type: "purchase" | "redemption";
}

export interface ParsedHolding {
  fund_name: string;
  fund_house: string;
  category: string;
  current_value: number;
  invested_amount: number;
  xirr: number;
  expense_ratio: number;
  direct_expense_ratio: number;
  top_holdings: StockHolding[];
  transactions: Transaction[];
  purchase_date: string;
}

export interface OverlapEntry {
  stock_name: string;
  funds_holding: string[];
  weight_per_fund: number[];
  total_portfolio_weight: number;
}

export interface RebalanceSuggestion {
  action: "hold" | "trim" | "switch_to_direct" | "exit" | "increase";
  fund_name: string;
  reason: string;
  target_allocation_pct?: number;
  stcg_warning?: boolean;
  tax_note?: string;
  annual_savings?: number;
}

export interface MfPortfolioResult {
  holdings: ParsedHolding[];
  portfolio_summary: {
    total_invested: number;
    total_current_value: number;
    total_returns: number;
    total_returns_pct: number;
    overall_xirr: number;
    expense_ratio_drag: number;
    direct_expense_drag: number;
    annual_drag_savings: number;
    overlap_pct: number;
    num_funds: number;
    num_amcs: number;
  };
  category_allocation: Array<{ category: string; value: number; pct: number }>;
  overlap_analysis: OverlapEntry[];
  overlap_matrix: Array<{ fund_a: string; fund_b: string; shared_stocks: number; combined_weight: number }>;
  rebalancing_suggestions: RebalanceSuggestion[];
  ai_summary: string;
}

/* ── XIRR (Newton-Raphson) ────────────────────────────────── */

function daysBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

export function calculateXIRR(transactions: Transaction[], currentValue: number): number {
  if (!transactions.length) return 0;

  const cfs: Array<[number, Date]> = transactions.map(t => [
    t.type === "purchase" ? -Math.abs(t.amount) : Math.abs(t.amount),
    new Date(t.date),
  ]);
  cfs.push([currentValue, new Date()]);

  if (cfs.length < 2) return 0;

  const t0 = cfs[0][1];

  function xnpv(rate: number): number {
    return cfs.reduce((sum, [cf, dt]) => sum + cf / Math.pow(1 + rate, daysBetween(t0, dt) / 365), 0);
  }
  function xnpvDeriv(rate: number): number {
    return cfs.reduce((sum, [cf, dt]) => {
      const t = daysBetween(t0, dt) / 365;
      return sum - t * cf / Math.pow(1 + rate, t + 1);
    }, 0);
  }

  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const npv = xnpv(rate);
    const d = xnpvDeriv(rate);
    if (Math.abs(d) < 1e-12) break;
    const nr = rate - npv / d;
    if (Math.abs(nr - rate) < 1e-8) break;
    rate = nr;
  }
  return Math.round(rate * 10000) / 100;
}

/* ── Sample Portfolio ─────────────────────────────────────── */

function sampleHoldings(): ParsedHolding[] {
  return [
    {
      fund_name: "HDFC Top 100 Fund - Regular Growth",
      fund_house: "HDFC AMC",
      category: "Large Cap",
      invested_amount: 200000,
      current_value: 248000,
      xirr: 0,
      expense_ratio: 1.82,
      direct_expense_ratio: 1.08,
      top_holdings: [
        { stock: "HDFC Bank", weight: 9.2 },
        { stock: "Reliance Industries", weight: 8.1 },
        { stock: "Infosys", weight: 7.5 },
        { stock: "ICICI Bank", weight: 6.8 },
        { stock: "TCS", weight: 5.2 },
        { stock: "Bharti Airtel", weight: 4.1 },
        { stock: "ITC", weight: 3.8 },
        { stock: "L&T", weight: 3.5 },
        { stock: "Kotak Mahindra Bank", weight: 3.1 },
        { stock: "Axis Bank", weight: 2.9 },
      ],
      transactions: [
        { date: "2024-03-15", amount: 50000, type: "purchase" },
        { date: "2024-06-10", amount: 50000, type: "purchase" },
        { date: "2024-09-12", amount: 50000, type: "purchase" },
        { date: "2025-01-08", amount: 50000, type: "purchase" },
      ],
      purchase_date: "2024-03-15",
    },
    {
      fund_name: "ICICI Pru Bluechip Fund - Regular Growth",
      fund_house: "ICICI Prudential AMC",
      category: "Large Cap",
      invested_amount: 180000,
      current_value: 215000,
      xirr: 0,
      expense_ratio: 1.69,
      direct_expense_ratio: 0.97,
      top_holdings: [
        { stock: "HDFC Bank", weight: 8.8 },
        { stock: "Reliance Industries", weight: 7.2 },
        { stock: "Infosys", weight: 6.9 },
        { stock: "ICICI Bank", weight: 7.4 },
        { stock: "TCS", weight: 4.8 },
        { stock: "L&T", weight: 4.5 },
        { stock: "SBI", weight: 3.9 },
        { stock: "Bajaj Finance", weight: 3.2 },
        { stock: "HCL Technologies", weight: 2.8 },
        { stock: "Asian Paints", weight: 2.5 },
      ],
      transactions: [
        { date: "2024-04-05", amount: 60000, type: "purchase" },
        { date: "2024-08-20", amount: 60000, type: "purchase" },
        { date: "2025-01-15", amount: 60000, type: "purchase" },
      ],
      purchase_date: "2024-04-05",
    },
    {
      fund_name: "SBI Bluechip Fund - Regular Growth",
      fund_house: "SBI AMC",
      category: "Large Cap",
      invested_amount: 150000,
      current_value: 178000,
      xirr: 0,
      expense_ratio: 1.58,
      direct_expense_ratio: 0.88,
      top_holdings: [
        { stock: "HDFC Bank", weight: 9.5 },
        { stock: "Reliance Industries", weight: 6.9 },
        { stock: "Infosys", weight: 7.1 },
        { stock: "ICICI Bank", weight: 5.6 },
        { stock: "TCS", weight: 5.9 },
        { stock: "Bharti Airtel", weight: 4.3 },
        { stock: "SBI", weight: 3.7 },
        { stock: "Kotak Mahindra Bank", weight: 3.4 },
        { stock: "Axis Bank", weight: 2.6 },
        { stock: "Maruti Suzuki", weight: 2.4 },
      ],
      transactions: [
        { date: "2024-05-10", amount: 75000, type: "purchase" },
        { date: "2024-11-05", amount: 75000, type: "purchase" },
      ],
      purchase_date: "2024-05-10",
    },
    {
      fund_name: "Axis Midcap Fund - Regular Growth",
      fund_house: "Axis AMC",
      category: "Mid Cap",
      invested_amount: 120000,
      current_value: 152000,
      xirr: 0,
      expense_ratio: 1.72,
      direct_expense_ratio: 0.52,
      top_holdings: [
        { stock: "Persistent Systems", weight: 5.8 },
        { stock: "Coforge", weight: 4.9 },
        { stock: "Cholamandalam Inv", weight: 4.5 },
        { stock: "APL Apollo Tubes", weight: 3.8 },
        { stock: "Sundaram Finance", weight: 3.5 },
        { stock: "Max Healthcare", weight: 3.2 },
        { stock: "PI Industries", weight: 2.9 },
        { stock: "Tube Investments", weight: 2.8 },
      ],
      transactions: [
        { date: "2025-02-01", amount: 60000, type: "purchase" },
        { date: "2025-06-10", amount: 60000, type: "purchase" },
      ],
      purchase_date: "2025-02-01",
    },
    {
      fund_name: "HDFC Flexi Cap Fund - Regular Growth",
      fund_house: "HDFC AMC",
      category: "Flexi Cap",
      invested_amount: 160000,
      current_value: 192000,
      xirr: 0,
      expense_ratio: 1.55,
      direct_expense_ratio: 0.79,
      top_holdings: [
        { stock: "HDFC Bank", weight: 7.4 },
        { stock: "ICICI Bank", weight: 6.1 },
        { stock: "Reliance Industries", weight: 5.8 },
        { stock: "Infosys", weight: 4.2 },
        { stock: "Bharti Airtel", weight: 3.9 },
        { stock: "Axis Bank", weight: 3.4 },
        { stock: "SBI", weight: 3.1 },
        { stock: "L&T", weight: 2.9 },
        { stock: "Coal India", weight: 2.3 },
        { stock: "NTPC", weight: 2.1 },
      ],
      transactions: [
        { date: "2024-01-20", amount: 40000, type: "purchase" },
        { date: "2024-05-15", amount: 40000, type: "purchase" },
        { date: "2024-09-20", amount: 40000, type: "purchase" },
        { date: "2025-01-10", amount: 40000, type: "purchase" },
      ],
      purchase_date: "2024-01-20",
    },
    {
      fund_name: "SBI Small Cap Fund - Regular Growth",
      fund_house: "SBI AMC",
      category: "Small Cap",
      invested_amount: 100000,
      current_value: 131000,
      xirr: 0,
      expense_ratio: 1.68,
      direct_expense_ratio: 0.64,
      top_holdings: [
        { stock: "CDSL", weight: 3.8 },
        { stock: "Blue Star", weight: 3.5 },
        { stock: "Kalpataru Projects", weight: 3.1 },
        { stock: "Finolex Cables", weight: 2.9 },
        { stock: "Carborundum Universal", weight: 2.7 },
        { stock: "CMS Info Systems", weight: 2.5 },
        { stock: "Chalet Hotels", weight: 2.3 },
        { stock: "IIFL Finance", weight: 2.1 },
      ],
      transactions: [
        { date: "2025-03-01", amount: 50000, type: "purchase" },
        { date: "2025-09-15", amount: 50000, type: "purchase" },
      ],
      purchase_date: "2025-03-01",
    },
  ];
}

/* ── Overlap Detection ────────────────────────────────────── */

function computeOverlap(holdings: ParsedHolding[], totalValue: number): { entries: OverlapEntry[]; matrix: MfPortfolioResult["overlap_matrix"] } {
  const stockMap = new Map<string, { funds: string[]; weights: number[]; portfolioWeights: number[] }>();

  for (const h of holdings) {
    for (const s of h.top_holdings) {
      const entry = stockMap.get(s.stock) || { funds: [], weights: [], portfolioWeights: [] };
      entry.funds.push(h.fund_name);
      entry.weights.push(s.weight);
      entry.portfolioWeights.push((s.weight / 100) * (h.current_value / totalValue) * 100);
      stockMap.set(s.stock, entry);
    }
  }

  const entries: OverlapEntry[] = [];
  for (const [stock, data] of stockMap) {
    if (data.funds.length >= 2) {
      entries.push({
        stock_name: stock,
        funds_holding: data.funds,
        weight_per_fund: data.weights,
        total_portfolio_weight: Math.round(data.portfolioWeights.reduce((a, b) => a + b, 0) * 100) / 100,
      });
    }
  }
  entries.sort((a, b) => b.total_portfolio_weight - a.total_portfolio_weight);

  const matrix: MfPortfolioResult["overlap_matrix"] = [];
  for (let i = 0; i < holdings.length; i++) {
    for (let j = i + 1; j < holdings.length; j++) {
      const aStocks = new Set(holdings[i].top_holdings.map(s => s.stock));
      const bStocks = holdings[j].top_holdings.map(s => s.stock);
      const shared = bStocks.filter(s => aStocks.has(s));
      if (shared.length > 0) {
        const combinedWeight = shared.reduce((sum, stock) => {
          const wA = holdings[i].top_holdings.find(s => s.stock === stock)?.weight || 0;
          const wB = holdings[j].top_holdings.find(s => s.stock === stock)?.weight || 0;
          return sum + wA + wB;
        }, 0);
        matrix.push({
          fund_a: holdings[i].fund_name,
          fund_b: holdings[j].fund_name,
          shared_stocks: shared.length,
          combined_weight: Math.round(combinedWeight * 10) / 10,
        });
      }
    }
  }
  matrix.sort((a, b) => b.shared_stocks - a.shared_stocks);

  return { entries, matrix };
}

/* ── Rebalancing Engine ───────────────────────────────────── */

function generateRebalancing(holdings: ParsedHolding[], overlap: OverlapEntry[], totalValue: number): RebalanceSuggestion[] {
  const suggestions: RebalanceSuggestion[] = [];
  const now = new Date();

  const largeCaps = holdings.filter(h => h.category === "Large Cap");
  const totalLC = largeCaps.reduce((s, h) => s + h.current_value, 0);
  const lcPct = (totalLC / totalValue) * 100;

  if (largeCaps.length >= 3 && lcPct > 50) {
    const worstLC = [...largeCaps].sort((a, b) => a.xirr - b.xirr)[0];
    const daysHeld = daysBetween(new Date(worstLC.purchase_date), now);
    const stcg = daysHeld < 365;

    if (stcg) {
      suggestions.push({
        action: "trim",
        fund_name: worstLC.fund_name,
        reason: `3 large-cap funds have ${overlap.filter(o => o.funds_holding.length >= 3).length} overlapping stocks. This fund has the lowest XIRR (${worstLC.xirr}%). STCG applies — stop fresh SIPs instead of selling.`,
        stcg_warning: true,
        tax_note: `Held for ${Math.round(daysHeld)} days (<1 year). Selling now triggers 20% STCG tax on equity gains. Recommend: stop SIPs, redirect to index/mid-cap.`,
      });
    } else {
      suggestions.push({
        action: "exit",
        fund_name: worstLC.fund_name,
        reason: `3 large-cap funds cause heavy overlap. This fund has lowest XIRR (${worstLC.xirr}%). Held >1 year — LTCG @12.5% above ₹1.25L exemption.`,
        stcg_warning: false,
        tax_note: `Held for ${Math.round(daysHeld)} days (>1 year). LTCG tax @12.5% applies only on gains above ₹1.25L annual exemption.`,
      });
    }
  }

  for (const h of holdings) {
    const dragDiff = h.expense_ratio - h.direct_expense_ratio;
    if (dragDiff > 0.5) {
      const annualSave = Math.round((dragDiff / 100) * h.current_value);
      suggestions.push({
        action: "switch_to_direct",
        fund_name: h.fund_name,
        reason: `Regular plan ER ${h.expense_ratio}% vs Direct ${h.direct_expense_ratio}% — you pay ₹${annualSave.toLocaleString("en-IN")}/yr extra for no additional benefit.`,
        annual_savings: annualSave,
        stcg_warning: daysBetween(new Date(h.purchase_date), now) < 365,
        tax_note: daysBetween(new Date(h.purchase_date), now) < 365
          ? "Switch triggers STCG. Consider switching only new SIPs to direct plan."
          : "Held >1 year. Switch is tax-efficient (LTCG exemption may cover gains).",
      });
    }
  }

  const midSmallPct = holdings
    .filter(h => h.category === "Mid Cap" || h.category === "Small Cap")
    .reduce((s, h) => s + h.current_value, 0) / totalValue * 100;

  if (midSmallPct < 25) {
    suggestions.push({
      action: "increase",
      fund_name: "Mid/Small Cap allocation",
      reason: `Only ${midSmallPct.toFixed(1)}% in mid/small caps. For growth, consider increasing to 25-35% via existing mid-cap SIP.`,
    });
  }

  for (const h of holdings) {
    if (!suggestions.some(s => s.fund_name === h.fund_name)) {
      suggestions.push({
        action: "hold",
        fund_name: h.fund_name,
        reason: `XIRR ${h.xirr}%, ER ${h.expense_ratio}%. No immediate action needed.`,
        target_allocation_pct: Math.round((h.current_value / totalValue) * 100),
      });
    }
  }

  return suggestions;
}

/* ── CSV Parser ───────────────────────────────────────────── */

function parseCsv(text: string): Array<{ name: string; inv: number; cur: number }> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows: Array<{ name: string; inv: number; cur: number }> = [];
  for (const line of lines) {
    const parts = line.split(/[,\t;]/).map(p => p.trim().replace(/^"|"$/g, ""));
    if (parts.length < 2) continue;
    const name = parts[0];
    if (/fund|scheme|name/i.test(name) && rows.length === 0) continue;
    const nums = parts.slice(1).map(p => parseFloat(p.replace(/[₹,]/g, ""))).filter(n => !Number.isNaN(n));
    if (nums.length >= 2) rows.push({ name, inv: nums[0], cur: nums[1] });
    else if (nums.length === 1) rows.push({ name, inv: nums[0], cur: nums[0] });
  }
  return rows;
}

/* ── Main Builder ─────────────────────────────────────────── */

export function buildPortfolioFromText(fileName: string, text: string): MfPortfolioResult {
  const parsed = parseCsv(text);

  const holdings: ParsedHolding[] = parsed.length > 0
    ? parsed.map(r => {
        const ret = r.inv > 0 ? ((r.cur - r.inv) / r.inv) * 100 : 0;
        return {
          fund_name: r.name.slice(0, 80),
          fund_house: "From statement",
          category: "Unknown",
          invested_amount: Math.round(r.inv),
          current_value: Math.round(r.cur),
          xirr: Math.round(ret * 10) / 10,
          expense_ratio: 1.0,
          direct_expense_ratio: 0.5,
          top_holdings: [],
          transactions: [{ date: "2024-06-01", amount: r.inv, type: "purchase" as const }],
          purchase_date: "2024-06-01",
        };
      })
    : sampleHoldings();

  for (const h of holdings) {
    if (h.transactions.length > 0) {
      h.xirr = calculateXIRR(h.transactions, h.current_value);
    }
  }

  const total_invested = holdings.reduce((s, h) => s + h.invested_amount, 0);
  const total_current_value = holdings.reduce((s, h) => s + h.current_value, 0);
  const total_returns = total_current_value - total_invested;
  const total_returns_pct = total_invested > 0 ? (total_returns / total_invested) * 100 : 0;

  const overall_xirr = total_current_value > 0
    ? Math.round(holdings.reduce((s, h) => s + h.xirr * h.current_value, 0) / total_current_value * 10) / 10
    : 0;

  const expense_ratio_drag = Math.round(holdings.reduce((s, h) => s + (h.expense_ratio / 100) * h.current_value, 0));
  const direct_expense_drag = Math.round(holdings.reduce((s, h) => s + (h.direct_expense_ratio / 100) * h.current_value, 0));
  const annual_drag_savings = expense_ratio_drag - direct_expense_drag;

  const { entries: overlap_analysis, matrix: overlap_matrix } = computeOverlap(holdings, total_current_value);
  const overlap_pct = overlap_analysis.length > 0
    ? Math.round(overlap_analysis.reduce((s, o) => s + o.total_portfolio_weight, 0) * 10) / 10
    : 0;

  const catMap = new Map<string, number>();
  for (const h of holdings) {
    catMap.set(h.category, (catMap.get(h.category) || 0) + h.current_value);
  }
  const category_allocation = [...catMap.entries()]
    .map(([category, value]) => ({ category, value, pct: Math.round((value / total_current_value) * 1000) / 10 }))
    .sort((a, b) => b.pct - a.pct);

  const amcs = new Set(holdings.map(h => h.fund_house));

  const rebalancing_suggestions = generateRebalancing(holdings, overlap_analysis, total_current_value);

  const overlapStocks3plus = overlap_analysis.filter(o => o.funds_holding.length >= 3);
  const ai_summary = parsed.length > 0
    ? `Parsed ${parsed.length} fund(s) from ${fileName}. XIRR and overlap are estimates — for exact figures upload the full CAMS/KFintech CAS PDF.`
    : `Portfolio of ${holdings.length} funds across ${amcs.size} AMCs. ` +
      `Overall XIRR: ${overall_xirr}%. ` +
      (overlapStocks3plus.length > 0
        ? `${overlapStocks3plus.length} stocks (${overlapStocks3plus.map(o => o.stock_name).join(", ")}) appear in 3+ funds — significant overlap. `
        : "") +
      `Annual expense drag: ₹${expense_ratio_drag.toLocaleString("en-IN")} (save ₹${annual_drag_savings.toLocaleString("en-IN")}/yr by switching to direct plans). ` +
      `${category_allocation[0]?.category || "Large Cap"} dominates at ${category_allocation[0]?.pct || 0}% — consider diversifying.`;

  return {
    holdings,
    portfolio_summary: {
      total_invested, total_current_value, total_returns, total_returns_pct,
      overall_xirr, expense_ratio_drag, direct_expense_drag, annual_drag_savings,
      overlap_pct, num_funds: holdings.length, num_amcs: amcs.size,
    },
    category_allocation,
    overlap_analysis,
    overlap_matrix,
    rebalancing_suggestions,
    ai_summary,
  };
}
