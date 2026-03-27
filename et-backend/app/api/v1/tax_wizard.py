from fastapi import APIRouter, Depends, UploadFile, File
from bson import ObjectId
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.database import get_database
from app.models.tax import TaxAnalysisRequest, TaxAnalysisResponse
from app.services.tax_wizard_service import TaxWizardService

router = APIRouter()


@router.post("/upload-form16")
async def upload_form16(
    file: UploadFile = File(...), user: dict = Depends(get_current_user)
):
    db = get_database()
    service = TaxWizardService(db)
    parsed_data = await service.parse_form16(file)
    return {"message": "Form 16 parsed successfully", "data": parsed_data}


@router.post("/analyze", response_model=TaxAnalysisResponse)
async def analyze_tax(
    data: TaxAnalysisRequest, user: dict = Depends(get_current_user)
):
    db = get_database()
    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user["_id"])})
    service = TaxWizardService(db)
    result = await service.analyze(data, profile, user["_id"])
    return result


@router.get("/regime-comparison")
async def get_regime_comparison(user: dict = Depends(get_current_user)):
    db = get_database()
    record = await db.tax_records.find_one(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
    )
    if not record:
        return {"error": "No tax analysis found"}
    return {
        "regime_comparison": record.get("regime_comparison"),
        "financial_year": record.get("financial_year"),
    }


@router.get("/deductions")
async def get_missed_deductions(user: dict = Depends(get_current_user)):
    db = get_database()
    record = await db.tax_records.find_one(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
    )
    if not record:
        return {"error": "No tax analysis found"}
    return {
        "missed_deductions": record.get("missed_deductions", []),
        "tax_saving_investments": record.get("tax_saving_investments", []),
    }
