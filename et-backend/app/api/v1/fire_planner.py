from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.database import get_database
from app.models.fire_plan import FirePlanRequest, FirePlanResponse
from app.services.fire_planner_service import FirePlannerService

router = APIRouter()


@router.post("/generate", response_model=FirePlanResponse)
async def generate_fire_plan(
    data: FirePlanRequest, user: dict = Depends(get_current_user)
):
    db = get_database()
    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user["_id"])})
    service = FirePlannerService(db)
    result = await service.generate_plan(data, profile, user["_id"])
    return result


@router.get("/roadmap")
async def get_roadmap(user: dict = Depends(get_current_user)):
    db = get_database()
    goals = await db.goals.find(
        {"user_id": ObjectId(user["_id"]), "status": "active"}
    ).to_list(100)
    for g in goals:
        g["id"] = str(g["_id"])
        g["user_id"] = str(g["user_id"])
        del g["_id"]
    return {"goals": goals}


@router.put("/goals/{goal_id}")
async def update_goal(
    goal_id: str, updates: dict, user: dict = Depends(get_current_user)
):
    db = get_database()
    updates["updated_at"] = datetime.now(timezone.utc)
    await db.goals.update_one(
        {"_id": ObjectId(goal_id), "user_id": ObjectId(user["_id"])},
        {"$set": updates},
    )
    return {"message": "Goal updated"}
