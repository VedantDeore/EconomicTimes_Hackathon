from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection
from app.api.v1.router import api_v1_router
from app.api.websocket.chat import ws_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-Powered Personal Finance Mentor API for India",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(api_v1_router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
