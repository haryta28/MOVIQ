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


@router.get("/me")
async def auth_me(user: Dict = Depends(get_current_user)):
    return user
