from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    city: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    city: Optional[str] = None
    is_verified: bool = False
    avatar_url: Optional[str] = None
