"""Parse CAMS / KFintech mutual fund statement CSV data.

Extracts fund holdings, transaction history, and computes per-fund metrics.
Supports fuzzy column matching for any header naming convention used by
CAMS, KFintech, or custom exports.
"""

import re
from datetime import date, datetime
from typing import Optional


# ── Column aliases for fuzzy matching ────────────────────────────────

COLUMN_ALIASES: dict[str, list[str]] = {
    "fund_name": [
        "scheme", "scheme name", "scheme_name", "schemename",
        "fund", "fund name", "fund_name", "fundname",
        "mutual fund", "mutual_fund", "plan name", "plan_name",
        "scheme/plan", "folio & scheme", "name",
        "name of the scheme", "isin description", "scheme description",
        "scrip name", "scrip",
    ],
    "date": [
        "date", "transaction date", "transaction_date",
        "txn date", "txn_date", "trade date", "trade_date",
        "nav date", "nav_date", "trxn date", "trans date",
    ],
    "amount": [
        "amount", "transaction amount", "transaction_amount",
        "gross amount", "gross_amount", "net amount", "net_amount",
        "txn amount", "value", "amount (rs)", "amount rs",
    ],
    "units": [
        "units", "unit", "transaction units", "txn units",
        "no of units", "no_of_units", "quantity", "qty",
        "allotted units", "trxn units",
    ],
    "balance_units": [
        "balance units", "balance_units", "unit balance", "unit_balance",
        "current units", "current_units", "closing units", "closing_units",
        "balance", "units held", "total units", "holding units",
    ],
    "nav": [
        "nav", "price", "nav price", "nav_price",
        "current nav", "latest nav", "net asset value",
        "rate", "nav per unit", "nav (rs)", "purchase price",
    ],
    "txn_type": [
        "transaction", "type", "transaction type", "transaction_type",
        "txn type", "txn_type", "description",
        "narration", "transaction narration",
        "trxn type", "nature of transaction", "trans type",
    ],
    "invested_amount": [
        "invested", "cost", "cost value", "cost_value",
        "purchase value", "invested amount", "invested_amount",
        "amount invested", "total cost", "purchase cost",
        "investment value", "cost of acquisition",
    ],
    "current_value": [
        "current value", "current_value", "market value",
        "present value", "valuation", "curr value",
        "nav value", "mkt value", "latest value",
        "closing balance", "balance value",
    ],
    "category": [
        "category", "type", "fund type", "asset class",
        "scheme type", "scheme category", "asset type",
        "fund category",
    ],
    "expense_ratio": [
        "expense ratio", "expense_ratio", "ter",
        "total expense ratio", "expense", "management fee",
    ],
}


def _normalize(s: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]", " ", s.lower())).strip()


def _normalize_key(s: str) -> str:
    return re.sub(r"_+", "_", re.sub(r"[^a-z0-9]", "_", s.lower())).strip("_")


def _levenshtein(a: str, b: str) -> int:
    m, n = len(a), len(b)
    if m == 0: return n
    if n == 0: return m
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1): dp[i][0] = i
    for j in range(n + 1): dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    return dp[m][n]


def _similarity(a: str, b: str) -> float:
    max_len = max(len(a), len(b))
    if max_len == 0: return 1.0
    return 1.0 - _levenshtein(a, b) / max_len


def fuzzy_map_columns(raw_headers: list[str]) -> dict[str, str]:
    """Map raw CSV column headers to target fields using fuzzy matching.

    Returns a dict of target_field → raw_header.
    """
    candidates: list[tuple[str, str, float]] = []

    for raw_header in raw_headers:
        norm_header = _normalize(raw_header)
        key_header = _normalize_key(raw_header)

        for target, aliases in COLUMN_ALIASES.items():
            best_score = 0.0

            for alias in aliases:
                norm_alias = _normalize(alias)
                key_alias = _normalize_key(alias)

                if norm_header == norm_alias or key_header == key_alias:
                    best_score = max(best_score, 100.0)
                    continue

                if norm_alias in norm_header or norm_header in norm_alias:
                    len_ratio = min(len(norm_header), len(norm_alias)) / max(
                        len(norm_header), len(norm_alias), 1
                    )
                    best_score = max(best_score, 60 + len_ratio * 25)
                    continue

                sim = _similarity(norm_header, norm_alias)
                if sim >= 0.6:
                    best_score = max(best_score, sim * 70)

            if best_score > 0:
                candidates.append((raw_header, target, best_score))

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


# ── Fuzzy field getter (replaces old _get_field) ─────────────────────


def _get_field_mapped(row: dict, mapping: dict[str, str], target: str) -> Optional[str]:
    """Get a field value from a row using the pre-computed fuzzy mapping."""
    raw_header = mapping.get(target)
    if raw_header and raw_header in row:
        val = str(row[raw_header]).strip()
        return val if val else None
    return None


def _get_field(row: dict, candidates: list[str]) -> Optional[str]:
    """Legacy field getter with extended fuzzy matching.

    First tries exact/substring match on the original candidate list,
    then falls back to Levenshtein similarity for catching typos.
    """
    for key in row:
        normalized = key.lower().strip().replace(" ", "_")
        for candidate in candidates:
            # Exact or substring match
            if candidate in normalized or normalized in candidate:
                val = str(row[key]).strip()
                return val if val else None

    # Fallback: Levenshtein
    for key in row:
        norm_key = _normalize(key)
        for candidate in candidates:
            norm_cand = _normalize(candidate)
            if _similarity(norm_key, norm_cand) >= 0.7:
                val = str(row[key]).strip()
                return val if val else None

    return None


# ── Main parser ──────────────────────────────────────────────────────


def parse_cams_csv(rows: list[dict]) -> dict:
    """Parse CSV rows from CAMS/KFintech statement into structured holdings.

    Uses fuzzy column matching to handle any header naming convention.
    Supports both:
      A) Summary format (one row per fund with invested/current values)
      B) Transaction format (multiple rows per fund with amounts/types)
    """
    if not rows:
        return {"holdings": [], "summary": {}}

    # Determine column mapping from headers
    raw_headers = list(rows[0].keys())
    mapping = fuzzy_map_columns(raw_headers)

    # Detect format
    has_summary_fields = "invested_amount" in mapping or "current_value" in mapping
    has_txn_fields = "txn_type" in mapping or "amount" in mapping

    if has_summary_fields:
        return _parse_summary_format(rows, mapping)
    elif has_txn_fields:
        return _parse_transaction_format(rows, mapping)
    else:
        # Fall back to legacy parsing
        return _parse_legacy(rows)


def _parse_summary_format(rows: list[dict], mapping: dict[str, str]) -> dict:
    """Parse summary-format CSV: one row per fund."""
    funds_map: dict[str, dict] = {}

    for row in rows:
        name = _get_field_mapped(row, mapping, "fund_name")
        if not name:
            continue

        if name not in funds_map:
            raw_cat = _get_field_mapped(row, mapping, "category") or ""
            category = raw_cat if raw_cat else _infer_category(name)
            er = _parse_float(_get_field_mapped(row, mapping, "expense_ratio"))
            if er <= 0:
                er = _estimate_expense_ratio(category)
            if 0 < er < 0.5:
                er = er * 100
            if er > 3:
                er = er / 100

            funds_map[name] = {
                "fund_name": name,
                "category": category,
                "invested_amount": 0.0,
                "current_value": 0.0,
                "units": 0.0,
                "latest_nav": 0.0,
                "expense_ratio": er,
                "transactions": [],
            }

        invested = _parse_float(_get_field_mapped(row, mapping, "invested_amount"))
        current = _parse_float(_get_field_mapped(row, mapping, "current_value"))
        units = _parse_float(_get_field_mapped(row, mapping, "units"))
        if units == 0 and "balance_units" in mapping:
            units = _parse_float(_get_field_mapped(row, mapping, "balance_units"))
        nav = _parse_float(_get_field_mapped(row, mapping, "nav"))

        funds_map[name]["invested_amount"] += invested
        funds_map[name]["current_value"] += current
        funds_map[name]["units"] += units
        if nav > 0:
            funds_map[name]["latest_nav"] = nav

    holdings = []
    for data in funds_map.values():
        if data["current_value"] == 0 and data["units"] > 0 and data["latest_nav"] > 0:
            data["current_value"] = data["units"] * data["latest_nav"]
        if data["current_value"] == 0 and data["invested_amount"] > 0:
            data["current_value"] = data["invested_amount"] * 1.08
        if data["invested_amount"] == 0 and data["current_value"] > 0:
            data["invested_amount"] = data["current_value"] * 0.85

        holdings.append({
            "fund_name": data["fund_name"],
            "category": data["category"],
            "invested_amount": round(max(data["invested_amount"], 0), 2),
            "current_value": round(max(data["current_value"], 0), 2),
            "units": round(data["units"], 4),
            "latest_nav": data["latest_nav"],
            "expense_ratio": data["expense_ratio"],
            "transactions": data["transactions"],
        })

    total_invested = sum(h["invested_amount"] for h in holdings)
    total_current = sum(h["current_value"] for h in holdings)

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_returns": round(total_current - total_invested, 2),
            "returns_pct": round((total_current / max(total_invested, 1) - 1) * 100, 2),
            "num_funds": len(holdings),
        },
    }


def _parse_transaction_format(rows: list[dict], mapping: dict[str, str]) -> dict:
    """Parse transaction-format CSV: multiple rows per fund."""
    funds: dict[str, dict] = {}

    for row in rows:
        fund_name = _get_field_mapped(row, mapping, "fund_name")
        if not fund_name:
            continue

        if fund_name not in funds:
            raw_cat = _get_field_mapped(row, mapping, "category") or ""
            funds[fund_name] = {
                "fund_name": fund_name,
                "category": raw_cat if raw_cat else _infer_category(fund_name),
                "transactions": [],
                "total_invested": 0,
                "total_redeemed": 0,
                "units": 0,
                "latest_nav": 0,
            }

        txn_date = _parse_date(_get_field_mapped(row, mapping, "date"))
        amount = abs(_parse_float(_get_field_mapped(row, mapping, "amount")))
        units = _parse_float(_get_field_mapped(row, mapping, "units"))
        if units == 0 and "balance_units" in mapping:
            units = _parse_float(_get_field_mapped(row, mapping, "balance_units"))
        
        nav = _parse_float(_get_field_mapped(row, mapping, "nav"))
        txn_type = (_get_field_mapped(row, mapping, "txn_type") or "purchase").lower()

        if units == 0 and amount > 0 and nav > 0:
            units = amount / nav
        units = abs(units)

        is_purchase = any(k in txn_type for k in [
            "purchase", "sip", "switch in", "additional", "invest", "buy", "systematic", "dividend",
        ])
        is_redemption = any(k in txn_type for k in [
            "redemption", "switch out", "withdrawal", "sell", "redeem",
        ])

        if is_purchase:
            funds[fund_name]["total_invested"] += amount
            funds[fund_name]["units"] += units
            funds[fund_name]["transactions"].append({
                "date": txn_date,
                "amount": abs(amount),
                "type": "purchase",
            })
        elif is_redemption:
            funds[fund_name]["total_redeemed"] += abs(amount)
            funds[fund_name]["units"] -= abs(units)
            funds[fund_name]["transactions"].append({
                "date": txn_date,
                "amount": abs(amount),
                "type": "redemption",
            })

        if nav > 0:
            funds[fund_name]["latest_nav"] = nav

    holdings = []
    for name, data in funds.items():
        current_value = (
            data["units"] * data["latest_nav"]
            if data["latest_nav"] > 0
            else data["total_invested"]
        )
        invested = data["total_invested"] - data["total_redeemed"]

        holdings.append({
            "fund_name": name,
            "category": data["category"],
            "invested_amount": round(max(invested, 0), 2),
            "current_value": round(max(current_value, 0), 2),
            "units": round(data["units"], 4),
            "latest_nav": data["latest_nav"],
            "expense_ratio": _estimate_expense_ratio(data["category"]),
            "transactions": data["transactions"],
        })

    total_invested = sum(h["invested_amount"] for h in holdings)
    total_current = sum(h["current_value"] for h in holdings)

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_returns": round(total_current - total_invested, 2),
            "returns_pct": round((total_current / max(total_invested, 1) - 1) * 100, 2),
            "num_funds": len(holdings),
        },
    }


def _parse_legacy(rows: list[dict]) -> dict:
    """Legacy parser for backwards compatibility — uses the old _get_field approach."""
    funds: dict[str, dict] = {}

    for row in rows:
        fund_name = _get_field(row, ["scheme", "fund", "scheme_name", "fund_name", "mutual_fund", "name"])
        if not fund_name:
            continue

        if fund_name not in funds:
            funds[fund_name] = {
                "fund_name": fund_name,
                "category": _infer_category(fund_name),
                "transactions": [],
                "total_invested": 0,
                "total_redeemed": 0,
                "units": 0,
                "latest_nav": 0,
            }

        txn_date = _parse_date(_get_field(row, ["date", "transaction_date", "txn_date", "nav_date"]))
        amount = _parse_float(_get_field(row, ["amount", "value", "transaction_amount"]))
        units = _parse_float(_get_field(row, ["units", "unit", "no_of_units"]))
        nav = _parse_float(_get_field(row, ["nav", "price", "nav_price"]))
        txn_type = (_get_field(row, ["type", "transaction_type", "txn_type", "description"]) or "purchase").lower()

        is_purchase = any(k in txn_type for k in ["purchase", "sip", "switch in", "additional"])
        is_redemption = any(k in txn_type for k in ["redemption", "switch out", "withdrawal"])

        if is_purchase:
            funds[fund_name]["total_invested"] += abs(amount)
            funds[fund_name]["units"] += abs(units)
            funds[fund_name]["transactions"].append({
                "date": txn_date, "amount": abs(amount), "type": "purchase",
            })
        elif is_redemption:
            funds[fund_name]["total_redeemed"] += abs(amount)
            funds[fund_name]["units"] -= abs(units)
            funds[fund_name]["transactions"].append({
                "date": txn_date, "amount": abs(amount), "type": "redemption",
            })

        if nav > 0:
            funds[fund_name]["latest_nav"] = nav

    holdings = []
    for name, data in funds.items():
        current_value = data["units"] * data["latest_nav"] if data["latest_nav"] > 0 else data["total_invested"]
        invested = data["total_invested"] - data["total_redeemed"]

        holdings.append({
            "fund_name": name,
            "category": data["category"],
            "invested_amount": round(max(invested, 0), 2),
            "current_value": round(max(current_value, 0), 2),
            "units": round(data["units"], 4),
            "latest_nav": data["latest_nav"],
            "expense_ratio": _estimate_expense_ratio(data["category"]),
            "transactions": data["transactions"],
        })

    total_invested = sum(h["invested_amount"] for h in holdings)
    total_current = sum(h["current_value"] for h in holdings)

    return {
        "holdings": holdings,
        "summary": {
            "total_invested": round(total_invested, 2),
            "total_current_value": round(total_current, 2),
            "total_returns": round(total_current - total_invested, 2),
            "returns_pct": round((total_current / max(total_invested, 1) - 1) * 100, 2),
            "num_funds": len(holdings),
        },
    }


# ── Helpers ──────────────────────────────────────────────────────────


def _parse_date(val: Optional[str]) -> str:
    if not val:
        return date.today().isoformat()
    for fmt in ["%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d %b %Y",
                "%d-%B-%Y", "%m/%d/%Y", "%Y/%m/%d", "%d.%m.%Y"]:
        try:
            return datetime.strptime(val.strip(), fmt).date().isoformat()
        except ValueError:
            continue
    return date.today().isoformat()


def _parse_float(val: Optional[str]) -> float:
    if not val:
        return 0.0
    try:
        cleaned = re.sub(r"[₹,\s]", "", str(val))
        m = re.match(r"\(([^)]+)\)", cleaned)
        if m:
            cleaned = "-" + m.group(1)
        return float(cleaned)
    except (ValueError, TypeError):
        return 0.0


def _infer_category(fund_name: str) -> str:
    name = fund_name.lower()
    if any(k in name for k in ["liquid", "overnight", "money market"]):
        return "Liquid"
    if any(k in name for k in ["small cap", "smallcap"]):
        return "Small Cap"
    if any(k in name for k in ["mid cap", "midcap"]):
        return "Mid Cap"
    if any(k in name for k in ["large cap", "largecap", "bluechip", "large & mid", "blue chip"]):
        return "Large Cap"
    if any(k in name for k in ["flexi", "multi cap", "multicap"]):
        return "Flexi Cap"
    if any(k in name for k in ["index", "nifty", "sensex", "etf"]):
        return "Index"
    if any(k in name for k in ["elss", "tax sav"]):
        return "ELSS"
    if any(k in name for k in ["debt", "bond", "gilt", "corporate", "fixed income",
                                 "short term", "ultra short", "low duration"]):
        return "Debt"
    if any(k in name for k in ["hybrid", "balanced", "aggressive", "conservative",
                                 "dynamic asset"]):
        return "Hybrid"
    if any(k in name for k in ["sectoral", "thematic", "pharma", "banking",
                                 "infra", "it fund", "technology"]):
        return "Sectoral"
    if any(k in name for k in ["international", "global", "us equity", "nasdaq", "foreign"]):
        return "International"
    return "Equity"


def _estimate_expense_ratio(category: str) -> float:
    ratios = {
        "Index": 0.15, "Liquid": 0.20, "Debt": 0.40,
        "Large Cap": 0.80, "Flexi Cap": 0.90, "Mid Cap": 1.00,
        "Small Cap": 1.20, "ELSS": 0.85, "Hybrid": 0.90,
        "Equity": 0.90, "Sectoral": 0.95, "International": 0.60,
    }
    return ratios.get(category, 0.90)
