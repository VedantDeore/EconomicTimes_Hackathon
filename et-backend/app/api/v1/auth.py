from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime, timedelta, timezone
from jose import jwt
import bcrypt
from bson import ObjectId

from app.config import get_settings
from app.database import get_database
from app.models.user import UserRegister, UserLogin, TokenResponse
from app.api.deps import get_current_user

router = APIRouter()
settings = get_settings()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": user_id, "exp": expire, "type": "refresh"},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db = get_database()

    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "email": user_data.email,
        "password_hash": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "phone": user_data.phone,
        "date_of_birth": user_data.date_of_birth,
        "gender": user_data.gender,
        "city": user_data.city,
        "avatar_url": None,
        "is_verified": False,
        "auth_provider": "local",
        "partner_id": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        token_type="bearer",
        user_id=user_id,
    )


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    db = get_database()

    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        token_type="bearer",
        user_id=user_id,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(
            refresh_token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")

        user_id = payload.get("sub")
        return TokenResponse(
            access_token=create_access_token(user_id),
            refresh_token=create_refresh_token(user_id),
            token_type="bearer",
            user_id=user_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Return the current authenticated user's basic info."""
    return {
        "id": str(user["_id"]),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "phone": user.get("phone"),
        "avatar_url": user.get("avatar_url"),
    }
