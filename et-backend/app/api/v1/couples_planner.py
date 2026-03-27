from fastapi import APIRouter, Depends
from bson import ObjectId
from datetime import datetime, timezone
import secrets

from app.api.deps import get_current_user
from app.database import get_database
from app.models.couples import CoupleInvite, CoupleAccept
from app.services.couples_planner_service import CouplesPlannerService

router = APIRouter()


@router.post("/invite")
async def invite_partner(
    data: CoupleInvite, user: dict = Depends(get_current_user)
):
    db = get_database()
    partner = await db.users.find_one({"email": data.partner_email})
    if not partner:
        return {"error": "Partner not found. They need to register first."}

    invite_code = secrets.token_urlsafe(16)
    couple_doc = {
        "partner_1_id": ObjectId(user["_id"]),
        "partner_2_id": partner["_id"],
        "invite_code": invite_code,
        "status": "pending",
        "optimization": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    await db.couples.insert_one(couple_doc)
    return {"invite_code": invite_code, "message": "Invite sent"}


@router.post("/accept")
async def accept_invite(
    data: CoupleAccept, user: dict = Depends(get_current_user)
):
    db = get_database()
    couple = await db.couples.find_one({"invite_code": data.invite_code})
    if not couple:
        return {"error": "Invalid invite code"}
    if str(couple["partner_2_id"]) != user["_id"]:
        return {"error": "This invite is not for you"}

    await db.couples.update_one(
        {"_id": couple["_id"]},
        {"$set": {"status": "active", "updated_at": datetime.now(timezone.utc)}},
    )
    # Link partners
    await db.users.update_one(
        {"_id": couple["partner_1_id"]},
        {"$set": {"partner_id": couple["partner_2_id"]}},
    )
    await db.users.update_one(
        {"_id": couple["partner_2_id"]},
        {"$set": {"partner_id": couple["partner_1_id"]}},
    )
    return {"message": "Partnership activated"}


@router.get("/optimize")
async def get_optimizations(user: dict = Depends(get_current_user)):
    db = get_database()
    user_oid = ObjectId(user["_id"])
    couple = await db.couples.find_one({
        "$or": [{"partner_1_id": user_oid}, {"partner_2_id": user_oid}],
        "status": "active",
    })
    if not couple:
        return {"error": "No active partnership found"}

    service = CouplesPlannerService(db)
    result = await service.optimize(couple)
    return result


@router.get("/net-worth")
async def get_combined_net_worth(user: dict = Depends(get_current_user)):
    db = get_database()
    user_oid = ObjectId(user["_id"])
    couple = await db.couples.find_one({
        "$or": [{"partner_1_id": user_oid}, {"partner_2_id": user_oid}],
        "status": "active",
    })
    if not couple or not couple.get("optimization"):
        return {"error": "No optimization data. Run optimize first."}
    return couple["optimization"].get("combined_net_worth")
