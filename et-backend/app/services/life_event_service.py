import json
from app.engines.ai_client import ai_client
from app.engines.prompts.event_prompts import EVENT_SYSTEM_PROMPT, EVENT_ADVICE_PROMPT


class LifeEventService:
    def __init__(self, db):
        self.db = db

    async def generate_advice(self, event, profile):
        investments = profile.get("existing_investments", {}) if profile else {}
        debts = profile.get("debts", []) if profile else []
        insurance = profile.get("insurance", {}) if profile else {}

        inv_summary = ", ".join(f"{k}: ₹{v:,.0f}" for k, v in investments.items() if isinstance(v, (int, float)) and v > 0)
        debt_summary = ", ".join(f"{d['type']}: ₹{d.get('outstanding', 0):,.0f}" for d in debts) if debts else "No debts"

        prompt = EVENT_ADVICE_PROMPT.format(
            event_type=event.get("event_type", ""),
            event_date=str(event.get("event_date", "")),
            amount=event.get("event_data", {}).get("amount", 0) or 0,
            description=event.get("event_data", {}).get("description", ""),
            annual_income=profile.get("annual_income", {}).get("gross", 0) if profile else 0,
            risk_profile=profile.get("risk_profile", "moderate") if profile else "moderate",
            tax_regime=profile.get("tax_regime", "new") if profile else "new",
            investments_summary=inv_summary or "None",
            debts_summary=debt_summary,
            life_cover=insurance.get("life", {}).get("sum_assured", 0),
            health_cover=insurance.get("health", {}).get("sum_assured", 0),
        )

        ai_response = await ai_client.generate_json(prompt, EVENT_SYSTEM_PROMPT)

        try:
            return json.loads(ai_response)
        except (json.JSONDecodeError, Exception):
            return {
                "summary": "Please consult with a financial advisor for personalized advice on this life event.",
                "tax_implications": "Tax implications depend on the specific event details.",
                "investment_recommendations": [],
                "action_checklist": [],
            }
