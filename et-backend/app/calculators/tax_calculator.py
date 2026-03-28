def calculate_hra_exemption(basic: float, hra_received: float, rent_paid_annual: float, is_metro: bool = True) -> dict:
    actual_hra = hra_received
    percent_of_basic = basic * (0.5 if is_metro else 0.4)
    rent_minus_10 = max(0, rent_paid_annual - basic * 0.1)
    exemption = max(0, min(actual_hra, percent_of_basic, rent_minus_10))
    return {
        "actual_hra": actual_hra,
        "percent_of_basic": percent_of_basic,
        "rent_minus_10pct": rent_minus_10,
        "exemption": exemption,
    }


def calculate_tax_old(
    gross_salary: float,
    hra_exemption: float = 0,
    standard_deduction: float = 50000,
    sec_80c: float = 0,
    sec_80d: float = 0,
    nps: float = 0,
    home_loan_interest: float = 0,
    other_deductions: float = 0,
) -> dict:
    """Calculate income tax under Old Regime (FY 2025-26) with step-by-step breakdown."""
    steps = []
    running = gross_salary
    steps.append({"label": "Gross Salary", "amount": gross_salary, "running_total": running, "type": "income"})

    running -= standard_deduction
    steps.append({"label": "Less: Standard Deduction", "amount": -standard_deduction, "running_total": running, "type": "deduction"})

    capped_hra = min(hra_exemption, gross_salary * 0.5)
    if capped_hra > 0:
        running -= capped_hra
        steps.append({"label": "Less: HRA Exemption (Sec 10)", "amount": -capped_hra, "running_total": running, "type": "deduction"})

    capped_80c = min(sec_80c, 150000)
    if capped_80c > 0:
        running -= capped_80c
        steps.append({"label": f"Less: Section 80C (₹{capped_80c:,.0f} of ₹1.5L)", "amount": -capped_80c, "running_total": running, "type": "deduction"})

    capped_80d = min(sec_80d, 100000)
    if capped_80d > 0:
        running -= capped_80d
        steps.append({"label": "Less: Section 80D (Health Insurance)", "amount": -capped_80d, "running_total": running, "type": "deduction"})

    capped_nps = min(nps, 50000)
    if capped_nps > 0:
        running -= capped_nps
        steps.append({"label": "Less: NPS 80CCD(1B)", "amount": -capped_nps, "running_total": running, "type": "deduction"})

    capped_hl = min(home_loan_interest, 200000)
    if capped_hl > 0:
        running -= capped_hl
        steps.append({"label": "Less: Home Loan Interest 24(b)", "amount": -capped_hl, "running_total": running, "type": "deduction"})

    if other_deductions > 0:
        running -= other_deductions
        steps.append({"label": "Less: Other Deductions (80E/80G/80TTA)", "amount": -other_deductions, "running_total": running, "type": "deduction"})

    taxable = max(running, 0)
    steps.append({"label": "Taxable Income (Old Regime)", "amount": taxable, "running_total": taxable, "type": "total"})

    slabs = [(0, 250000, 0, "0 – 2.5L @ Nil"), (250000, 500000, 0.05, "2.5L – 5L @ 5%"),
             (500000, 1000000, 0.20, "5L – 10L @ 20%"), (1000000, float("inf"), 0.30, "Above 10L @ 30%")]

    tax = 0
    for lo, hi, rate, label in slabs:
        if taxable <= lo:
            break
        slice_amt = min(taxable, hi) - lo
        slab_tax = round(slice_amt * rate)
        tax += slab_tax
        if rate > 0:
            steps.append({"label": f"Slab: {label}", "amount": slab_tax, "running_total": tax, "type": "slab"})

    rebate = min(tax, 12500) if taxable <= 500000 else 0
    if rebate > 0:
        tax -= rebate
        steps.append({"label": "Less: Rebate u/s 87A", "amount": -rebate, "running_total": tax, "type": "rebate"})

    cess = round(tax * 0.04)
    if cess > 0:
        steps.append({"label": "Add: Health & Education Cess (4%)", "amount": cess, "running_total": tax + cess, "type": "cess"})

    total = tax + cess
    steps.append({"label": "Total Tax (Old Regime)", "amount": total, "running_total": total, "type": "total"})

    return {
        "taxable_income": taxable,
        "tax_payable": round(tax, 2),
        "cess": round(cess, 2),
        "total_tax": round(total, 2),
        "steps": steps,
    }


def calculate_tax_new(gross_salary: float) -> dict:
    """Calculate income tax under New Regime (FY 2025-26) with step-by-step breakdown.

    Budget 2025 slabs: 0-4L Nil, 4-8L 5%, 8-12L 10%, 12-16L 15%, 16-20L 20%, 20-24L 25%, 24L+ 30%
    Standard deduction: ₹75,000. Rebate u/s 87A: up to ₹60K if taxable <= ₹12L.
    """
    steps = []
    running = gross_salary
    steps.append({"label": "Gross Salary", "amount": gross_salary, "running_total": running, "type": "income"})

    std_ded = 75000
    running -= std_ded
    steps.append({"label": "Less: Standard Deduction (₹75,000)", "amount": -std_ded, "running_total": running, "type": "deduction"})

    steps.append({"label": "No Chapter VI-A deductions in New Regime", "amount": 0, "running_total": running, "type": "deduction"})

    taxable = max(running, 0)
    steps.append({"label": "Taxable Income (New Regime)", "amount": taxable, "running_total": taxable, "type": "total"})

    slabs = [
        (0, 400000, 0.00, "0 – 4L @ Nil"),
        (400000, 800000, 0.05, "4L – 8L @ 5%"),
        (800000, 1200000, 0.10, "8L – 12L @ 10%"),
        (1200000, 1600000, 0.15, "12L – 16L @ 15%"),
        (1600000, 2000000, 0.20, "16L – 20L @ 20%"),
        (2000000, 2400000, 0.25, "20L – 24L @ 25%"),
        (2400000, float("inf"), 0.30, "Above 24L @ 30%"),
    ]

    tax = 0
    for lo, hi, rate, label in slabs:
        if taxable <= lo:
            break
        slice_amt = min(taxable, hi) - lo
        slab_tax = round(slice_amt * rate)
        tax += slab_tax
        if rate > 0:
            steps.append({"label": f"Slab: {label}", "amount": slab_tax, "running_total": tax, "type": "slab"})

    rebate = min(tax, 60000) if taxable <= 1200000 else 0
    if rebate > 0:
        tax -= rebate
        steps.append({"label": "Less: Rebate u/s 87A (New Regime)", "amount": -rebate, "running_total": tax, "type": "rebate"})

    cess = round(tax * 0.04)
    if cess > 0:
        steps.append({"label": "Add: Health & Education Cess (4%)", "amount": cess, "running_total": tax + cess, "type": "cess"})

    total = tax + cess
    steps.append({"label": "Total Tax (New Regime)", "amount": total, "running_total": total, "type": "total"})

    return {
        "taxable_income": taxable,
        "tax_payable": round(tax, 2),
        "cess": round(cess, 2),
        "total_tax": round(total, 2),
        "steps": steps,
    }
