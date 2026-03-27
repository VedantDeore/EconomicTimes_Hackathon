from fastapi import APIRouter

from app.api.v1 import (
    auth,
    users,
    fire_planner,
    money_health,
    life_events,
    tax_wizard,
    couples_planner,
    mf_xray,
)

api_v1_router = APIRouter()

api_v1_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_v1_router.include_router(users.router, prefix="/profile", tags=["User Profile"])
api_v1_router.include_router(fire_planner.router, prefix="/fire", tags=["FIRE Planner"])
api_v1_router.include_router(money_health.router, prefix="/health", tags=["Money Health"])
api_v1_router.include_router(life_events.router, prefix="/events", tags=["Life Events"])
api_v1_router.include_router(tax_wizard.router, prefix="/tax", tags=["Tax Wizard"])
api_v1_router.include_router(couples_planner.router, prefix="/couples", tags=["Couples Planner"])
api_v1_router.include_router(mf_xray.router, prefix="/mf", tags=["MF X-Ray"])
