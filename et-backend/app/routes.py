import json
import io
from flask import Blueprint, request, jsonify

from app.ai_client import generate_json, generate
from app.prompts.fire_prompts import FIRE_SYSTEM_PROMPT, FIRE_PLAN_PROMPT
from app.prompts.health_prompts import HEALTH_SYSTEM_PROMPT, HEALTH_SCORE_PROMPT
from app.prompts.tax_prompts import TAX_SYSTEM_PROMPT, TAX_ANALYSIS_PROMPT
from app.prompts.event_prompts import EVENT_SYSTEM_PROMPT, EVENT_ADVICE_PROMPT
from app.prompts.mf_prompts import MF_SYSTEM_PROMPT, MF_REBALANCE_PROMPT
from app.calculators.sip_calculator import calculate_sip, calculate_future_value
from app.calculators.asset_allocator import get_allocation_by_age
from app.calculators.tax_calculator import calculate_tax_old, calculate_tax_new
from app.calculators.xirr_calculator import calculate_xirr
from app.calculators.insurance_calculator import calculate_insurance_need
from app.calculators.monte_carlo import run_fire_simulation
from app.agent import run_agent
from app.parsers.form16_parser import parse_form16_text
from app.parsers.cams_parser import parse_cams_csv
from app.parsers.pdf_parser import parse_pdf_file

bp = Blueprint("api", __name__)


def _json():
    """Get JSON body from request."""
    return request.get_json(force=True, silent=True) or {}


# ── AI-Powered Endpoints ───────────────────────────────────────────


@bp.route("/ai/fire/plan", methods=["POST"])
def fire_plan():
    data = _json()
    age = data.get("age", 30)
    retirement_age = data.get("retirement_age", 55)
    monthly_income = data.get("monthly_income", 0)
    monthly_expenses = data.get("monthly_expenses", 0)
    existing_corpus = data.get("existing_corpus", 0)
    expected_return_rate = data.get("expected_return_rate", 12.0)
    inflation_rate = data.get("inflation_rate", 6.0)
    volatility = data.get("volatility", 15.0)
    risk_profile = data.get("risk_profile", "moderate")
    goals_raw = data.get("goals", [])
    run_mc = data.get("run_monte_carlo", True)

    goals_text = ""
    for i, g in enumerate(goals_raw, 1):
        goals_text += f"{i}. {g.get('name', 'Goal')} ({g.get('category', 'general')}): Rs {g.get('target_amount', 0):,.0f} by {g.get('target_date', 'N/A')}\n"

    prompt = FIRE_PLAN_PROMPT.format(
        age=age,
        retirement_age=retirement_age,
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        existing_corpus=existing_corpus,
        risk_profile=risk_profile,
        expected_return=expected_return_rate,
        inflation_rate=inflation_rate,
        goals_text=goals_text or "No specific goals provided",
    )

    ai_response = generate_json(prompt, FIRE_SYSTEM_PROMPT)

    fire_number = monthly_expenses * 12 * 25
    years_to_fire = retirement_age - age
    monthly_sip = calculate_sip(
        target=fire_number - existing_corpus,
        years=years_to_fire,
        annual_return=expected_return_rate,
    )
    allocation = get_allocation_by_age(age, risk_profile)

    goal_results = []
    from datetime import datetime
    for goal in goals_raw:
        try:
            target_year = int(str(goal.get("target_date", "")).split("-")[0])
        except Exception:
            target_year = datetime.now().year + 5
        goal_sip = calculate_sip(
            target=goal.get("target_amount", 0) - goal.get("current_savings", 0),
            years=max(target_year - datetime.now().year, 1),
            annual_return=expected_return_rate,
        )
        goal_results.append({
            "name": goal.get("name", "Goal"),
            "category": goal.get("category", "general"),
            "target_amount": goal.get("target_amount", 0),
            "current_savings": goal.get("current_savings", 0),
            "target_date": goal.get("target_date", ""),
            "priority": goal.get("priority", "medium"),
            "sip_required": goal_sip,
            "recommended_asset_allocation": allocation,
        })

    monte_carlo_data = None
    if run_mc:
        try:
            monte_carlo_data = run_fire_simulation(
                current_age=age,
                target_fire_age=retirement_age,
                current_corpus=existing_corpus,
                monthly_sip=monthly_sip,
                monthly_expenses=monthly_expenses,
                expected_return=expected_return_rate,
                volatility=volatility,
                inflation_rate=inflation_rate,
                n_simulations=5000,
            )
        except Exception:
            monte_carlo_data = None

    try:
        ai_data = json.loads(ai_response)
        ai_summary = ai_data.get("ai_summary", "Plan generated successfully.")
        insurance_gaps = ai_data.get("insurance_gaps", [])
        tax_moves = ai_data.get("tax_saving_moves", [])
    except (json.JSONDecodeError, Exception):
        ai_summary = "Your FIRE plan has been generated. Review your goals and SIP amounts below."
        insurance_gaps = []
        tax_moves = []

    return jsonify({
        "fire_number": fire_number,
        "years_to_fire": years_to_fire,
        "monthly_sip_needed": monthly_sip,
        "goals": goal_results,
        "asset_allocation": allocation,
        "insurance_gaps": insurance_gaps,
        "tax_saving_moves": tax_moves,
        "emergency_fund_target": monthly_expenses * 6,
        "ai_summary": ai_summary,
        "monte_carlo": monte_carlo_data,
    })


@bp.route("/ai/health/score", methods=["POST"])
def health_score():
    data = _json()
    monthly_income = data.get("monthly_income", 0)
    monthly_expenses = data.get("monthly_expenses", 0)
    emergency_fund = data.get("emergency_fund", 0)
    emergency_months = data.get("emergency_months", 0)
    has_life_insurance = data.get("has_life_insurance", False)
    life_cover = data.get("life_cover", 0)
    has_health_insurance = data.get("has_health_insurance", False)
    health_cover = data.get("health_cover", 0)
    total_investments = data.get("total_investments", 0)
    investment_breakdown = data.get("investment_breakdown", {})
    total_emi = data.get("total_emi", 0)
    debt_ratio = data.get("debt_ratio", 0)
    tax_regime = data.get("tax_regime", "new")
    risk_profile = data.get("risk_profile", "moderate")
    age = data.get("age", 30)

    emergency_score = min(100, (emergency_months / 6) * 100) if emergency_months > 0 else min(100, (emergency_fund / max(monthly_expenses * 6, 1)) * 100)

    ideal_life_cover = monthly_income * 12 * max(60 - age, 10)
    life_score = min(50, (life_cover / max(ideal_life_cover, 1)) * 50) if has_life_insurance else 0
    health_score_val = 25 if has_health_insurance else 0
    health_adequate = 25 if health_cover >= 500000 else (health_cover / 500000) * 25
    insurance_score = life_score + health_score_val + health_adequate

    n_classes = len(investment_breakdown) if investment_breakdown else (1 if total_investments > 0 else 0)
    investment_score = min(100, n_classes * 25)

    debt_score = max(0, (1 - debt_ratio / 0.5) * 100) if debt_ratio < 0.5 else 0
    tax_score = 50

    retirement_target = monthly_expenses * 12 * 25
    retirement_score = min(100, (total_investments / max(retirement_target, 1)) * 100)

    dimensions = {
        "emergency_preparedness": {"score": round(emergency_score), "max": 100},
        "insurance_coverage": {"score": round(insurance_score), "max": 100},
        "investment_diversification": {"score": round(investment_score), "max": 100},
        "debt_health": {"score": round(debt_score), "max": 100},
        "tax_efficiency": {"score": round(tax_score), "max": 100},
        "retirement_readiness": {"score": round(retirement_score), "max": 100},
    }

    weights = [0.20, 0.15, 0.20, 0.15, 0.10, 0.20]
    scores = [emergency_score, insurance_score, investment_score, debt_score, tax_score, retirement_score]
    overall = sum(s * w for s, w in zip(scores, weights))

    prompt = HEALTH_SCORE_PROMPT.format(
        monthly_income=monthly_income,
        monthly_expenses=monthly_expenses,
        emergency_fund=emergency_fund,
        emergency_months=emergency_months,
        has_life_insurance=has_life_insurance,
        life_cover=life_cover,
        has_health_insurance=has_health_insurance,
        health_cover=health_cover,
        total_investments=total_investments,
        investment_breakdown=json.dumps(investment_breakdown),
        total_emi=total_emi,
        debt_ratio=debt_ratio,
        tax_regime=tax_regime,
        risk_profile=risk_profile,
    )

    ai_response = generate_json(prompt, HEALTH_SYSTEM_PROMPT)

    try:
        ai_data = json.loads(ai_response)
        ai_summary = ai_data.get("ai_summary", "")
        top_actions = ai_data.get("top_3_actions", [])
        for dim_key in dimensions:
            if dim_key in ai_data.get("dimensions", {}):
                ai_dim = ai_data["dimensions"][dim_key]
                dimensions[dim_key]["status"] = ai_dim.get("status", "")
                dimensions[dim_key]["details"] = ai_dim.get("details", "")
                dimensions[dim_key]["actions"] = ai_dim.get("actions", [])
    except (json.JSONDecodeError, Exception):
        ai_summary = "Review your financial health across all dimensions."
        top_actions = []

    return jsonify({
        "overall_score": round(overall),
        "dimensions": dimensions,
        "ai_summary": ai_summary,
        "top_3_actions": top_actions,
    })


@bp.route("/ai/tax/analyze", methods=["POST"])
def tax_analyze():
    data = _json()
    financial_year = data.get("financial_year", "2025-26")
    income_details = data.get("income_details", {})
    deductions = data.get("deductions", {})
    risk_profile = data.get("risk_profile", "moderate")

    gross_salary = income_details.get("gross_salary", 0)
    hra_received = income_details.get("hra_received", 0)
    income_from_other_sources = income_details.get("income_from_other_sources", 0)
    standard_deduction = income_details.get("standard_deduction", 50000)

    sec_80c = deductions.get("section_80c", {}).get("total", 0)
    sec_80d = deductions.get("section_80d", {}).get("total", 0)
    nps = deductions.get("nps_80ccd_1b", 0)
    home_loan_interest = deductions.get("home_loan_interest_24b", 0)
    education_loan = deductions.get("education_loan_80e", 0)
    donations = deductions.get("donations_80g", 0)
    savings_interest = deductions.get("savings_interest_80tta", 0)
    hra_exemption = deductions.get("hra_exemption", 0)

    old_tax = calculate_tax_old(
        gross_salary=gross_salary,
        hra_exemption=hra_exemption,
        standard_deduction=standard_deduction,
        sec_80c=sec_80c,
        sec_80d=sec_80d,
        nps=nps,
        home_loan_interest=home_loan_interest,
        other_deductions=education_loan + donations + savings_interest,
    )
    new_tax = calculate_tax_new(gross_salary=gross_salary)

    regime_comparison = {
        "old_regime": old_tax,
        "new_regime": new_tax,
        "recommended_regime": "old" if old_tax["total_tax"] < new_tax["total_tax"] else "new",
        "savings": abs(old_tax["total_tax"] - new_tax["total_tax"]),
    }

    missed = []
    if sec_80c < 150000:
        gap = 150000 - sec_80c
        missed.append({
            "section": "80C", "current": sec_80c, "max": 150000, "gap": gap,
            "potential_savings": round(gap * 0.3),
            "suggestions": ["ELSS Mutual Funds", "PPF", "5-year Tax Saver FD", "Life Insurance Premium"],
        })
    if sec_80d < 25000:
        gap = 25000 - sec_80d
        missed.append({
            "section": "80D", "current": sec_80d, "max": 25000, "gap": gap,
            "potential_savings": round(gap * 0.3),
            "suggestions": ["Health Insurance for self & family"],
        })
    if nps < 50000:
        gap = 50000 - nps
        missed.append({
            "section": "80CCD(1B) - NPS", "current": nps, "max": 50000, "gap": gap,
            "potential_savings": round(gap * 0.3),
            "suggestions": ["National Pension System (NPS) contribution"],
        })

    prompt = TAX_ANALYSIS_PROMPT.format(
        financial_year=financial_year,
        gross_salary=gross_salary,
        hra_received=hra_received,
        other_income=income_from_other_sources,
        sec_80c=sec_80c,
        sec_80d=sec_80d,
        nps=nps,
        home_loan_interest=home_loan_interest,
        hra_exemption=hra_exemption,
        risk_profile=risk_profile,
    )
    ai_response = generate_json(prompt, TAX_SYSTEM_PROMPT)

    try:
        ai_data = json.loads(ai_response)
        investments = ai_data.get("tax_saving_investments", [])
        ai_summary = ai_data.get("ai_summary", "")
    except (json.JSONDecodeError, Exception):
        investments = []
        ai_summary = "Tax analysis complete. Review regime comparison above."

    return jsonify({
        "regime_comparison": regime_comparison,
        "missed_deductions": missed,
        "tax_saving_investments": investments,
        "ai_summary": ai_summary,
    })


@bp.route("/ai/events/advise", methods=["POST"])
def event_advise():
    data = _json()
    prompt = EVENT_ADVICE_PROMPT.format(
        event_type=data.get("event_type", ""),
        event_date=data.get("event_date", ""),
        amount=data.get("amount", 0),
        description=data.get("description", ""),
        annual_income=data.get("annual_income", 0),
        risk_profile=data.get("risk_profile", "moderate"),
        tax_regime=data.get("tax_regime", "new"),
        investments_summary=data.get("investments_summary", "None"),
        debts_summary=data.get("debts_summary", "No debts"),
        life_cover=data.get("life_cover", 0),
        health_cover=data.get("health_cover", 0),
    )
    ai_response = generate_json(prompt, EVENT_SYSTEM_PROMPT)
    try:
        return jsonify(json.loads(ai_response))
    except (json.JSONDecodeError, Exception):
        return jsonify({
            "summary": "Please consult with a financial advisor for personalized advice on this life event.",
            "tax_implications": "Tax implications depend on the specific event details.",
            "investment_recommendations": [],
            "insurance_changes": [],
            "action_checklist": [],
        })


@bp.route("/ai/mf/analyze", methods=["POST"])
def mf_analyze():
    data = _json()
    holdings_raw = data.get("holdings", [])
    risk_profile = data.get("risk_profile", "moderate")

    for h in holdings_raw:
        txns = h.get("transactions", [])
        if txns:
            h["xirr"] = calculate_xirr(txns, h.get("current_value", 0))

    total_invested = sum(h.get("invested_amount", 0) for h in holdings_raw)
    total_current = sum(h.get("current_value", 0) for h in holdings_raw)
    overall_xirr = ((total_current / max(total_invested, 1)) - 1) * 100
    expense_drag = sum(h.get("expense_ratio", 0) * h.get("current_value", 0) / 100 for h in holdings_raw)

    category_map: dict[str, list[str]] = {}
    for h in holdings_raw:
        cat = h.get("category", "N/A")
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(h.get("fund_name", ""))

    overlap = []
    for cat, funds in category_map.items():
        if len(funds) > 1:
            overlap.append({
                "stock_name": f"{cat} category overlap",
                "funds_holding": funds,
                "total_weight_pct": len(funds) * 10,
            })

    overlap_pct = sum(o["total_weight_pct"] for o in overlap[:10]) / max(len(overlap), 1)

    expense_drag_projections = {
        "10_years": round(expense_drag * 10 * 1.5, 0),
        "20_years": round(expense_drag * 20 * 2.5, 0),
        "30_years": round(expense_drag * 30 * 4.0, 0),
    }

    holdings_text = "\n".join(
        f"- {h.get('fund_name', '')} ({h.get('category', '')}): Rs {h.get('current_value', 0):,.0f}, "
        f"XIRR: {h.get('xirr', 0):.1f}%, ER: {h.get('expense_ratio', 0):.2f}%"
        for h in holdings_raw
    )
    overlap_text = "\n".join(
        f"- {o['stock_name']}: in {len(o['funds_holding'])} funds, weight {o['total_weight_pct']:.1f}%"
        for o in overlap[:10]
    )

    prompt = MF_REBALANCE_PROMPT.format(
        total_invested=total_invested,
        current_value=total_current,
        overall_xirr=overall_xirr,
        expense_drag=expense_drag,
        overlap_pct=overlap_pct,
        holdings_text=holdings_text or "No holdings parsed",
        overlap_text=overlap_text or "No overlap detected",
        risk_profile=risk_profile,
    )
    ai_response = generate_json(prompt, MF_SYSTEM_PROMPT)

    try:
        ai_data = json.loads(ai_response)
        rebalancing = ai_data.get("rebalancing_suggestions", [])
        ai_summary = ai_data.get("ai_summary", "")
    except (json.JSONDecodeError, Exception):
        rebalancing = []
        ai_summary = "Portfolio analysis complete."

    return jsonify({
        "holdings": holdings_raw,
        "portfolio_summary": {
            "total_invested": total_invested,
            "total_current_value": total_current,
            "total_returns": total_current - total_invested,
            "overall_xirr": overall_xirr,
            "expense_ratio_drag": expense_drag,
            "expense_drag_projections": expense_drag_projections,
            "overlap_pct": overlap_pct,
        },
        "overlap_analysis": overlap,
        "rebalancing_suggestions": rebalancing,
        "ai_summary": ai_summary,
    })


# ── Agentic Mentor Chat ─────────────────────────────────────────────


@bp.route("/ai/mentor/chat", methods=["POST"])
def mentor_chat():
    data = _json()
    result = run_agent(data.get("message", ""), data.get("context", {}))
    return jsonify(result)


# ── Document Parsing ─────────────────────────────────────────────────


@bp.route("/ai/tax/parse-form16", methods=["POST"])
def parse_form16():
    data = _json()
    return jsonify(parse_form16_text(data.get("text", "")))


@bp.route("/ai/mf/parse-cams", methods=["POST"])
def parse_cams():
    data = _json()
    return jsonify(parse_cams_csv(data.get("rows", [])))


@bp.route("/ai/mf/parse-statement", methods=["POST"])
def parse_statement():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded", "holdings": [], "summary": {}}), 400

    file = request.files["file"]
    filename = (file.filename or "").lower()
    content = file.read()

    if filename.endswith(".pdf"):
        result = parse_pdf_file(io.BytesIO(content))
        return jsonify(result)
    elif filename.endswith(".csv"):
        import csv as csv_module
        text = content.decode("utf-8", errors="ignore")
        reader = csv_module.DictReader(io.StringIO(text))
        rows = [dict(row) for row in reader]
        result = parse_cams_csv(rows)
        return jsonify(result)
    else:
        return jsonify({
            "error": f"Unsupported file type: {filename}. Please upload a .csv or .pdf file.",
            "holdings": [],
            "summary": {},
        })


# ── Direct Calculator Endpoints ──────────────────────────────────────


@bp.route("/calc/sip", methods=["POST"])
def calc_sip():
    data = _json()
    target = data.get("target", 0)
    years = data.get("years", 10)
    annual_return = data.get("annual_return", 12.0)
    monthly = calculate_sip(target, years, annual_return)
    fv = calculate_future_value(monthly, years, annual_return)
    return jsonify({
        "monthly_sip": monthly,
        "total_investment": round(monthly * years * 12, 0),
        "future_value": fv,
        "wealth_gain": round(fv - monthly * years * 12, 0),
    })


@bp.route("/calc/tax/compare", methods=["POST"])
def calc_tax_compare():
    data = _json()
    old = calculate_tax_old(
        gross_salary=data.get("gross_salary", 0),
        sec_80c=data.get("sec_80c", 0),
        sec_80d=data.get("sec_80d", 0),
        hra_exemption=data.get("hra_exemption", 0),
        nps=data.get("nps", 0),
        home_loan_interest=data.get("home_loan_interest", 0),
    )
    new = calculate_tax_new(data.get("gross_salary", 0))
    return jsonify({
        "old_regime": old,
        "new_regime": new,
        "recommended": "old" if old["total_tax"] < new["total_tax"] else "new",
        "savings": abs(old["total_tax"] - new["total_tax"]),
    })


@bp.route("/calc/insurance-gap", methods=["POST"])
def calc_insurance_gap():
    data = _json()
    annual_income = data.get("annual_income", 0)
    age = data.get("age", 30)
    outstanding_debts = data.get("outstanding_debts", 0)
    dependents = data.get("dependents", 1)
    current_life_cover = data.get("current_life_cover", 0)
    current_health_cover = data.get("current_health_cover", 0)
    need = calculate_insurance_need(annual_income, age, outstanding_debts, dependents)
    gap = max(0, need["recommended_cover"] - current_life_cover)
    return jsonify({
        **need,
        "current_cover": current_life_cover,
        "gap": gap,
        "gap_pct": round(gap / max(need["recommended_cover"], 1) * 100, 1),
    })


@bp.route("/calc/asset-allocation", methods=["POST"])
def calc_asset_allocation():
    data = _json()
    age = data.get("age", 30)
    risk_profile = data.get("risk_profile", "moderate")
    allocation = get_allocation_by_age(age, risk_profile)
    return jsonify({"age": age, "risk_profile": risk_profile, "allocation": allocation})


# ── Couples Optimizer ────────────────────────────────────────────────


@bp.route("/ai/couples/optimize", methods=["POST"])
def couples_optimize():
    data = _json()
    a = data.get("partner_a", {})
    b = data.get("partner_b", {})

    a_salary = a.get("gross_salary", 0)
    b_salary = b.get("gross_salary", 0)
    rent = a.get("rent_paid", 0) or b.get("rent_paid", 0)

    a_basic = a.get("basic_salary", a_salary * 0.4)
    b_basic = b.get("basic_salary", b_salary * 0.4)
    a_hra_exempt = min(a.get("hra_received", 0), a_basic * 0.5, max(0, rent * 12 - a_basic * 0.1))
    b_hra_exempt = min(b.get("hra_received", 0), b_basic * 0.5, max(0, rent * 12 - b_basic * 0.1))
    hra_recommendation = "Partner A" if a_hra_exempt > b_hra_exempt else "Partner B"

    a_old = calculate_tax_old(gross_salary=a_salary, hra_exemption=a_hra_exempt, sec_80c=a.get("sec_80c", 0))
    a_new = calculate_tax_new(a_salary)
    b_old = calculate_tax_old(gross_salary=b_salary, hra_exemption=b_hra_exempt, sec_80c=b.get("sec_80c", 0))
    b_new = calculate_tax_new(b_salary)

    combined_net_worth = (
        a.get("total_investments", 0) + b.get("total_investments", 0)
        - a.get("total_debts", 0) - b.get("total_debts", 0)
    )

    prompt = f"""Two partners want joint financial optimization.
Partner A: Salary Rs {a_salary:,.0f}, HRA exemption Rs {a_hra_exempt:,.0f}
Partner B: Salary Rs {b_salary:,.0f}, HRA exemption Rs {b_hra_exempt:,.0f}
Monthly rent: Rs {rent:,.0f}
Combined net worth: Rs {combined_net_worth:,.0f}

Provide optimization suggestions as JSON with keys:
hra_optimization, tax_split_80c, insurance_review, nps_strategy, sip_split, combined_fire_notes"""

    ai_response = generate_json(prompt, "You are DhanGuru, expert in Indian couple's financial planning.")
    try:
        ai_data = json.loads(ai_response)
    except Exception:
        ai_data = {}

    return jsonify({
        "hra_optimization": {
            "recommendation": hra_recommendation,
            "partner_a_exemption": round(a_hra_exempt),
            "partner_b_exemption": round(b_hra_exempt),
            "note": ai_data.get("hra_optimization", f"{hra_recommendation} should claim HRA for maximum benefit."),
        },
        "tax_summary": {
            "partner_a": {"old": a_old["total_tax"], "new": a_new["total_tax"], "best": "old" if a_old["total_tax"] < a_new["total_tax"] else "new"},
            "partner_b": {"old": b_old["total_tax"], "new": b_new["total_tax"], "best": "old" if b_old["total_tax"] < b_new["total_tax"] else "new"},
            "combined_optimal_tax": min(a_old["total_tax"], a_new["total_tax"]) + min(b_old["total_tax"], b_new["total_tax"]),
        },
        "combined_net_worth": round(combined_net_worth),
        "ai_suggestions": ai_data,
    })


# ── Proactive Suggestions ───────────────────────────────────────────


@bp.route("/ai/mentor/suggestions", methods=["POST"])
def mentor_suggestions():
    data = _json()
    context = data.get("context", {})
    suggestions = []

    if not context.get("has_term_insurance"):
        suggestions.append({
            "type": "insurance",
            "message": "You don't have term life insurance. A Rs 1 Cr policy could cost ~Rs 800/month.",
            "action": "Check insurance gap",
            "priority": "high",
        })
    if context.get("emergency_months", 0) < 3:
        suggestions.append({
            "type": "emergency",
            "message": "Your emergency fund covers less than 3 months. Target 6 months of expenses.",
            "action": "Build emergency fund plan",
            "priority": "high",
        })
    if context.get("sec_80c_used", 0) < 150000:
        gap = 150000 - context.get("sec_80c_used", 0)
        suggestions.append({
            "type": "tax",
            "message": f"You can save up to Rs {round(gap * 0.3):,} more in taxes by maximizing Section 80C.",
            "action": "See tax-saving options",
            "priority": "medium",
        })

    return jsonify({"suggestions": suggestions})
