from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from bson import ObjectId

from app.api.deps import get_current_user
from app.database import get_database
from app.models.financial_profile import FinancialProfileCreate, FinancialProfileResponse

router = APIRouter()


@router.get("/", response_model=FinancialProfileResponse)
async def get_profile(user: dict = Depends(get_current_user)):
    db = get_database()
    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user["_id"])})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Complete onboarding first."
        )
    profile["id"] = str(profile["_id"])
    profile["user_id"] = str(profile["user_id"])
    return profile


@router.post("/onboarding", response_model=FinancialProfileResponse)
async def create_or_update_profile(
    data: FinancialProfileCreate, user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = ObjectId(user["_id"])

    profile_doc = data.model_dump()
    profile_doc["user_id"] = user_id
    profile_doc["updated_at"] = datetime.now(timezone.utc)

    existing = await db.financial_profiles.find_one({"user_id": user_id})
    if existing:
        await db.financial_profiles.update_one(
            {"user_id": user_id}, {"$set": profile_doc}
        )
        profile_doc["id"] = str(existing["_id"])
    else:
        profile_doc["created_at"] = datetime.now(timezone.utc)
        result = await db.financial_profiles.insert_one(profile_doc)
        profile_doc["id"] = str(result.inserted_id)

    profile_doc["user_id"] = str(user_id)
    return profile_doc


@router.put("/")
async def update_profile(
    data: FinancialProfileCreate, user: dict = Depends(get_current_user)
):
    db = get_database()
    user_id = ObjectId(user["_id"])
    update_data = data.model_dump()
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.financial_profiles.update_one(
        {"user_id": user_id}, {"$set": update_data}
    )
    return {"message": "Profile updated successfully"}
