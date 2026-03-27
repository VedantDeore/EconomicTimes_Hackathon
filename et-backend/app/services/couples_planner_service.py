import json
from datetime import datetime, timezone
from bson import ObjectId

from app.engines.ai_client import ai_client


class CouplesPlannerService:
    def __init__(self, db):
        self.db = db

    async def optimize(self, couple):
        p1_profile = await self.db.financial_profiles.find_one({"user_id": couple["partner_1_id"]})
        p2_profile = await self.db.financial_profiles.find_one({"user_id": couple["partner_2_id"]})

        if not p1_profile or not p2_profile:
            return {"error": "Both partners need to complete financial onboarding"}

        # HRA optimization
        hra_split = self._optimize_hra(p1_profile, p2_profile)

        # NPS matching
        nps_matching = self._optimize_nps(p1_profile, p2_profile)

        # Combined net worth
        combined = self._calculate_combined_net_worth(p1_profile, p2_profile)

        optimization = {
            "hra_split": hra_split,
            "nps_matching": nps_matching,
            "sip_splits": [],
            "insurance_plan": {"joint_vs_individual": "individual", "recommendations": ["Both should have separate term plans"]},
            "combined_net_worth": combined,
        }

        # Update couple document
        await self.db.couples.update_one(
            {"_id": couple["_id"]},
            {"$set": {"optimization": optimization, "updated_at": datetime.now(timezone.utc)}},
        )

        p1_name = (await self.db.users.find_one({"_id": couple["partner_1_id"]})).get("full_name", "Partner 1")
        p2_name = (await self.db.users.find_one({"_id": couple["partner_2_id"]})).get("full_name", "Partner 2")

        return {
            "id": str(couple["_id"]),
            "partner_1_name": p1_name,
            "partner_2_name": p2_name,
            "status": "active",
            "optimization": optimization,
        }

    def _optimize_hra(self, p1, p2):
        p1_hra = p1.get("salary_structure", {}).get("hra", 0)
        p2_hra = p2.get("salary_structure", {}).get("hra", 0)
        p1_rent = p1.get("monthly_expenses", {}).get("rent", 0)
        p2_rent = p2.get("monthly_expenses", {}).get("rent", 0)

        # Partner with higher HRA component should claim
        if p1_hra >= p2_hra:
            return {"recommended_claimer": "partner_1", "savings": min(p1_hra, p1_rent + p2_rent) * 12 * 0.3, "reason": "Partner 1 has higher HRA component"}
        return {"recommended_claimer": "partner_2", "savings": min(p2_hra, p1_rent + p2_rent) * 12 * 0.3, "reason": "Partner 2 has higher HRA component"}

    def _optimize_nps(self, p1, p2):
        return {
            "partner_1_contribution": 50000,
            "partner_2_contribution": 50000,
            "total_tax_benefit": 100000 * 0.3,
        }

    def _calculate_combined_net_worth(self, p1, p2):
        def sum_investments(profile):
            inv = profile.get("existing_investments", {})
            return sum(v for v in inv.values() if isinstance(v, (int, float)))

        p1_total = sum_investments(p1)
        p2_total = sum_investments(p2)

        return {
            "total": p1_total + p2_total,
            "partner_1_share": p1_total,
            "partner_2_share": p2_total,
            "breakdown": {
                "equity": p1.get("existing_investments", {}).get("stocks", 0) + p1.get("existing_investments", {}).get("mutual_funds", 0) + p2.get("existing_investments", {}).get("stocks", 0) + p2.get("existing_investments", {}).get("mutual_funds", 0),
                "debt": p1.get("existing_investments", {}).get("fd", 0) + p1.get("existing_investments", {}).get("ppf", 0) + p2.get("existing_investments", {}).get("fd", 0) + p2.get("existing_investments", {}).get("ppf", 0),
                "real_estate": p1.get("existing_investments", {}).get("real_estate", 0) + p2.get("existing_investments", {}).get("real_estate", 0),
                "gold": p1.get("existing_investments", {}).get("gold", 0) + p2.get("existing_investments", {}).get("gold", 0),
                "cash": 0,
                "other": p1.get("existing_investments", {}).get("other", 0) + p2.get("existing_investments", {}).get("other", 0),
            },
        }
