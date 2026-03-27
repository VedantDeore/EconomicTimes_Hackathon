from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from enum import Enum


class GoalCategory(str, Enum):
    RETIREMENT = "retirement"
    HOME = "home"
    EDUCATION = "education"
    WEDDING = "wedding"
    CAR = "car"
    TRAVEL = "travel"
    EMERGENCY = "emergency"
    CUSTOM = "custom"


class Priority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class AssetAllocation(BaseModel):
    equity: float = 0
    debt: float = 0
    gold: float = 0
    cash: float = 0


class MonthlyMilestone(BaseModel):
    month: str
    sip_amount: float
    cumulative: float
    projected_value: float


class GoalCreate(BaseModel):
    name: str
    category: GoalCategory
    target_amount: float
    current_savings: float = 0
    target_date: date
    priority: Priority = Priority.MEDIUM
    inflation_adjusted: bool = True
    inflation_rate: float = 6.0


class GoalResponse(GoalCreate):
    id: str
    user_id: str
    sip_required: float
    recommended_asset_allocation: AssetAllocation
    status: str = "active"
    monthly_roadmap: list[MonthlyMilestone] = []


class FirePlanRequest(BaseModel):
    age: int
    retirement_age: int = 55
    monthly_income: float
    monthly_expenses: float
    existing_corpus: float = 0
    expected_return_rate: float = 12.0
    inflation_rate: float = 6.0
    goals: list[GoalCreate] = []


class FirePlanResponse(BaseModel):
    fire_number: float
    years_to_fire: int
    monthly_sip_needed: float
    goals: list[GoalResponse]
    asset_allocation: AssetAllocation
    insurance_gaps: list[dict]
    tax_saving_moves: list[dict]
    emergency_fund_target: float
    ai_summary: str
