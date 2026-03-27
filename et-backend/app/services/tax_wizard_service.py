import json
from datetime import datetime, timezone
from bson import ObjectId

from app.engines.ai_client import ai_client
from app.engines.prompts.tax_prompts import TAX_SYSTEM_PROMPT, TAX_ANALYSIS_PROMPT
from app.engines.calculators.tax_calculator import calculate_tax_old, calculate_tax_new


class TaxWizardService:
    def __init__(self, db):
        self.db = db

    async def parse_form16(self, file):
        """Parse uploaded Form 16 PDF."""
        from app.engines.parsers.form16_parser import parse_form16_pdf
        content = await file.read()
        return await parse_form16_pdf(content)

    async def analyze(self, data, profile, user_id: str):
        income = data.income_details
        deductions = data.deductions

        # Calculate using rule engine
        old_tax = calculate_tax_old(
            gross_salary=income.gross_salary,
            hra_exemption=deductions.hra_exemption,
            standard_deduction=income.standard_deduction,
            sec_80c=deductions.section_80c.total,
            sec_80d=deductions.section_80d.total,
            nps=deductions.nps_80ccd_1b,
            home_loan_interest=deductions.home_loan_interest_24b,
            other_deductions=(
                deductions.education_loan_80e +
                deductions.donations_80g +
                deductions.savings_interest_80tta
            ),
        )
        new_tax = calculate_tax_new(gross_salary=income.gross_salary)

        regime_comparison = {
            "old_regime": old_tax,
            "new_regime": new_tax,
            "recommended_regime": "old" if old_tax["total_tax"] < new_tax["total_tax"] else "new",
            "savings": abs(old_tax["total_tax"] - new_tax["total_tax"]),
        }

        # AI for missed deductions & suggestions
        risk_profile = profile.get("risk_profile", "moderate") if profile else "moderate"
        prompt = TAX_ANALYSIS_PROMPT.format(
            financial_year=data.financial_year,
            gross_salary=income.gross_salary,
            hra_received=income.hra_received,
            other_income=income.income_from_other_sources,
            sec_80c=deductions.section_80c.total,
            sec_80d=deductions.section_80d.total,
            nps=deductions.nps_80ccd_1b,
            home_loan_interest=deductions.home_loan_interest_24b,
            hra_exemption=deductions.hra_exemption,
            risk_profile=risk_profile,
        )

        ai_response = await ai_client.generate_json(prompt, TAX_SYSTEM_PROMPT)

        try:
            ai_data = json.loads(ai_response)
            missed = ai_data.get("missed_deductions", [])
            investments = ai_data.get("tax_saving_investments", [])
            ai_summary = ai_data.get("ai_summary", "")
        except (json.JSONDecodeError, Exception):
            missed = []
            investments = []
            ai_summary = "Tax analysis complete. Review regime comparison above."

        # Save to DB
        tax_doc = {
            "user_id": ObjectId(user_id),
            "financial_year": data.financial_year,
            "form16_uploaded": False,
            "income_details": data.income_details.model_dump(),
            "deductions": data.deductions.model_dump(),
            "regime_comparison": regime_comparison,
            "missed_deductions": missed,
            "tax_saving_investments": investments,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
        }

        await self.db.tax_records.update_one(
            {"user_id": ObjectId(user_id), "financial_year": data.financial_year},
            {"$set": tax_doc},
            upsert=True,
        )

        return {
            "id": user_id,
            "financial_year": data.financial_year,
            "regime_comparison": regime_comparison,
            "missed_deductions": missed,
            "tax_saving_investments": investments,
            "ai_summary": ai_summary,
        }
