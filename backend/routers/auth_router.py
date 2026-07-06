"""Auth endpoints — login (rate-limited) and current-user."""
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr

from core.auth import create_jwt, get_current_user, pwd_ctx
from core.db import db
from core.helpers import _clean
from core.limiter import limiter

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
@limiter.limit("5/minute")  # Block brute-force: max 5 attempts per IP per minute
async def auth_login(request: Request, body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not pwd_ctx.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.pop("password_hash", None)
    user = _clean(user)
    return {"token": create_jwt(user), "user": user}


class SetupPasswordRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/setup-password")
async def setup_password(body: SetupPasswordRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user:
        raise HTTPException(status_code=404, detail="User account not found")
        
    password_hash = pwd_ctx.hash(body.password)
    await db.users.update_one(
        {"email": body.email.lower()},
        {"$set": {"password_hash": password_hash, "status": "active"}}
    )
    
    updated_user = await db.users.find_one({"email": body.email.lower()})
    updated_user.pop("password_hash", None)
    cleaned = _clean(updated_user)
    return {"token": create_jwt(cleaned), "user": cleaned}


@router.get("/me")
async def auth_me(user: Dict = Depends(get_current_user)):
    return user
