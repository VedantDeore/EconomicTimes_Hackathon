from pydantic import BaseModel
from typing import Optional


class DimensionScore(BaseModel):
    score: float = 0
    status: str = "needs_improvement"
    details: str = ""
    actions: list[str] = []


class HealthDimensions(BaseModel):
    emergency_preparedness: DimensionScore = DimensionScore()
    insurance_coverage: DimensionScore = DimensionScore()
    investment_diversification: DimensionScore = DimensionScore()
    debt_health: DimensionScore = DimensionScore()
    tax_efficiency: DimensionScore = DimensionScore()
    retirement_readiness: DimensionScore = DimensionScore()


class ActionItem(BaseModel):
    priority: int
    action: str
    impact: str = "medium"
    category: str = ""


class MoneyHealthResponse(BaseModel):
    overall_score: float
    dimensions: HealthDimensions
    ai_summary: str
    top_3_actions: list[ActionItem] = []
    report_id: str = ""
