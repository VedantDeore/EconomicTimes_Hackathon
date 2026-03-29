"""Parse CAMS / KFintech mutual fund statement PDFs using pdfplumber.

Extracts fund holdings from:
  - CAMS CAS (Consolidated Account Statement) PDFs
  - KFintech CAS PDFs
  - Other MF statement PDFs with tabular data

Handles:
  - Table-based extraction (structured PDFs)
  - Text-based extraction (narrative-style CAS)
  - Fuzzy column matching for header mismatches
"""

import re
from typing import Optional

try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False

from app.parsers.cams_parser import _infer_category, _estimate_expense_ratio


# ── Column alias mapping (mirrors frontend statementParser.ts) ───────

COLUMN_ALIASES: dict[str, list[str]] = {
    "fund_name": [
        "scheme", "scheme name", "scheme_name", "fund", "fund name",
        "fund_name", "mutual fund", "plan name", "name",
        "scheme/plan", "folio & scheme", "isin description",
        "scheme description", "name of the scheme", "scrip name",
    ],
    "invested_amount": [
        "invested", "cost", "cost value", "cost_value", "purchase value",
        "invested amount", "invested_amount", "amount invested",
        "total cost", "purchase cost", "investment value",
        "cost of acquisition", "total investment",
    ],
    "current_value": [
        "current value", "current_value", "market value", "present value",
        "valuation", "curr value", "nav value", "value", "mkt value",
        "latest value", "closing balance", "balance value",
        "current mkt value",
    ],
    "category": [
        "category", "type", "fund type", "asset class", "scheme type",
        "scheme category", "asset type", "fund category",
    ],
    "expense_ratio": [
        "expense ratio", "expense_ratio", "ter", "total expense ratio",
        "expense", "management fee", "ter %",
    ],
    "units": [
        "units", "unit", "transaction units", "txn units",
        "no of units", "quantity", "qty", "holding units", "allotted units", "trxn units",
    ],
    "balance_units": [
        "balance units", "balance_units", "unit balance", "unit_balance",
        "current units", "current_units", "closing units", "closing_units",
        "balance", "units held", "total units",
    ],
    "nav": [
        "nav", "current nav", "latest nav", "nav price",
        "net asset value", "price", "rate", "nav per unit",
        "nav (rs)", "purchase price",
    ],
    "amount": [
        "amount", "transaction amount", "gross amount", "net amount",
        "txn amount",
    ],
    "txn_type": [
        "transaction", "type", "transaction type", "txn type", "description",
        "narration", "transaction narration", "trxn type",
        "nature of transaction", "trans type",
    ],
}


def _normalize(s: str) -> str:
    """Normalize a string for matching: lowercase, strip special chars."""
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]", " ", s.lower())).strip()


def _levenshtein(a: str, b: str) -> int:
    """Compute Levenshtein edit distance."""
    m, n = len(a), len(b)
    if m == 0:
        return n
    if n == 0:
        return m
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp[m][n]


def _similarity(a: str, b: str) -> float:
    """Similarity score 0-1 based on Levenshtein distance."""
    max_len = max(len(a), len(b))
    if max_len == 0:
        return 1.0
    return 1.0 - _levenshtein(a, b) / max_len


def fuzzy_map_columns(raw_headers: list[str]) -> dict[str, str]:
    """Map raw column headers to target fields using fuzzy matching.

    Returns a dict mapping target_field → raw_header.
    """
    candidates: list[tuple[str, str, float]] = []  # (header, target, score)

    for raw_header in raw_headers:
        norm_header = _normalize(raw_header)

        for target, aliases in COLUMN_ALIASES.items():
            best_score = 0.0

            for alias in aliases:
                norm_alias = _normalize(alias)

                # Exact match
                if norm_header == norm_alias:
                    best_score = max(best_score, 100.0)
                    continue

                # Substring containment
                if norm_alias in norm_header or norm_header in norm_alias:
                    len_ratio = min(len(norm_header), len(norm_alias)) / max(
                        len(norm_header), len(norm_alias)
                    )
                    best_score = max(best_score, 60 + len_ratio * 25)
                    continue

                # Levenshtein
                sim = _similarity(norm_header, norm_alias)
                if sim >= 0.6:
                    best_score = max(best_score, sim * 70)

            if best_score > 0:
                candidates.append((raw_header, target, best_score))

    # Greedy assignment by score
    candidates.sort(key=lambda x: -x[2])
    mapping: dict[str, str] = {}
    used_headers: set[str] = set()
    used_targets: set[str] = set()

    for header, target, _ in candidates:
        if header in used_headers or target in used_targets:
            continue
        mapping[target] = header
        used_headers.add(header)
        used_targets.add(target)

    return mapping


def _parse_float(val) -> float:
    """Parse a numeric value, handling commas, ₹ symbols, and parens."""
    if val is None:
        return 0.0
    s = re.sub(r"[₹,\s]", "", str(val))
    m = re.match(r"\(([^)]+)\)", s)
    if m:
        s = "-" + m.group(1)
    try:
        return float(s)
    except (ValueError, TypeError):
        return 0.0


# ── PDF Parsing ──────────────────────────────────────────────────────


def parse_pdf_file(file_bytes: bytes) -> dict:
    """Parse a CAMS/KFintech PDF from raw bytes into structured holdings.

    Returns the same format as parse_cams_csv:
      { "holdings": [...], "summary": {...} }
    """
    if not HAS_PDFPLUMBER:
        return {
            "error": "pdfplumber not installed. Install with: pip install pdfplumber",
            "holdings": [],
            "summary": {},
        }

    holdings = []

    with pdfplumber.open(file_bytes) as pdf:
        # Strategy 1: Try table extraction
        all_tables = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                if table and len(table) > 1:
                    all_tables.append(table)

        if all_tables:
            holdings = _parse_tables(all_tables)

        # Strategy 2: Fall back to text extraction
        if not holdings:
            full_text = ""
            for page in pdf.pages:
                text = page.extract_text() or ""
                full_text += text + "\n\n"
            holdings = _parse_text(full_text)

    # Compute summary
    total_invested = sum(h["invested_amount"] for h in holdings)
    total_current = sum(h["current_value"] for h in holdings)

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_returns": round(total_current - total_invested, 2),
            "returns_pct": round(
                (total_current / max(total_invested, 1) - 1) * 100, 2
            ),
            "num_funds": len(holdings),
        },
    }


def _parse_tables(all_tables: list[list]) -> list[dict]:
    """Parse extracted PDF tables into fund holdings."""
    holdings = []

    for table in all_tables:
        if len(table) < 2:
            continue

        # First row is likely the header
        headers = [str(cell or "").strip() for cell in table[0]]
        mapping = fuzzy_map_columns(headers)

        if "fund_name" not in mapping:
            # Try second row as header (some PDFs have merged header rows)
            if len(table) > 2:
                headers = [str(cell or "").strip() for cell in table[1]]
                mapping = fuzzy_map_columns(headers)
                data_rows = table[2:]
            else:
                continue
        else:
            data_rows = table[1:]

        for row_data in data_rows:
            if len(row_data) != len(headers):
                continue

            row_dict = dict(zip(headers, row_data))

            fund_name = str(row_dict.get(mapping.get("fund_name", ""), "") or "").strip()
            if not fund_name or len(fund_name) < 3:
                continue

            # Skip total/summary rows
            if re.match(r"^(total|grand total|sub total|summary)", fund_name, re.I):
                continue

            invested = _parse_float(row_dict.get(mapping.get("invested_amount", ""), 0))
            current = _parse_float(row_dict.get(mapping.get("current_value", ""), 0))
            units = _parse_float(row_dict.get(mapping.get("units", ""), 0))
            if units == 0 and "balance_units" in mapping:
                units = _parse_float(row_dict.get(mapping.get("balance_units", ""), 0))
            nav = _parse_float(row_dict.get(mapping.get("nav", ""), 0))
            raw_category = str(
                row_dict.get(mapping.get("category", ""), "") or ""
            ).strip()
            category = raw_category if raw_category else _infer_category(fund_name)
            er = _parse_float(row_dict.get(mapping.get("expense_ratio", ""), 0))
            if er <= 0:
                er = _estimate_expense_ratio(category)

            if current == 0 and units > 0 and nav > 0:
                current = units * nav
            if current == 0 and invested > 0:
                current = invested * 1.08

            if invested == 0 and current > 0:
                invested = current * 0.85

            holdings.append(
                {
                    "fund_name": fund_name,
                    "category": category,
                    "invested_amount": round(max(invested, 0), 2),
                    "current_value": round(max(current, 0), 2),
                    "units": round(max(units, 0), 4),
                    "latest_nav": nav,
                    "expense_ratio": er,
                    "transactions": [],
                }
            )

    return holdings


def _parse_text(text: str) -> list[dict]:
    """Parse narrative-style CAS text into fund holdings."""
    holdings = []

    # Pattern: look for scheme names followed by valuation data
    # CAMS CAS format:
    #   SCHEME NAME - DIRECT PLAN - GROWTH
    #   ...transactions...
    #   Valuation on DD-Mon-YYYY: NAV: XX.XX Units: XX.XX Value: XX,XXX.XX

    valuation_pattern = re.compile(
        r"(?:valuation|closing\s+balance).*?"
        r"(?:nav|price)\s*[:=]?\s*([\d,.]+).*?"
        r"(?:units?)\s*[:=]?\s*([\d,.]+).*?"
        r"(?:value|amount)\s*[:=]?\s*([\d,.]+)",
        re.IGNORECASE,
    )

    # Non-greedy capture limited to reasonably sized scheme names
    scheme_pattern = re.compile(
        r"([A-Z][A-Za-z\s&\-()]{5,80}?(?:Fund|Plan|Growth|Direct|Regular|"
        r"Dividend|IDCW|Scheme|Cap|Nifty|Sensex|ETF|Index|Small|Mid|Large|"
        r"Flexi|Multi|Blue\s*Chip|Balanced|Hybrid|ELSS|Tax|Liquid|Debt|"
        r"Bond|Gilt|Sectoral|Pharma|Banking|Infra|IT|Technology|International|"
        r"Global|Dynamic|Aggressive|Conservative)[A-Za-z\s&\-()]{0,30})",
        re.IGNORECASE
    )

    scheme_matches = list(scheme_pattern.finditer(text))
    valuation_matches = list(valuation_pattern.finditer(text))

    seen_names: set[str] = set()

    for val_match in valuation_matches:
        val_pos = val_match.start()
        closest_scheme = ""
        closest_dist = float("inf")

        for s_match in scheme_matches:
            s_pos = s_match.start()
            if s_pos < val_pos and (val_pos - s_pos) < closest_dist:
                closest_dist = val_pos - s_pos
                closest_scheme = s_match.group(1).strip()

        if closest_scheme:
            name_key = closest_scheme.lower()
            nav = _parse_float(val_match.group(1))
            units = _parse_float(val_match.group(2))
            value = _parse_float(val_match.group(3))

            if name_key in seen_names:
                # Aggregate into existing
                for h in holdings:
                    if h["fund_name"].lower() == name_key:
                        h["units"] += units
                        h["current_value"] += value
                        if nav > 0:
                            h["latest_nav"] = nav
                        break
                continue

            seen_names.add(name_key)
            category = _infer_category(closest_scheme)

            holdings.append(
                {
                    "fund_name": closest_scheme,
                    "category": category,
                    "invested_amount": round(value * 0.85, 2),
                    "current_value": round(value, 2),
                    "units": round(units, 4),
                    "latest_nav": nav,
                    "expense_ratio": _estimate_expense_ratio(category),
                    "transactions": [],
                }
            )

    # Fallback: look for lines with fund house names + numbers
    if not holdings:
        fund_house_pattern = re.compile(
            r"(?:axis|sbi|hdfc|icici|kotak|tata|nippon|dsp|uti|franklin|"
            r"mirae|motilal|parag\s*parikh|aditya\s*birla|canara|bandhan|"
            r"edelweiss|invesco|pgim|hsbc|sundaram|baroda|bnp|l&t|mahindra)",
            re.IGNORECASE,
        )

        for line in text.split("\n"):
            line = line.strip()
            if len(line) > 150:
                continue
                
            if not fund_house_pattern.search(line):
                continue
                
            clean_line = re.sub(r"\b\d{1,2}\s*[\/\-]\s*\w{3,}\s*[\/\-]\s*\d{2,4}\b", "", line, flags=re.IGNORECASE)
            clean_line = re.sub(r"\b\d{4,}\s*[\/\-\|\\\u2044]\s*[a-zA-Z0-9]+\b", "", clean_line)

            raw_numbers = re.findall(r"[\d,]+\.?\d*", clean_line)
            parsed_nums = []
            for n in raw_numbers:
                try:
                    val = float(n.replace(",", ""))
                    parsed_nums.append({"val": val, "has_comma": "," in n, "has_dec": "." in n, "raw": n})
                except ValueError:
                    pass

            has_comma_format = any(n["val"] >= 10000 and n["has_comma"] for n in parsed_nums)

            numbers = []
            for n in parsed_nums:
                if has_comma_format and n["val"] >= 10000 and not n["has_comma"] and not n["has_dec"]:
                    continue  # Skip likely folio/ID
                if n["val"] > 0:
                    numbers.append(n["val"])
            
            text_part = re.sub(r"[\d,]+\.?\d*", "", clean_line)
            text_part = re.sub(r"[^a-zA-Z0-9\s\-&]", " ", text_part)
            text_part = re.sub(r"(Large Cap|Small Cap|Mid Cap|Flexi Cap|Multi Cap|Equity|Debt|Hybrid|Index|Sectoral|International|Liquid)$", "", text_part, flags=re.IGNORECASE)
            text_part = re.sub(r"\s+", " ", text_part).strip()

            if len(text_part) >= 5 and len(numbers) >= 2:
                sorted_nums = sorted(numbers, reverse=True)
                current_value = sorted_nums[0]
                invested = sorted_nums[1]
                if invested < current_value * 0.4 and current_value > 100:
                    invested = current_value * 0.85

                category = _infer_category(text_part)

                holdings.append(
                    {
                        "fund_name": text_part,
                        "category": category,
                        "invested_amount": round(invested, 2),
                        "current_value": round(current_value, 2),
                        "units": 0,
                        "latest_nav": 0,
                        "expense_ratio": _estimate_expense_ratio(category),
                        "transactions": [],
                    }
                )

    return holdings
