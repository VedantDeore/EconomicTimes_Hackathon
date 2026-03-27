from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.database import get_database
from app.models.life_event import LifeEventCreate
from app.services.life_event_service import LifeEventService

router = APIRouter()


@router.post("/")
async def create_event(
    data: LifeEventCreate, user: dict = Depends(get_current_user)
):
    db = get_database()
    event_doc = data.model_dump()
    event_doc["user_id"] = ObjectId(user["_id"])
    event_doc["event_data"] = {
        "amount": data.amount,
        "description": data.description,
    }
    event_doc["ai_advice"] = None
    event_doc["chat_history"] = []
    event_doc["created_at"] = datetime.now(timezone.utc)
    event_doc["updated_at"] = datetime.now(timezone.utc)

    result = await db.life_events.insert_one(event_doc)
    return {"id": str(result.inserted_id), "message": "Event created"}


@router.get("/")
async def list_events(user: dict = Depends(get_current_user)):
    db = get_database()
    events = await db.life_events.find(
        {"user_id": ObjectId(user["_id"])}
    ).sort("created_at", -1).to_list(50)
    for e in events:
        e["id"] = str(e["_id"])
        e["user_id"] = str(e["user_id"])
        del e["_id"]
    return {"events": events}


@router.post("/{event_id}/advise")
async def get_ai_advice(event_id: str, user: dict = Depends(get_current_user)):
    db = get_database()
    event = await db.life_events.find_one({"_id": ObjectId(event_id)})
    if not event:
        return {"error": "Event not found"}

    profile = await db.financial_profiles.find_one({"user_id": ObjectId(user["_id"])})
    service = LifeEventService(db)
    advice = await service.generate_advice(event, profile)

    await db.life_events.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": {"ai_advice": advice, "updated_at": datetime.now(timezone.utc)}},
    )
    return advice
