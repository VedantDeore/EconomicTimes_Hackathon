import json
from datetime import datetime, timezone
from bson import ObjectId

from app.engines.ai_client import ai_client
from app.engines.prompts.fire_prompts import FIRE_SYSTEM_PROMPT, FIRE_PLAN_PROMPT
from app.engines.calculators.sip_calculator import calculate_sip
from app.engines.calculators.asset_allocator import get_allocation_by_age


class FirePlannerService:
    def __init__(self, db):
        self.db = db

    async def generate_plan(self, data, profile, user_id: str):
        # Build goals text
        goals_text = ""
        for i, g in enumerate(data.goals, 1):
            goals_text += f"{i}. {g.name} ({g.category}): ₹{g.target_amount:,.0f} by {g.target_date}\n"

        risk_profile = profile.get("risk_profile", "moderate") if profile else "moderate"

        # Generate AI plan
        prompt = FIRE_PLAN_PROMPT.format(
            age=data.age,
            retirement_age=data.retirement_age,
            monthly_income=data.monthly_income,
            monthly_expenses=data.monthly_expenses,
            existing_corpus=data.existing_corpus,
            risk_profile=risk_profile,
            expected_return=data.expected_return_rate,
            inflation_rate=data.inflation_rate,
            goals_text=goals_text or "No specific goals provided",
        )

        ai_response = await ai_client.generate_json(prompt, FIRE_SYSTEM_PROMPT)

        # Calculate FIRE number
        annual_expenses = data.monthly_expenses * 12
        fire_number = annual_expenses * 25  # 4% rule
        years_to_fire = data.retirement_age - data.age

        # Calculate SIP needed
        monthly_sip = calculate_sip(
            target=fire_number - data.existing_corpus,
            years=years_to_fire,
            annual_return=data.expected_return_rate,
        )

        # Get age-based allocation
        allocation = get_allocation_by_age(data.age, risk_profile)

        # Save goals to DB
        goal_responses = []
        for goal in data.goals:
            goal_sip = calculate_sip(
                target=goal.target_amount - goal.current_savings,
                years=(goal.target_date.year - datetime.now().year),
                annual_return=data.expected_return_rate,
            )
            goal_doc = goal.model_dump()
            goal_doc["user_id"] = ObjectId(user_id)
            goal_doc["sip_required"] = goal_sip
            goal_doc["recommended_asset_allocation"] = allocation
            goal_doc["status"] = "active"
            goal_doc["monthly_roadmap"] = []
            goal_doc["created_at"] = datetime.now(timezone.utc)
            goal_doc["updated_at"] = datetime.now(timezone.utc)
            result = await self.db.goals.insert_one(goal_doc)
            goal_doc["id"] = str(result.inserted_id)
            goal_doc["user_id"] = user_id
            goal_responses.append(goal_doc)

        # Parse AI summary
        try:
            ai_data = json.loads(ai_response)
            ai_summary = ai_data.get("ai_summary", "Plan generated successfully.")
            insurance_gaps = ai_data.get("insurance_gaps", [])
            tax_moves = ai_data.get("tax_saving_moves", [])
        except (json.JSONDecodeError, Exception):
            ai_summary = "Your FIRE plan has been generated. Review your goals and SIP amounts below."
            insurance_gaps = []
            tax_moves = []

        return {
            "fire_number": fire_number,
            "years_to_fire": years_to_fire,
            "monthly_sip_needed": monthly_sip,
            "goals": goal_responses,
            "asset_allocation": allocation,
            "insurance_gaps": insurance_gaps,
            "tax_saving_moves": tax_moves,
            "emergency_fund_target": data.monthly_expenses * 6,
            "ai_summary": ai_summary,
        }
