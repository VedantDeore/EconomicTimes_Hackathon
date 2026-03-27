from pydantic import BaseModel
from typing import Optional


class CoupleInvite(BaseModel):
    partner_email: str


class CoupleAccept(BaseModel):
    invite_code: str


class HRASplit(BaseModel):
    recommended_claimer: str
    savings: float
    reason: str


class NPSMatching(BaseModel):
    partner_1_contribution: float
    partner_2_contribution: float
    total_tax_benefit: float


class SIPSplit(BaseModel):
    goal_name: str
    partner_1_sip: float
    partner_2_sip: float
    reason: str


class InsurancePlan(BaseModel):
    joint_vs_individual: str
    recommendations: list[str] = []


class NetWorthBreakdown(BaseModel):
    equity: float = 0
    debt: float = 0
    real_estate: float = 0
    gold: float = 0
    cash: float = 0
    other: float = 0


class CombinedNetWorth(BaseModel):
    total: float
    partner_1_share: float
    partner_2_share: float
    breakdown: NetWorthBreakdown


class CoupleOptimization(BaseModel):
    hra_split: Optional[HRASplit] = None
    nps_matching: Optional[NPSMatching] = None
    sip_splits: list[SIPSplit] = []
    insurance_plan: Optional[InsurancePlan] = None
    combined_net_worth: Optional[CombinedNetWorth] = None


class CoupleResponse(BaseModel):
    id: str
    partner_1_name: str
    partner_2_name: str
    status: str
    optimization: Optional[CoupleOptimization] = None
