from fastapi import APIRouter, Depends, UploadFile, File
from bson import ObjectId
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.database import get_database
from app.services.mf_xray_service import MFXRayService

router = APIRouter()


@router.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    source: str = "cams",
    user: dict = Depends(get_current_user),
):
    db = get_database()
    service = MFXRayService(db)
    result = await service.process_statement(file, source, user["_id"])
    return result


@router.get("/portfolio")
async def get_portfolio(user: dict = Depends(get_current_user)):
    db = get_database()
    portfolio = await db.investments.find_one(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
    )
    if not portfolio:
        return {"error": "No portfolio found. Upload a statement first."}
    portfolio["id"] = str(portfolio["_id"])
    portfolio["user_id"] = str(portfolio["user_id"])
    del portfolio["_id"]
    return portfolio


@router.get("/overlap")
async def get_overlap_analysis(user: dict = Depends(get_current_user)):
    db = get_database()
    portfolio = await db.investments.find_one(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
    )
    if not portfolio:
        return {"error": "No portfolio found"}
    return {
        "overlap_analysis": portfolio.get("overlap_analysis", []),
        "overlap_pct": portfolio.get("portfolio_summary", {}).get("overlap_pct", 0),
    }


@router.get("/rebalance")
async def get_rebalancing_plan(user: dict = Depends(get_current_user)):
    db = get_database()
    portfolio = await db.investments.find_one(
        {"user_id": ObjectId(user["_id"])},
        sort=[("created_at", -1)],
    )
    if not portfolio:
        return {"error": "No portfolio found"}
    return {"rebalancing_plan": portfolio.get("rebalancing_plan", {})}
