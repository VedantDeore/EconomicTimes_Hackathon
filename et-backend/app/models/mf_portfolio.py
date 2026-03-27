from pydantic import BaseModel
from typing import Optional
from datetime import date


class Transaction(BaseModel):
    date: date
    type: str  # purchase | redemption | switch_in | switch_out | dividend
    units: float
    nav: float
    amount: float


class Holding(BaseModel):
    fund_name: str
    fund_house: str
    scheme_code: str = ""
    category: str = ""
    units: float
    nav: float
    current_value: float
    invested_amount: float
    returns_pct: float = 0
    xirr: float = 0
    expense_ratio: float = 0
    transactions: list[Transaction] = []


class PortfolioSummary(BaseModel):
    total_invested: float
    total_current_value: float
    total_returns: float
    overall_xirr: float
    expense_ratio_drag: float
    overlap_pct: float


class OverlapItem(BaseModel):
    stock_name: str
    funds_holding: list[str]
    total_weight_pct: float


class RebalanceSuggestion(BaseModel):
    action: str  # increase | decrease | exit | switch
    fund_name: str
    reason: str
    target_allocation_pct: Optional[float] = None


class MFUploadRequest(BaseModel):
    source: str = "manual"  # manual | cams | kfintech


class MFPortfolioResponse(BaseModel):
    id: str
    user_id: str
    source: str
    holdings: list[Holding] = []
    portfolio_summary: Optional[PortfolioSummary] = None
    overlap_analysis: list[OverlapItem] = []
    rebalancing_suggestions: list[RebalanceSuggestion] = []
    ai_summary: str = ""
