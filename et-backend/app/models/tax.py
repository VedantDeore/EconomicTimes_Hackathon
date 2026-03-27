from pydantic import BaseModel
from typing import Optional


class Section80C(BaseModel):
    epf: float = 0
    ppf: float = 0
    elss: float = 0
    life_insurance: float = 0
    children_tuition: float = 0
    home_loan_principal: float = 0
    nsc: float = 0
    total: float = 0
    limit: float = 150000


class Section80D(BaseModel):
    self_premium: float = 0
    parents_premium: float = 0
    preventive_health: float = 0
    total: float = 0


class CapitalGains(BaseModel):
    short_term: float = 0
    long_term: float = 0


class IncomeBreakdown(BaseModel):
    gross_salary: float = 0
    hra_received: float = 0
    lta_received: float = 0
    standard_deduction: float = 50000
    professional_tax: float = 0
    income_from_other_sources: float = 0
    rental_income: float = 0
    capital_gains: CapitalGains = CapitalGains()


class Deductions(BaseModel):
    section_80c: Section80C = Section80C()
    section_80d: Section80D = Section80D()
    nps_80ccd_1b: float = 0
    home_loan_interest_24b: float = 0
    education_loan_80e: float = 0
    donations_80g: float = 0
    savings_interest_80tta: float = 0
    hra_exemption: float = 0


class RegimeResult(BaseModel):
    taxable_income: float
    tax_payable: float
    cess: float
    total_tax: float


class RegimeComparison(BaseModel):
    old_regime: RegimeResult
    new_regime: RegimeResult
    recommended_regime: str
    savings: float


class MissedDeduction(BaseModel):
    section: str
    description: str
    potential_saving: float
    investment_suggestion: str


class TaxSavingInvestment(BaseModel):
    instrument: str
    section: str
    amount: float
    risk_level: str
    lock_in_years: int
    liquidity: str
    expected_returns: str


class TaxAnalysisRequest(BaseModel):
    financial_year: str = "2025-26"
    income_details: IncomeBreakdown
    deductions: Deductions


class TaxAnalysisResponse(BaseModel):
    id: str
    financial_year: str
    regime_comparison: RegimeComparison
    missed_deductions: list[MissedDeduction] = []
    tax_saving_investments: list[TaxSavingInvestment] = []
    ai_summary: str = ""
