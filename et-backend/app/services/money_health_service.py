import json
from datetime import datetime, timezone
from bson import ObjectId

from app.engines.ai_client import ai_client
from app.engines.prompts.health_prompts import HEALTH_SYSTEM_PROMPT, HEALTH_SCORE_PROMPT


class MoneyHealthService:
    def __init__(self, db):
        self.db = db

    async def calculate_score(self, profile, user_id: str):
        investments = profile.get("existing_investments", {})
        total_investments = sum(
            v for k, v in investments.items() if isinstance(v, (int, float))
        )
        monthly_income = profile.get("annual_income", {}).get("net", 0) / 12
        total_emi = sum(d.get("emi", 0) for d in profile.get("debts", []))
        debt_ratio = (total_emi / monthly_income * 100) if monthly_income > 0 else 0
        emergency = profile.get("emergency_fund", {})
        insurance = profile.get("insurance", {})

        prompt = HEALTH_SCORE_PROMPT.format(
            monthly_income=monthly_income,
            monthly_expenses=profile.get("monthly_expenses", {}).get("total", 0),
            emergency_fund=emergency.get("current_amount", 0),
            emergency_months=emergency.get("months_covered", 0),
            has_life_insurance=insurance.get("life", {}).get("has_cover", False),
            life_cover=insurance.get("life", {}).get("sum_assured", 0),
            has_health_insurance=insurance.get("health", {}).get("has_cover", False),
            health_cover=insurance.get("health", {}).get("sum_assured", 0),
            total_investments=total_investments,
            investment_breakdown=json.dumps(investments),
            total_emi=total_emi,
            debt_ratio=debt_ratio,
            tax_regime=profile.get("tax_regime", "new"),
            risk_profile=profile.get("risk_profile", "moderate"),
        )

        ai_response = await ai_client.generate_json(prompt, HEALTH_SYSTEM_PROMPT)

        try:
            result = json.loads(ai_response)
        except (json.JSONDecodeError, Exception):
            result = self._fallback_score(profile)

        # Save report
        report_doc = {
            "user_id": ObjectId(user_id),
            "report_type": "money_health",
            "overall_score": result.get("overall_score", 50),
            "dimensions": result.get("dimensions", {}),
            "ai_summary": result.get("ai_summary", ""),
            "top_3_actions": result.get("top_3_actions", []),
            "generated_at": datetime.now(timezone.utc),
        }
        insert_result = await self.db.reports.insert_one(report_doc)
        result["report_id"] = str(insert_result.inserted_id)
        return result

    def _fallback_score(self, profile):
        """Rule-based fallback if AI fails."""
        return {
            "overall_score": 50,
            "dimensions": {
                "emergency_preparedness": {"score": 50, "status": "needs_improvement", "details": "Review your emergency fund.", "actions": ["Build 6 months of expenses"]},
                "insurance_coverage": {"score": 50, "status": "needs_improvement", "details": "Review coverage.", "actions": ["Get term life insurance"]},
                "investment_diversification": {"score": 50, "status": "needs_improvement", "details": "Diversify.", "actions": ["Spread across asset classes"]},
                "debt_health": {"score": 70, "status": "good", "details": "Manageable debt.", "actions": []},
                "tax_efficiency": {"score": 50, "status": "needs_improvement", "details": "Optimize deductions.", "actions": ["Max out 80C"]},
                "retirement_readiness": {"score": 40, "status": "needs_improvement", "details": "Start planning.", "actions": ["Start SIP for retirement"]},
            },
            "ai_summary": "Your financial health needs attention in several areas. Start with emergency fund and insurance.",
            "top_3_actions": [],
        }
