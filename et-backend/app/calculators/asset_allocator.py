def get_allocation_by_age(age: int, risk_profile: str = "moderate") -> dict:
    """Get recommended asset allocation based on age and risk profile.

    Uses the rule of thumb: Equity % = 110 - Age (adjusted by risk profile).
    Ensures all allocations sum to exactly 100% with no negative values.
    """
    base_equity = max(110 - age, 20)

    risk_adjustments = {
        "conservative": -15,
        "moderate": 0,
        "aggressive": 10,
        "very_aggressive": 20,
    }

    adjustment = risk_adjustments.get(risk_profile, 0)
    equity = min(max(base_equity + adjustment, 10), 85)

    # Distribute remainder intelligently based on age
    remaining = 100 - equity
    if age < 35:
        gold = min(5, remaining)
        cash = min(5, remaining - gold)
        debt = remaining - gold - cash
    elif age < 50:
        gold = min(10, remaining)
        cash = min(5, remaining - gold)
        debt = remaining - gold - cash
    else:
        gold = min(10, remaining)
        cash = min(10, remaining - gold)
        debt = remaining - gold - cash

    return {
        "equity": round(equity, 1),
        "debt": round(max(debt, 0), 1),
        "gold": round(max(gold, 0), 1),
        "cash": round(max(cash, 0), 1),
    }
