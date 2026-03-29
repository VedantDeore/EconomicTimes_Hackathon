"""Agentic AI pipeline with tool-calling for the Money Mentor.

Classifies user intent via keyword pre-routing + Groq LLM fallback,
routes to the appropriate calculator/tool, then formats results
into a conversational response. Fully synchronous for Flask.
"""

import json
from app.ai_client import generate, generate_json
from app.calculators.tax_calculator import calculate_tax_old, calculate_tax_new
from app.calculators.sip_calculator import calculate_sip, calculate_future_value
from app.calculators.xirr_calculator import calculate_xirr
from app.calculators.asset_allocator import get_allocation_by_age
from app.calculators.insurance_calculator import calculate_insurance_need


# ── Display & action mappings ────────────────────────────────────────

DISPLAY_TYPE_MAP = {
    "sip_calc": "sip_projection",
    "future_value": "sip_projection",
    "tax_compare": "tax_comparison",
    "insurance_need": "insurance_gap",
    "asset_allocation": "asset_allocation",
    "portfolio_summary": "investment_breakdown",
    "goal_tracker": "goal_progress",
    "net_worth_summary": "net_worth",
    "spending_analysis": "spending_breakdown",
    "profile_snapshot": "profile_snapshot",
}

ACTION_LINKS_MAP = {
    "sip_calc": [{"label": "FIRE Planner", "href": "/fire-planner"}],
    "future_value": [{"label": "FIRE Planner", "href": "/fire-planner"}],
    "tax_compare": [{"label": "Tax Wizard", "href": "/tax-wizard"}],
    "insurance_need": [{"label": "Money Health", "href": "/money-health"}],
    "asset_allocation": [{"label": "MF X-Ray", "href": "/mf-xray"}],
    "portfolio_summary": [
        {"label": "MF X-Ray", "href": "/mf-xray"},
        {"label": "Money Profile", "href": "/money-profile"},
    ],
    "goal_tracker": [
        {"label": "FIRE Planner", "href": "/fire-planner"},
        {"label": "Money Profile", "href": "/money-profile"},
    ],
    "net_worth_summary": [
        {"label": "Dashboard", "href": "/dashboard"},
        {"label": "Profile", "href": "/profile"},
    ],
    "spending_analysis": [
        {"label": "Money Health", "href": "/money-health"},
        {"label": "Money Profile", "href": "/money-profile"},
    ],
    "profile_snapshot": [
        {"label": "Edit Profile", "href": "/money-profile"},
        {"label": "Dashboard", "href": "/dashboard"},
    ],
}

FOLLOW_UP_MAP = {
    "sip_calc": ["What if I increase my SIP?", "Show my asset allocation", "Check my tax savings"],
    "future_value": ["Calculate SIP for a goal", "Compare tax regimes", "Review my FIRE plan"],
    "tax_compare": ["Find my missed deductions", "Calculate my SIP needs", "Check my insurance gap"],
    "insurance_need": ["Calculate SIP for goals", "Get my Money Health Score", "Compare tax regimes"],
    "asset_allocation": ["Calculate SIP amounts", "Review my FIRE plan", "Check my portfolio overlap"],
    "portfolio_summary": ["Show my goal progress", "What's my net worth?", "Suggest rebalancing"],
    "goal_tracker": ["Calculate SIP for goals", "Review my FIRE plan", "Show my portfolio"],
    "net_worth_summary": ["Show my portfolio breakdown", "Check my insurance gap", "Analyze my spending"],
    "spending_analysis": ["How to save more?", "Calculate my SIP", "Show my net worth"],
    "profile_snapshot": ["Show my portfolio", "Check my insurance gap", "Analyze my spending", "What's my net worth?"],
}


# ── Keyword pre-routing ──────────────────────────────────────────────

_INTENT_PATTERNS: list[tuple[str, list[str]]] = [
    ("profile_snapshot", [
        "about me", "who am i", "my profile", "what do you know",
        "tell me about me", "my data", "my details", "my information",
        "know about me", "my snapshot", "my summary", "describe me",
        "my financial profile", "what you know",
    ]),
    ("portfolio_summary", [
        "portfolio", "my investments", "investment breakdown",
        "show my invest", "investment summary",
    ]),
    ("goal_tracker", [
        "goal", "my goals", "goal progress", "goals progressing",
    ]),
    ("net_worth_summary", [
        "net worth", "networth", "total worth", "assets and liabilities",
    ]),
    ("spending_analysis", [
        "spending", "expense", "my expenses", "spending analysis",
        "where does my money go", "monthly expenses",
    ]),
    ("sip_calc", [
        "calculate sip", "sip calculator", "how much sip",
        "sip for", "monthly sip", "systematic investment",
    ]),
    ("tax_compare", [
        "tax regime", "compare tax", "old vs new", "old regime",
        "new regime", "tax comparison", "tax saving",
    ]),
    ("insurance_need", [
        "insurance", "life cover", "insurance gap",
        "how much insurance", "term insurance",
    ]),
    ("asset_allocation", [
        "asset allocation", "how to allocate", "equity debt split",
    ]),
]


def _pre_route(message: str) -> str | None:
    lower = message.lower()
    for intent, keywords in _INTENT_PATTERNS:
        for kw in keywords:
            if kw in lower:
                return intent
    return None


# ── Compact context builder ──────────────────────────────────────────

def _build_compact_context(context: dict | None) -> str:
    if not context:
        return "No financial data available."

    lines = []
    p = context.get("profile") or {}
    if p:
        parts = []
        if p.get("full_name"): parts.append(p["full_name"])
        if p.get("age"): parts.append(f"Age {p['age']}")
        if p.get("city"): parts.append(p["city"])
        if p.get("employment_type"): parts.append(p["employment_type"])
        if p.get("risk_profile"): parts.append(f"Risk: {p['risk_profile']}")
        lines.append("Profile: " + ", ".join(parts))

    inc = context.get("income") or {}
    if inc.get("gross_salary"):
        lines.append(f"Income: Rs {inc['gross_salary']:,.0f}/yr, Expenses: Rs {inc.get('monthly_expenses', 0):,.0f}/mo")

    inv = context.get("investments") or []
    if inv:
        total = sum(float(i.get("current_value", 0)) for i in inv)
        lines.append(f"Investments: {len(inv)} holdings worth Rs {total:,.0f}")

    debts = context.get("debts") or []
    if debts:
        total_d = sum(float(d.get("outstanding_amount", 0)) for d in debts)
        lines.append(f"Debts: Rs {total_d:,.0f} outstanding")

    goals = context.get("goals") or []
    if goals:
        lines.append(f"Goals: {len(goals)} financial goals set")

    ins = context.get("insurance") or []
    if ins:
        life = sum(float(i.get("cover_amount", 0)) for i in ins if str(i.get("type", "")).lower() == "life")
        health = sum(float(i.get("cover_amount", 0)) for i in ins if str(i.get("type", "")).lower() == "health")
        lines.append(f"Insurance: Life Rs {life:,.0f}, Health Rs {health:,.0f}")

    comp = context.get("computed") or {}
    if comp:
        lines.append(f"Net Worth: Rs {comp.get('net_worth', 0):,.0f}, Monthly Surplus: Rs {comp.get('monthly_surplus', 0):,.0f}")

    hs = context.get("health_score")
    if hs:
        lines.append(f"Health Score: {hs.get('overall_score', 0):.0f}/100")

    fp = context.get("fire_plan")
    if fp:
        lines.append(f"FIRE Number: Rs {fp.get('fire_number', 0):,.0f}, Years: {fp.get('years_to_fire', 0)}")

    return "\n".join(lines) if lines else "No financial data available."


# ── Tool executors ───────────────────────────────────────────────────

def _execute_tool(intent: str, params: dict, context: dict | None = None) -> dict:
    if intent == "sip_calc":
        result = calculate_sip(
            target=params.get("target", 0),
            years=params.get("years", 10),
            annual_return=params.get("annual_return", 12),
        )
        return {"tool": "SIP Calculator", "monthly_sip_needed": result}

    if intent == "future_value":
        result = calculate_future_value(
            sip=params.get("sip", 0),
            years=params.get("years", 10),
            annual_return=params.get("annual_return", 12),
        )
        return {"tool": "Future Value Calculator", "future_value": result}

    if intent == "tax_compare":
        old = calculate_tax_old(
            gross_salary=params.get("gross_salary", 0),
            sec_80c=params.get("sec_80c", 0),
            sec_80d=params.get("sec_80d", 0),
            hra_exemption=params.get("hra_exemption", 0),
            nps=params.get("nps", 0),
        )
        new = calculate_tax_new(gross_salary=params.get("gross_salary", 0))
        savings = abs(old["total_tax"] - new["total_tax"])
        recommended = "old" if old["total_tax"] < new["total_tax"] else "new"
        return {
            "tool": "Tax Regime Comparator",
            "old_regime_tax": old["total_tax"],
            "new_regime_tax": new["total_tax"],
            "savings": savings,
            "recommended_regime": recommended,
        }

    if intent == "insurance_need":
        result = calculate_insurance_need(
            annual_income=params.get("annual_income", 0),
            age=params.get("age", 30),
            outstanding_debts=params.get("outstanding_debts", 0),
            dependents=params.get("dependents", 1),
        )
        return {"tool": "Insurance Calculator", **result}

    if intent == "asset_allocation":
        result = get_allocation_by_age(
            age=params.get("age", 30),
            risk_profile=params.get("risk_profile", "moderate"),
        )
        return {"tool": "Asset Allocator", "allocation": result}

    if intent == "portfolio_summary":
        return _build_portfolio_summary(context)
    if intent == "goal_tracker":
        return _build_goal_tracker(context)
    if intent == "net_worth_summary":
        return _build_net_worth(context)
    if intent == "spending_analysis":
        return _build_spending_analysis(context)
    if intent == "profile_snapshot":
        return _build_profile_snapshot(context)

    return {}


def _build_portfolio_summary(context: dict | None) -> dict:
    if not context:
        return {"tool": "Portfolio Summary", "message": "No investment data available"}
    investments = context.get("investments", [])
    if not investments:
        return {"tool": "Portfolio Summary", "message": "No investments found. Start investing to build your portfolio."}
    type_totals: dict[str, float] = {}
    total_value = 0.0
    total_sip = 0.0
    for inv in investments:
        t = str(inv.get("type", "other")).replace("_", " ").title()
        val = float(inv.get("current_value", 0))
        type_totals[t] = type_totals.get(t, 0) + val
        total_value += val
        total_sip += float(inv.get("monthly_sip", 0))
    breakdown = {k: round(v) for k, v in sorted(type_totals.items(), key=lambda x: -x[1])}
    return {
        "tool": "Portfolio Summary",
        "total_value": round(total_value),
        "total_monthly_sip": round(total_sip),
        "num_investments": len(investments),
        "breakdown": breakdown,
    }


def _build_goal_tracker(context: dict | None) -> dict:
    if not context:
        return {"tool": "Goal Tracker", "message": "No goals data available"}
    goals = context.get("goals", [])
    if not goals:
        return {"tool": "Goal Tracker", "message": "No goals set yet. Set financial goals to track progress."}
    goal_list = []
    for g in goals:
        target = float(g.get("target_amount", 0))
        current = float(g.get("current_savings", 0))
        progress = round((current / target) * 100, 1) if target > 0 else 0
        goal_list.append({
            "name": g.get("name", "Goal"),
            "category": g.get("category", "general"),
            "target": round(target),
            "current": round(current),
            "progress_pct": min(progress, 100),
            "target_date": g.get("target_date", ""),
            "monthly_sip": round(float(g.get("monthly_sip", 0))),
        })
    return {"tool": "Goal Tracker", "total_goals": len(goal_list), "goals": goal_list}


def _build_net_worth(context: dict | None) -> dict:
    if not context:
        return {"tool": "Net Worth Summary", "message": "No financial data available"}
    investments = context.get("investments", [])
    debts = context.get("debts", [])
    insurance = context.get("insurance", [])
    assets = {}
    for inv in investments:
        t = str(inv.get("type", "other")).replace("_", " ").title()
        assets[t] = assets.get(t, 0) + float(inv.get("current_value", 0))
    assets = {k: round(v) for k, v in assets.items() if v > 0}
    liabilities = {}
    for d in debts:
        t = str(d.get("type", "loan")).replace("_", " ").title()
        liabilities[t] = liabilities.get(t, 0) + float(d.get("outstanding_amount", 0))
    liabilities = {k: round(v) for k, v in liabilities.items() if v > 0}
    total_assets = sum(assets.values())
    total_liabilities = sum(liabilities.values())
    life_cover = sum(float(i.get("cover_amount", 0)) for i in insurance if str(i.get("type", "")).lower() == "life")
    health_cover = sum(float(i.get("cover_amount", 0)) for i in insurance if str(i.get("type", "")).lower() == "health")
    return {
        "tool": "Net Worth Summary",
        "net_worth": round(total_assets - total_liabilities),
        "total_assets": round(total_assets),
        "total_liabilities": round(total_liabilities),
        "assets_breakdown": assets,
        "liabilities_breakdown": liabilities,
        "life_insurance_cover": round(life_cover),
        "health_insurance_cover": round(health_cover),
    }


def _build_spending_analysis(context: dict | None) -> dict:
    if not context:
        return {"tool": "Spending Analysis", "message": "No spending data available"}
    income = context.get("income", {})
    if not income:
        return {"tool": "Spending Analysis", "message": "No income/expense data available"}
    gross = float(income.get("gross_salary", 0))
    monthly_expenses = float(income.get("monthly_expenses", 0))
    monthly_income = gross / 12 if gross > 0 else 0
    savings_rate = round(((monthly_income - monthly_expenses) / monthly_income) * 100, 1) if monthly_income > 0 else 0
    breakdown = income.get("expense_breakdown", {})
    categorized = {}
    for k, v in breakdown.items():
        if k == "total" or not isinstance(v, (int, float)):
            continue
        if v > 0:
            categorized[k.replace("_", " ").title()] = round(v)
    return {
        "tool": "Spending Analysis",
        "monthly_income": round(monthly_income),
        "monthly_expenses": round(monthly_expenses),
        "monthly_surplus": round(monthly_income - monthly_expenses),
        "savings_rate_pct": savings_rate,
        "expense_breakdown": categorized,
        "ideal_savings_rate": 30,
        "savings_gap": max(0, round(monthly_income * 0.3 - (monthly_income - monthly_expenses))),
    }


def _build_profile_snapshot(context: dict | None) -> dict:
    if not context:
        return {"tool": "Profile Snapshot", "message": "No profile data available. Complete your Money Profile first."}
    profile = context.get("profile", {}) or {}
    income = context.get("income", {}) or {}
    investments = context.get("investments", [])
    insurance = context.get("insurance", [])
    debts = context.get("debts", [])
    goals = context.get("goals", [])
    computed = context.get("computed", {})
    health = context.get("health_score")
    fire = context.get("fire_plan")
    total_inv = sum(float(i.get("current_value", 0)) for i in investments)
    total_debt = sum(float(d.get("outstanding_amount", 0)) for d in debts)
    life_cover = sum(float(i.get("cover_amount", 0)) for i in insurance if str(i.get("type", "")).lower() == "life")
    health_cover = sum(float(i.get("cover_amount", 0)) for i in insurance if str(i.get("type", "")).lower() == "health")
    return {
        "tool": "Profile Snapshot",
        "full_name": profile.get("full_name", "User"),
        "age": profile.get("age"),
        "city": profile.get("city"),
        "employment_type": profile.get("employment_type", "salaried"),
        "risk_profile": profile.get("risk_profile", "moderate"),
        "tax_regime": profile.get("tax_regime", "new"),
        "marital_status": profile.get("marital_status", "single"),
        "dependents": profile.get("dependents", 0),
        "gross_salary": float(income.get("gross_salary", 0)),
        "monthly_expenses": float(income.get("monthly_expenses", 0)),
        "net_worth": round(total_inv - total_debt),
        "total_investments": round(total_inv),
        "num_investments": len(investments),
        "total_debt": round(total_debt),
        "num_goals": len(goals),
        "life_insurance_cover": round(life_cover),
        "health_insurance_cover": round(health_cover),
        "health_score": round(float(health.get("overall_score", 0))) if health else None,
        "fire_number": round(float(fire.get("fire_number", 0))) if fire else None,
        "monthly_surplus": computed.get("monthly_surplus", 0),
    }


# ── Auto-extract params from context for calculator tools ────────────

def _auto_params(intent: str, context: dict | None) -> dict:
    if not context:
        return {}
    profile = context.get("profile") or {}
    income = context.get("income") or {}
    computed = context.get("computed") or {}

    if intent == "tax_compare":
        return {"gross_salary": float(income.get("gross_salary", 0))}
    if intent == "insurance_need":
        return {
            "annual_income": float(income.get("gross_salary", 0)),
            "age": profile.get("age", 30),
            "outstanding_debts": float(computed.get("total_debt", 0)),
            "dependents": profile.get("dependents", 1),
        }
    if intent == "asset_allocation":
        return {
            "age": profile.get("age", 30),
            "risk_profile": profile.get("risk_profile", "moderate"),
        }
    if intent == "sip_calc":
        gross = float(income.get("gross_salary", 0))
        return {"target": max(gross * 5, 1000000), "years": 10}
    return {}


# ── Response formatter ───────────────────────────────────────────────

def _format_tool_response_text(intent: str, tool_result: dict, context: dict | None) -> str:
    tool_name = tool_result.get("tool", intent)

    if intent == "profile_snapshot":
        name = tool_result.get("full_name", "User")
        age = tool_result.get("age")
        city = tool_result.get("city")
        nw = tool_result.get("net_worth", 0)
        salary = tool_result.get("gross_salary", 0)
        parts = [f"Here's your complete financial snapshot, **{name}**!"]
        info = []
        if age: info.append(f"{age} years old")
        if city: info.append(f"based in {city}")
        if info: parts.append(" | ".join(info))
        if salary: parts.append(f"\n\nAnnual income: **Rs {salary:,.0f}** | Net worth: **Rs {nw:,.0f}**")
        n_inv = tool_result.get("num_investments", 0)
        n_goals = tool_result.get("num_goals", 0)
        parts.append(f"\n\n{n_inv} investments | {n_goals} goals | Health score: {tool_result.get('health_score') or '—'}/100")
        parts.append("\n\nAsk me to dive into any specific area — portfolio, goals, spending, taxes, or insurance!")
        return "".join(parts)

    if intent == "portfolio_summary":
        tv = tool_result.get("total_value", 0)
        n = tool_result.get("num_investments", 0)
        sip = tool_result.get("total_monthly_sip", 0)
        return f"**Portfolio Summary**\n\nYou have **{n} investments** worth **Rs {tv:,.0f}** with monthly SIPs of **Rs {sip:,.0f}**.\n\nConsider diversifying across asset classes for optimal risk-adjusted returns."

    if intent == "goal_tracker":
        n = tool_result.get("total_goals", 0)
        return f"**Goal Progress**\n\nYou have **{n} financial goals**. Track your progress below and adjust SIPs as needed.\n\nTip: Increase SIP by 10% annually to stay ahead of inflation."

    if intent == "net_worth_summary":
        nw = tool_result.get("net_worth", 0)
        ta = tool_result.get("total_assets", 0)
        tl = tool_result.get("total_liabilities", 0)
        return f"**Net Worth: Rs {nw:,.0f}**\n\nAssets: Rs {ta:,.0f} | Liabilities: Rs {tl:,.0f}\n\n{'Great — you are debt free!' if tl == 0 else 'Focus on paying down high-interest debt first.'}"

    if intent == "spending_analysis":
        mi = tool_result.get("monthly_income", 0)
        me = tool_result.get("monthly_expenses", 0)
        sr = tool_result.get("savings_rate_pct", 0)
        return f"**Spending Analysis**\n\nMonthly income: **Rs {mi:,.0f}** | Expenses: **Rs {me:,.0f}** | Savings rate: **{sr}%**\n\n{'Excellent savings rate!' if sr >= 30 else 'Target at least 30% savings rate for long-term wealth.'}"

    if intent == "tax_compare":
        old_t = tool_result.get("old_regime_tax", 0)
        new_t = tool_result.get("new_regime_tax", 0)
        sav = tool_result.get("savings", 0)
        rec = tool_result.get("recommended_regime", "new")
        return f"**Tax Regime Comparison**\n\n- Old Regime: Rs {old_t:,.0f}\n- New Regime: Rs {new_t:,.0f}\n- **Save Rs {sav:,.0f}** with **{rec.title()} Regime**"

    if intent == "insurance_need":
        rc = tool_result.get("recommended_cover", 0)
        return f"**Insurance Analysis**\n\nRecommended life cover: **Rs {rc:,.0f}** (10-15x annual income).\n\nAlso ensure you have health insurance of at least Rs 5 lakh family floater."

    if intent == "sip_calc":
        sip = tool_result.get("monthly_sip_needed", 0)
        return f"**SIP Calculator**\n\nYou need a monthly SIP of **Rs {sip:,.0f}** to reach your target.\n\nStart early and increase by 10% yearly to beat inflation."

    if intent == "asset_allocation":
        alloc = tool_result.get("allocation", {})
        return f"**Asset Allocation**\n\nRecommended split: {json.dumps(alloc)}\n\nRebalance annually to maintain your target allocation."

    return json.dumps(tool_result, indent=2, default=str)


# ── Smart suggestions ────────────────────────────────────────────────

def _get_smart_suggestions(context: dict | None) -> list[str]:
    suggestions = []
    if not context:
        return ["What do you know about me?", "Calculate my SIP", "Compare tax regimes"]
    suggestions.append("What do you know about me?")
    inv = context.get("investments", [])
    if inv:
        suggestions.append("Show my portfolio breakdown")
    else:
        suggestions.append("How should I start investing?")
    goals = context.get("goals", [])
    if goals:
        suggestions.append("How are my goals progressing?")
    else:
        suggestions.append("Help me set financial goals")
    suggestions.append("What's my net worth?")
    suggestions.append("Analyze my spending")
    suggestions.append("Check my insurance gap")
    return suggestions[:6]


# ── Main agent entry point (SYNC) ────────────────────────────────────

AGENT_SYSTEM_PROMPT = """You are DhanGuru, an expert AI financial mentor for Indian users.
Given the user's message and their financial summary, respond with a JSON object:

{"intent": "<intent>", "tool_params": {}, "follow_up_text": "<your personalized advice>"}

Intents: sip_calc, future_value, tax_compare, insurance_need, asset_allocation,
portfolio_summary, goal_tracker, net_worth_summary, spending_analysis, profile_snapshot, general_advice.

Rules:
- "about me" / "who am I" / "my profile" / "what do you know" -> profile_snapshot
- "portfolio" / "investments" -> portfolio_summary
- "goals" / "goal progress" -> goal_tracker
- "net worth" -> net_worth_summary
- "spending" / "expenses" -> spending_analysis
- "sip" / "systematic" -> sip_calc (extract target, years from message)
- "tax" / "regime" -> tax_compare (extract gross_salary from context)
- "insurance" / "cover" -> insurance_need
- "allocation" -> asset_allocation
- For general questions, use general_advice and give detailed personalized advice in follow_up_text.
- ALWAYS use the user's real data. NEVER make up numbers.
Respond ONLY with valid JSON."""


def run_agent(message: str, context: dict = None) -> dict:
    """Run the agentic pipeline: pre-route -> (optional LLM) -> tool -> format."""

    # Step 1: Deterministic pre-routing
    pre_intent = _pre_route(message)

    if pre_intent:
        if pre_intent in ("profile_snapshot", "portfolio_summary", "goal_tracker",
                          "net_worth_summary", "spending_analysis"):
            tool_result = _execute_tool(pre_intent, {}, context)
            response_text = _format_tool_response_text(pre_intent, tool_result, context)
            return {
                "response": response_text,
                "tool_used": tool_result.get("tool", pre_intent),
                "tool_result": tool_result,
                "display_type": DISPLAY_TYPE_MAP.get(pre_intent),
                "action_links": ACTION_LINKS_MAP.get(pre_intent, []),
                "suggestions": FOLLOW_UP_MAP.get(pre_intent, _get_smart_suggestions(context)),
            }

        if pre_intent in ("tax_compare", "insurance_need", "asset_allocation", "sip_calc"):
            params = _auto_params(pre_intent, context)
            tool_result = _execute_tool(pre_intent, params, context)
            response_text = _format_tool_response_text(pre_intent, tool_result, context)
            return {
                "response": response_text,
                "tool_used": tool_result.get("tool", pre_intent),
                "tool_result": tool_result,
                "display_type": DISPLAY_TYPE_MAP.get(pre_intent),
                "action_links": ACTION_LINKS_MAP.get(pre_intent, []),
                "suggestions": FOLLOW_UP_MAP.get(pre_intent, _get_smart_suggestions(context)),
            }

    # Step 2: LLM classification for ambiguous queries
    compact_ctx = _build_compact_context(context)

    prompt = f"""User message: {message}

User financial summary:
{compact_ctx}

Classify the intent and respond with JSON."""

    try:
        raw = generate_json(prompt, AGENT_SYSTEM_PROMPT)
        parsed = json.loads(raw)
    except (json.JSONDecodeError, Exception):
        response_text = generate(
            f"User asks: {message}\n\nUser data:\n{compact_ctx}\n\n"
            "Give helpful, personalized financial advice. Use their actual numbers. "
            "Be specific and actionable. Use Rs for amounts.",
            "You are DhanGuru, an expert Indian financial advisor."
        )
        return {
            "response": response_text,
            "tool_used": None,
            "tool_result": None,
            "display_type": None,
            "action_links": [],
            "suggestions": _get_smart_suggestions(context),
        }

    intent = parsed.get("intent", "general_advice")
    tool_params = parsed.get("tool_params", {})
    follow_up = parsed.get("follow_up_text", "")

    # Step 3: Handle LLM-classified intent
    if intent == "general_advice":
        if follow_up and len(follow_up) > 20:
            response_text = follow_up
        else:
            response_text = generate(
                f"User asks: {message}\n\nUser data:\n{compact_ctx}\n\n"
                "Give helpful, personalized financial advice. Reference their actual data. "
                "Be specific with numbers. Use Rs for amounts. Keep it 3-5 sentences.",
                "You are DhanGuru, an expert Indian financial advisor."
            )
        return {
            "response": response_text,
            "tool_used": None,
            "tool_result": None,
            "display_type": None,
            "action_links": [],
            "suggestions": _get_smart_suggestions(context),
        }

    tool_result = _execute_tool(intent, tool_params, context)

    profile = context.get("profile", {}) if context else {}
    income = context.get("income", {}) if context else {}
    format_prompt = f"""Present these financial results conversationally.

Question: {message}
Tool: {tool_result.get('tool', intent)}
Result: {json.dumps(tool_result, default=str)}
User: {profile.get('full_name', 'User')}, Age {profile.get('age', '?')}, Income Rs {income.get('gross_salary', 0):,.0f}/yr

Write 3-5 sentences. State key numbers clearly. Give one actionable next step. Use Rs for amounts. Use **bold** for important numbers."""

    formatted = generate(format_prompt, "You are DhanGuru, an expert Indian financial advisor. Be concise and actionable.")

    return {
        "response": formatted,
        "tool_used": tool_result.get("tool", intent),
        "tool_result": tool_result,
        "display_type": DISPLAY_TYPE_MAP.get(intent),
        "action_links": ACTION_LINKS_MAP.get(intent, []),
        "suggestions": FOLLOW_UP_MAP.get(intent, _get_smart_suggestions(context)),
    }
