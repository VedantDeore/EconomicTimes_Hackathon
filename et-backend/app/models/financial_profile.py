from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class EmploymentType(str, Enum):
    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"
    FREELANCER = "freelancer"
    BUSINESS = "business"


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"
    VERY_AGGRESSIVE = "very_aggressive"


class TaxRegime(str, Enum):
    OLD = "old"
    NEW = "new"


class IncomeDetails(BaseModel):
    gross: float = 0
    net: float = 0
    currency: str = "INR"


class MonthlyExpenses(BaseModel):
    rent: float = 0
    emi: float = 0
    groceries: float = 0
    utilities: float = 0
    entertainment: float = 0
    education: float = 0
    other: float = 0
    total: float = 0


class SalaryStructure(BaseModel):
    basic: float = 0
    hra: float = 0
    da: float = 0
    special_allowance: float = 0
    lta: float = 0
    pf_contribution: float = 0


class ExistingInvestments(BaseModel):
    ppf: float = 0
    epf: float = 0
    nps: float = 0
    elss: float = 0
    fd: float = 0
    stocks: float = 0
    mutual_funds: float = 0
    real_estate: float = 0
    gold: float = 0
    crypto: float = 0
    other: float = 0


class DebtItem(BaseModel):
    type: str
    principal: float
    outstanding: float
    interest_rate: float
    emi: float
    tenure_months: int
    remaining_months: int


class InsuranceDetail(BaseModel):
    has_cover: bool = False
    sum_assured: float = 0
    premium: float = 0
    type: Optional[str] = None
    family_floater: Optional[bool] = None


class Insurance(BaseModel):
    life: InsuranceDetail = InsuranceDetail()
    health: InsuranceDetail = InsuranceDetail()


class EmergencyFund(BaseModel):
    current_amount: float = 0
    months_covered: float = 0


class FinancialProfileCreate(BaseModel):
    employment_type: EmploymentType
    annual_income: IncomeDetails
    monthly_expenses: MonthlyExpenses
    salary_structure: Optional[SalaryStructure] = None
    existing_investments: ExistingInvestments = ExistingInvestments()
    debts: list[DebtItem] = []
    insurance: Insurance = Insurance()
    emergency_fund: EmergencyFund = EmergencyFund()
    risk_profile: RiskProfile = RiskProfile.MODERATE
    tax_regime: TaxRegime = TaxRegime.NEW


class FinancialProfileResponse(FinancialProfileCreate):
    id: str
    user_id: str
