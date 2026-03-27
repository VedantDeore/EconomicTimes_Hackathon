from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum


class EventType(str, Enum):
    BONUS = "bonus"
    INHERITANCE = "inheritance"
    MARRIAGE = "marriage"
    NEW_BABY = "new_baby"
    JOB_CHANGE = "job_change"
    HOME_PURCHASE = "home_purchase"
    RETIREMENT = "retirement"


class InvestmentRecommendation(BaseModel):
    instrument: str
    amount: float
    reason: str
    urgency: str = "within_month"


class ActionChecklistItem(BaseModel):
    item: str
    completed: bool = False
    deadline: Optional[date] = None


class LifeEventCreate(BaseModel):
    event_type: EventType
    event_date: date
    amount: Optional[float] = None
    description: Optional[str] = None


class LifeEventAdvice(BaseModel):
    summary: str
    tax_implications: str
    investment_recommendations: list[InvestmentRecommendation] = []
    action_checklist: list[ActionChecklistItem] = []


class LifeEventResponse(BaseModel):
    id: str
    user_id: str
    event_type: EventType
    event_date: date
    ai_advice: Optional[LifeEventAdvice] = None
