from fastapi import APIRouter, Depends
from bson import ObjectId

from app.api.deps import get_current_user
from app.database import get_database
from app.services.money_health_service import MoneyHealthService

router = APIRouter()


@router.post("/calculate")
async def calculate_health_score(user: dict = Depends(get_current_user)):
    db = get_database()
    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user["_id"])})
    if not profile:
        return {"error": "Complete financial onboarding first"}

    service = MoneyHealthService(db)
    result = await service.calculate_score(profile, user["_id"])
    return result


@router.get("/report")
async def get_latest_report(user: dict = Depends(get_current_user)):
    db = get_database()
    report = await db.reports.find_one(
        {"user_id": ObjectId(user["_id"]), "report_type": "money_health"},
        sort=[("generated_at", -1)],
    )
    if not report:
        return {"error": "No report found. Calculate your score first."}
    report["id"] = str(report["_id"])
    report["user_id"] = str(report["user_id"])
    del report["_id"]
    return report


@router.get("/history")
async def get_score_history(user: dict = Depends(get_current_user)):
    db = get_database()
    reports = await db.reports.find(
        {"user_id": ObjectId(user["_id"]), "report_type": "money_health"},
        {"overall_score": 1, "generated_at": 1},
    ).sort("generated_at", -1).to_list(12)
    for r in reports:
        r["id"] = str(r["_id"])
        del r["_id"]
    return {"history": reports}
