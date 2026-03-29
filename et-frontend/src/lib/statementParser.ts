/**
 * Smart Statement Parser for CAMS / KFintech mutual fund statements.
 *
 * Handles:
 *  - CSV files with any column header naming convention
 *  - PDF files (CAMS CAS / KFintech CAS) via pdfjs-dist text extraction
 *  - Fuzzy column matching (Levenshtein + substring + alias scoring)
 *  - Transaction aggregation into per-fund holdings
 */

import Papa from "papaparse";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ParsedFund = {
  fund_name: string;
  category: string;
  invested_amount: number;
  current_value: number;
  expense_ratio: number;
  units: number;
  nav: number;
};

// ---------------------------------------------------------------------------
// Column aliases — every known variant for CAMS, KFintech, + common customs
// ---------------------------------------------------------------------------

type TargetField =
  | "fund_name"
  | "invested_amount"
  | "current_value"
  | "category"
  | "expense_ratio"
  | "units"
  | "balance_units"
  | "nav"
  | "amount"
  | "txn_type"
  | "txn_date"
  | "folio";

const COLUMN_ALIASES: Record<TargetField, string[]> = {
  fund_name: [
    "scheme", "scheme name", "scheme_name", "schemename",
    "fund", "fund name", "fund_name", "fundname",
    "mutual fund", "mutual_fund",
    "scheme/plan", "plan name", "plan_name",
    "script name", "script_name",
    "folio & scheme", "folio and scheme",
    "scheme / plan", "name of the scheme",
    "name", "scrip", "scrip name",
    "isin description", "scheme description",
  ],
  invested_amount: [
    "invested", "cost", "cost value", "cost_value", "costvalue",
    "purchase value", "purchase_value", "purchasevalue",
    "invested amount", "invested_amount", "investedamount",
    "amount invested", "amount_invested",
    "total cost", "total_cost", "totalcost",
    "purchase cost", "purchase_cost",
    "investment value", "investment_value",
    "cost of acquisition", "acquisition cost",
    "total investment", "total_investment",
  ],
  current_value: [
    "current value", "current_value", "currentvalue",
    "market value", "market_value", "marketvalue", "mkt value",
    "present value", "present_value", "presentvalue",
    "valuation", "curr value", "curr_value",
    "nav value", "nav_value", "navvalue",
    "value", "current val", "current_val",
    "latest value", "latest_value",
    "current mkt value", "redemption value",
    "closing balance", "closing_balance",
    "balance value",
  ],
  category: [
    "category", "type", "fund type", "fund_type", "fundtype",
    "asset class", "asset_class", "assetclass",
    "scheme type", "scheme_type", "schemetype",
    "scheme category", "scheme_category",
    "asset type", "asset_type", "assettype",
    "fund category", "fund_category",
    "sub category", "sub_category",
  ],
  expense_ratio: [
    "expense ratio", "expense_ratio", "expenseratio",
    "ter", "total expense ratio", "total_expense_ratio",
    "expense", "total expense", "total_expense",
    "management fee", "management_fee",
    "expense %", "expense_pct", "ter %",
  ],
  units: [
    "units", "unit", "transaction units", "txn units",
    "no of units", "no_of_units", "noofunits",
    "quantity", "qty", "allotted units", "trxn units",
  ],
  balance_units: [
    "balance units", "balance_units", "balanceunits",
    "unit balance", "unit_balance", "unitbalance",
    "current units", "current_units",
    "closing units", "closing_units",
    "balance", "units held", "total units",
    "holding units",
  ],
  nav: [
    "nav", "current nav", "current_nav", "currentnav",
    "latest nav", "latest_nav", "latestnav",
    "nav price", "nav_price", "navprice",
    "net asset value", "net_asset_value",
    "price", "rate", "nav per unit",
    "nav (rs)", "nav(rs)", "nav rs",
    "purchase price",
  ],
  amount: [
    "amount", "transaction amount", "transaction_amount",
    "amount (rs)", "amount(rs)", "amount rs",
    "gross amount", "gross_amount",
    "net amount", "net_amount",
    "amount (₹)", "txn amount", "txn_amount",
  ],
  txn_type: [
    "transaction", "type", "transaction type", "transaction_type",
    "txn type", "txn_type", "txntype",
    "description", "transaction description",
    "narration", "transaction narration",
    "trxn type", "trxn_type",
    "nature of transaction", "trans type",
    "trxn nature", "trans_type",
  ],
  txn_date: [
    "date", "transaction date", "transaction_date",
    "txn date", "txn_date", "txndate",
    "trade date", "trade_date", "tradedate",
    "nav date", "nav_date",
    "trxn date", "trxn_date",
    "trans date", "trans_date",
  ],
  folio: [
    "folio", "folio no", "folio_no", "foliono",
    "folio number", "folio_number",
    "account no", "account_no",
  ],
};

// ---------------------------------------------------------------------------
// Normalisation & Similarity helpers
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/** Levenshtein distance */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Similarity score 0-1 based on Levenshtein */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
// Smart Column Mapper
// ---------------------------------------------------------------------------

type ColumnMapping = Partial<Record<TargetField, string>>;

/**
 * Given a list of raw CSV column headers, map each to the best-matching
 * TargetField using: exact match → substring → Levenshtein.
 */
export function mapColumns(rawHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const usedHeaders = new Set<string>();

  // Score each (header, target) pair, pick the best mapping greedily
  type Candidate = { header: string; target: TargetField; score: number };
  const candidates: Candidate[] = [];

  for (const rawHeader of rawHeaders) {
    const normHeader = normalize(rawHeader);
    const keyHeader = normalizeKey(rawHeader);

    for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as [TargetField, string[]][]) {
      let bestScore = 0;

      for (const alias of aliases) {
        const normAlias = normalize(alias);
        const keyAlias = normalizeKey(alias);

        // Exact match
        if (normHeader === normAlias || keyHeader === keyAlias) {
          bestScore = Math.max(bestScore, 100);
          continue;
        }

        // Header contains the alias or vice versa
        if (normHeader.includes(normAlias) || normAlias.includes(normHeader)) {
          const lenRatio = Math.min(normHeader.length, normAlias.length) / Math.max(normHeader.length, normAlias.length);
          bestScore = Math.max(bestScore, 60 + lenRatio * 25);
          continue;
        }

        // Levenshtein similarity
        const sim = similarity(normHeader, normAlias);
        if (sim >= 0.6) {
          bestScore = Math.max(bestScore, sim * 70);
        }
      }

      if (bestScore > 0) {
        candidates.push({ header: rawHeader, target: field, score: bestScore });
      }
    }
  }

  // Sort by descending score and assign greedily
  candidates.sort((a, b) => b.score - a.score);
  const usedTargets = new Set<TargetField>();

  for (const c of candidates) {
    if (usedHeaders.has(c.header) || usedTargets.has(c.target)) continue;
    mapping[c.target] = c.header;
    usedHeaders.add(c.header);
    usedTargets.add(c.target);
  }

  return mapping;
}

// ---------------------------------------------------------------------------
// Value extraction helpers
// ---------------------------------------------------------------------------

function parseNumeric(val: unknown): number {
  if (val == null) return 0;
  const s = String(val).replace(/[₹,\s]/g, "").replace(/\(([^)]+)\)/, "-$1").trim();
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function cleanString(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

// ---------------------------------------------------------------------------
// Fund category inference (mirrors backend)
// ---------------------------------------------------------------------------

export function inferCategory(fundName: string): string {
  const name = fundName.toLowerCase();
  if (/\b(liquid|overnight|money\s*market)\b/.test(name)) return "Liquid";
  if (/\b(small\s*cap|smallcap)\b/.test(name)) return "Small Cap";
  if (/\b(mid\s*cap|midcap)\b/.test(name)) return "Mid Cap";
  if (/\b(large\s*cap|largecap|bluechip|blue\s*chip|large\s*&\s*mid)\b/.test(name)) return "Large Cap";
  if (/\b(flexi|multi\s*cap|multicap)\b/.test(name)) return "Flexi Cap";
  if (/\b(index|nifty|sensex|etf)\b/.test(name)) return "Index";
  if (/\b(elss|tax\s*sav)/i.test(name)) return "ELSS";
  if (/\b(debt|bond|gilt|corporate|fixed\s*income|short\s*term|ultra\s*short|low\s*duration)\b/.test(name)) return "Debt";
  if (/\b(hybrid|balanced|aggressive|conservative|dynamic\s*asset)\b/.test(name)) return "Hybrid";
  if (/\b(sectoral|thematic|pharma|banking|infra|it\s*fund|technology)\b/.test(name)) return "Sectoral";
  if (/\b(international|global|us\s*equity|nasdaq|foreign)\b/.test(name)) return "International";
  return "Equity";
}

function estimateExpenseRatio(category: string): number {
  const ratios: Record<string, number> = {
    "Index": 0.15, "Liquid": 0.20, "Debt": 0.40,
    "Large Cap": 0.80, "Flexi Cap": 0.90, "Mid Cap": 1.00,
    "Small Cap": 1.20, "ELSS": 0.85, "Hybrid": 0.90,
    "Equity": 0.90, "Sectoral": 0.95, "International": 0.60,
  };
  return ratios[category] ?? 0.90;
}

// ---------------------------------------------------------------------------
// CSV Parsing (Smart)
// ---------------------------------------------------------------------------

/**
 * Parse CSV text into structured fund holdings using fuzzy column matching.
 * Handles both:
 *  A) "Summary" format — one row per fund with invested/current values
 *  B) "Transaction" format — multiple transaction rows per fund
 */
export function parseCSVToFunds(text: string): ParsedFund[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const rows = parsed.data.filter(
    (r) => Object.values(r).some((v) => String(v ?? "").trim() !== "")
  );

  if (rows.length === 0) return [];

  // Map columns
  const rawHeaders = Object.keys(rows[0]);
  const mapping = mapColumns(rawHeaders);

  const getFundName = (row: Record<string, string>) =>
    cleanString(mapping.fund_name ? row[mapping.fund_name] : "");
  const getInvested = (row: Record<string, string>) =>
    parseNumeric(mapping.invested_amount ? row[mapping.invested_amount] : 0);
  const getCurrent = (row: Record<string, string>) =>
    parseNumeric(mapping.current_value ? row[mapping.current_value] : 0);
  const getCategory = (row: Record<string, string>) =>
    cleanString(mapping.category ? row[mapping.category] : "");
  const getExpenseRatio = (row: Record<string, string>) =>
    parseNumeric(mapping.expense_ratio ? row[mapping.expense_ratio] : 0);
  const getUnits = (row: Record<string, string>) => {
    if (mapping.units && row[mapping.units] && String(row[mapping.units]).trim() !== "") {
      return parseNumeric(row[mapping.units]);
    }
    if (mapping.balance_units && row[mapping.balance_units]) {
      return parseNumeric(row[mapping.balance_units]);
    }
    return 0;
  };
  const getNav = (row: Record<string, string>) =>
    parseNumeric(mapping.nav ? row[mapping.nav] : 0);
  const getAmount = (row: Record<string, string>) =>
    parseNumeric(mapping.amount ? row[mapping.amount] : 0);
  const getTxnType = (row: Record<string, string>) =>
    cleanString(mapping.txn_type ? row[mapping.txn_type] : "").toLowerCase();

  // Detect if this is a summary or transaction format
  const hasSummaryFields = mapping.invested_amount || mapping.current_value;
  const hasTransactionFields = mapping.txn_type || mapping.amount;
  const isTxnFormat = hasTransactionFields && !hasSummaryFields;

  if (isTxnFormat) {
    // Transaction format: aggregate by fund name
    return aggregateTransactions(rows, getFundName, getAmount, getUnits, getNav, getTxnType, getCategory);
  }

  // Summary format: one row per fund
  const funds: ParsedFund[] = [];
  const seenFunds = new Map<string, ParsedFund>();

  for (const row of rows) {
    const name = getFundName(row);
    if (!name) continue;

    // If we've seen this fund before, aggregate
    if (seenFunds.has(name)) {
      const existing = seenFunds.get(name)!;
      existing.invested_amount += getInvested(row);
      existing.current_value += getCurrent(row);
      existing.units += getUnits(row);
      const nav = getNav(row);
      if (nav > 0) existing.nav = nav;
      continue;
    }

    const rawCategory = getCategory(row);
    const category = rawCategory || inferCategory(name);
    let er = getExpenseRatio(row);
    if (er <= 0) er = estimateExpenseRatio(category);
    // Normalize expense ratio: if < 0.5 assume it's a decimal (e.g. 0.01 for 1%)
    if (er > 0 && er < 0.5) er = er * 100;
    if (er > 3) er = er / 100;

    const units = getUnits(row);
    const nav = getNav(row);
    let invested = getInvested(row);
    let current = getCurrent(row);

    // If only amount column is available, use it as invested
    if (invested === 0 && current === 0 && mapping.amount) {
      invested = getAmount(row);
    }

    // Compute current value if we have units + nav but no current_value
    if (current === 0 && units > 0 && nav > 0) {
      current = units * nav;
    }
    // If no current value at all, estimate from invested
    if (current === 0 && invested > 0) {
      current = invested * 1.08;
    }

    const fund: ParsedFund = {
      fund_name: name,
      category,
      invested_amount: invested,
      current_value: current,
      expense_ratio: er,
      units,
      nav,
    };

    seenFunds.set(name, fund);
    funds.push(fund);
  }

  return funds;
}

function aggregateTransactions(
  rows: Record<string, string>[],
  getFundName: (r: Record<string, string>) => string,
  getAmount: (r: Record<string, string>) => number,
  getUnits: (r: Record<string, string>) => number,
  getNav: (r: Record<string, string>) => number,
  getTxnType: (r: Record<string, string>) => string,
  getCategory: (r: Record<string, string>) => string,
): ParsedFund[] {
  const fundMap = new Map<string, {
    totalInvested: number;
    totalRedeemed: number;
    units: number;
    latestNav: number;
    category: string;
  }>();

  for (const row of rows) {
    const name = getFundName(row);
    if (!name) continue;

    if (!fundMap.has(name)) {
      fundMap.set(name, {
        totalInvested: 0,
        totalRedeemed: 0,
        units: 0,
        latestNav: 0,
        category: getCategory(row) || inferCategory(name),
      });
    }

    const data = fundMap.get(name)!;
    const amount = Math.abs(getAmount(row));
    // For transactional units, they might be omitted for dividends, or given as positive/negative
    let units = getUnits(row); 
    const nav = getNav(row);
    const txnType = getTxnType(row);

    // If units is 0 but amount and nav exist, calculate them
    if (units === 0 && amount > 0 && nav > 0) {
      units = amount / nav;
    }
    units = Math.abs(units);

    const isPurchase = /purchase|sip|switch\s*in|additional|invest|buy|systematic|dividend/i.test(txnType);
    const isRedemption = /redemption|switch\s*out|withdrawal|sell|redeem/i.test(txnType);

    if (isPurchase) {
      data.totalInvested += amount;
      data.units += units;
    } else if (isRedemption) {
      data.totalRedeemed += amount;
      data.units -= units;
    }

    if (nav > 0) data.latestNav = nav;
  }

  const funds: ParsedFund[] = [];
  for (const [name, data] of fundMap) {
    const invested = Math.max(data.totalInvested - data.totalRedeemed, 0);
    const current = data.latestNav > 0 && data.units > 0
      ? data.units * data.latestNav
      : invested * 1.08;
    const er = estimateExpenseRatio(data.category);

    funds.push({
      fund_name: name,
      category: data.category,
      invested_amount: Math.round(invested * 100) / 100,
      current_value: Math.round(current * 100) / 100,
      expense_ratio: er,
      units: Math.round(Math.max(data.units, 0) * 10000) / 10000,
      nav: data.latestNav,
    });
  }

  return funds;
}

// ---------------------------------------------------------------------------
// PDF Parsing
// ---------------------------------------------------------------------------

/**
 * Extract text from a PDF file using pdfjs-dist, then parse into fund data.
 */
export async function parsePDFToFunds(file: File): Promise<ParsedFund[]> {
  const arrayBuffer = await file.arrayBuffer();

  // Dynamic import of pdfjs-dist to avoid SSR issues
  const pdfjsLib = await import("pdfjs-dist");

  // Set up the worker
  if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
  }

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const allText: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let pageText = "";
    let lastY = -1;

    for (const item of content.items) {
      if ("str" in item) {
        // transform[5] represents the Y coordinate
        // Casting item to any because pdfjs types can be tricky
        const y = (item as any).transform?.[5] ?? -1;
        
        if (lastY !== -1 && y !== -1 && Math.abs(y - lastY) > 4) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
          pageText += " ";
        }
        pageText += item.str.trim();
        lastY = y;
      }
    }
    allText.push(pageText);
  }

  const fullText = allText.join("\n\n");

  // Try tabular extraction first, then fall back to narrative parsing
  let funds = extractTabularFunds(fullText);
  if (funds.length === 0) {
    funds = extractNarrativeFunds(fullText);
  }

  return funds;
}

/**
 * Try to find embedded CSV-like tables in the PDF text.
 * Some CAMS/KFintech PDFs have structured text that looks like:
 *   Scheme Name   Units   NAV   Valuation   Cost
 */
function extractTabularFunds(text: string): ParsedFund[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  // Look for header-like lines
  const headerPatterns = [
    /scheme|fund|plan/i,
    /units?|quantity/i,
    /nav|price/i,
    /value|valuation|market/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matchCount = headerPatterns.filter((p) => p.test(line)).length;

    if (matchCount >= 2) {
      // This line looks like a table header — parse subsequent lines as data
      return parseSubsequentRows(lines, i);
    }
  }

  return [];
}

function parseSubsequentRows(lines: string[], headerIndex: number): ParsedFund[] {
  const funds: ParsedFund[] = [];

  // Simple heuristic: lines after the header containing numbers are data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop if we hit another section header or empty-ish line
    if (/^(total|grand total|disclaimer|note:|page\s)/i.test(line)) break;

    // Extract numbers from the line logically by tracking commas
    const numberTokens = line.match(/[\d,]+\.?\d*/g) || [];
    const parsedNums = numberTokens.map(n => ({
      val: parseFloat(n.replace(/,/g, "")),
      hasComma: n.includes(","),
      hasDec: n.includes(".")
    })).filter(n => !isNaN(n.val));
    
    // If the PDF cleanly uses commas for large figures, any giant integer WITHOUT commas is extremely likely to be a Folio/ID
    const hasCommaFormat = parsedNums.some(n => n.val >= 10000 && n.hasComma);
    const validNumbers = parsedNums.filter(n => {
      if (hasCommaFormat && n.val >= 10000 && !n.hasComma && !n.hasDec) return false;
      return true;
    });
    
    const numbers = validNumbers.map(n => n.val);

    // Extract the text part (fund name)
    const textPart = line.replace(/[\d,]+\.?\d*/g, "").replace(/\s+/g, " ").trim();

    if (textPart.length > 5 && numbers.length >= 2) {
      let name = textPart
        .replace(/^\d+\s*/, "") // remove leading index numbers
        .replace(/\s*(direct|regular|growth|dividend|idcw|plan)\s*/gi, " $1")
        .replace(/(Large Cap|Small Cap|Mid Cap|Flexi Cap|Multi Cap|Equity|Debt|Hybrid|Index|Sectoral|International|Liquid)$/i, "") // strip squashed category column
        .replace(/[^a-zA-Z0-9\s\-&]/g, " ") // clean special characters
        .trim();

      if (!name || name.length < 3) continue;

      // Heuristic: the largest number is likely valuation/current_value
      // Units are usually < 100k and NAV is usually < 10k
      const sorted = [...numbers].sort((a, b) => b - a);
      const currentValue = sorted[0] || 0;
      let invested = sorted[1] || currentValue * 0.85;
      if (invested < currentValue * 0.4 && currentValue > 100) {
        invested = currentValue * 0.85;
      }
      const units = numbers.find((n) => n < 100000 && n > 0 && n !== currentValue && n !== invested) || 0;
      const nav = numbers.find((n) => n < 10000 && n > 1 && n !== currentValue && n !== invested && n !== units) || 0;

      const category = inferCategory(name);

      funds.push({
        fund_name: name,
        category,
        invested_amount: Math.round(invested * 100) / 100,
        current_value: Math.round(currentValue * 100) / 100,
        expense_ratio: estimateExpenseRatio(category),
        units,
        nav,
      });
    }
  }

  return funds;
}

/**
 * Parse narrative-style CAMS CAS PDFs where the format is:
 *   Fund House Name
 *   Folio No: XXXXX
 *   Scheme Name - Direct Plan - Growth
 *   ...transaction lines...
 *   Valuation on DD-Mon-YYYY: NAV: XX.XX  Units: XXX.XX  Value: XX,XXX.XX
 */
function extractNarrativeFunds(text: string): ParsedFund[] {
  const funds: ParsedFund[] = [];

  // Pattern 1: CAMS CAS style — look for "Valuation on" lines
  const valuationRegex =
    /(?:valuation|closing\s+balance).*?(?:nav|price)\s*[:=]?\s*([\d,.]+).*?(?:units?)\s*[:=]?\s*([\d,.]+).*?(?:value|amount)\s*[:=]?\s*([\d,.]+)/gi;

  // Find scheme names — they typically appear before valuation lines
  // Non-greedy capture limited to reasonably sized scheme names
  const schemeRegex =
    /([A-Z][A-Za-z\s&\-()]{5,80}?(?:Fund|Plan|Growth|Direct|Regular|Dividend|IDCW|Scheme|Cap|Nifty|Sensex|ETF|Index|Small|Mid|Large|Flexi|Multi|Blue\s*Chip|Balanced|Hybrid|ELSS|Tax|Liquid|Debt|Bond|Gilt|Sectoral|Pharma|Banking|Infra|IT|Technology|International|Global|Dynamic|Aggressive|Conservative)[A-Za-z\s&\-()]{0,30})/gi;

  // Approach: scan for scheme names and find associated valuation data
  const schemeMatches = [...text.matchAll(schemeRegex)];
  const valuationMatches = [...text.matchAll(valuationRegex)];

  if (schemeMatches.length > 0 && valuationMatches.length > 0) {
    // Match each valuation to the nearest preceding scheme name
    for (const valMatch of valuationMatches) {
      const valPos = valMatch.index ?? 0;
      let closestScheme = "";
      let closestDist = Infinity;

      for (const sMatch of schemeMatches) {
        const sPos = sMatch.index ?? 0;
        if (sPos < valPos && valPos - sPos < closestDist) {
          closestDist = valPos - sPos;
          closestScheme = sMatch[1].trim();
        }
      }

      if (closestScheme) {
        const nav = parseFloat(valMatch[1].replace(/,/g, "")) || 0;
        const units = parseFloat(valMatch[2].replace(/,/g, "")) || 0;
        const value = parseFloat(valMatch[3].replace(/,/g, "")) || 0;

        const name = closestScheme
          .replace(/\s+/g, " ")
          .replace(/\s*-\s*/g, " - ")
          .trim();

        // Check for duplicate
        const existing = funds.find(
          (f) => f.fund_name.toLowerCase() === name.toLowerCase()
        );
        if (existing) {
          existing.units += units;
          existing.current_value += value;
          if (nav > 0) existing.nav = nav;
          continue;
        }

        const category = inferCategory(name);
        funds.push({
          fund_name: name,
          category,
          invested_amount: Math.round(value * 0.85 * 100) / 100, // estimate, as CAS may not show cost
          current_value: Math.round(value * 100) / 100,
          expense_ratio: estimateExpenseRatio(category),
          units,
          nav,
        });
      }
    }
  }

  // Pattern 2: simpler approach — look for any line containing both a fund-like
  // name and numeric values
  if (funds.length === 0) {
    const lines = text.split(/\n/);
    for (const line of lines) {
      // Ignore extremely long lines combining multiple paragraphs
      if (line.length > 150) continue;

      // Lines with well-known MF fund house keywords
      const hasFundKeyword =
        /(?:axis|sbi|hdfc|icici|kotak|tata|nippon|dsp|utm?i|franklin|mirae|motilal|parag\s*parikh|aditya\s*birla|canara|bandhan|edelweiss|invesco|pgim|hsbc|sundaram|baroda|bnp|l&t|mahindra)/i.test(line);
      
      // Clean dates and folios like "123456/78" or "12-May-2023" before number extraction
      const cleanLine = line
        .replace(/\b\d{1,2}\s*[\/\-]\s*\w{3,}\s*[\/\-]\s*\d{2,4}\b/gi, "") // Dates
        .replace(/\b\d{4,}\s*[\/\-\|\\\u2044]\s*[a-zA-Z0-9]+\b/g, ""); // Folio formats w/ special chars

      const numberTokens = cleanLine.match(/[\d,]+\.?\d*/g) || [];
      const parsedNums = numberTokens.map(n => ({
        val: parseFloat(n.replace(/,/g, "")),
        hasComma: n.includes(","),
        hasDec: n.includes(".")
      })).filter(n => !isNaN(n.val));
      
      const hasCommaFormat = parsedNums.some(n => n.val >= 10000 && n.hasComma);
      const validNumbers = parsedNums.filter(n => {
        if (hasCommaFormat && n.val >= 10000 && !n.hasComma && !n.hasDec) return false;
        return true;
      });
      
      const numbers = validNumbers.map(n => n.val);

      if (hasFundKeyword && numbers.length >= 2) {
        // Build raw text part, then aggressively strip floating special characters like leftover slashes
        let textPart = cleanLine.replace(/[\d,]+\.?\d*/g, "");
        textPart = textPart.replace(/[^a-zA-Z0-9\s\-&]/g, " ").replace(/\s+/g, " ")
          .replace(/(Large Cap|Small Cap|Mid Cap|Flexi Cap|Multi Cap|Equity|Debt|Hybrid|Index|Sectoral|International|Liquid)$/i, "") // strip category
          .trim();
        
        if (textPart.length < 5) continue;

        const sorted = [...numbers].filter(n => n > 0).sort((a, b) => b - a);
        if (sorted.length < 2) continue;

        const currentValue = sorted[0];
        let invested = sorted[1];
        if (!invested || (invested < currentValue * 0.4 && currentValue > 100)) {
          invested = currentValue * 0.85;
        }

        const category = inferCategory(textPart);

        funds.push({
          fund_name: textPart,
          category,
          invested_amount: invested,
          current_value: currentValue,
          expense_ratio: estimateExpenseRatio(category),
          units: numbers.find((n) => n < 100000 && n !== currentValue && n !== invested) || 0,
          nav: numbers.find((n) => n < 10000 && n >= 1 && n !== currentValue && n !== invested) || 0,
        });
      }
    }
  }

  return funds;
}
