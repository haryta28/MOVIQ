"""Agency CRUD endpoints."""
import uuid
from datetime import datetime, timezone
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, require_admin
from core.db import db
from core.helpers import _clean, _clean_many, create_notification

router = APIRouter(prefix="/agencies", tags=["agencies"])


class AgencyCreate(BaseModel):
    name: str
    head: str = ""
    email: EmailStr
    phone: str = ""
    city: str = ""
    plan: str = "Growth"


@router.get("")
async def list_agencies(user: Dict = Depends(get_current_user)):
    """Admin: all agencies. Agency user: only their own agency."""
    if user["role"] == "admin":
        return _clean_many(await db.agencies.find().to_list(1000))
    doc = await db.agencies.find_one({"id": user.get("agencyId")})
    return [_clean(doc)] if doc else []


@router.post("")
async def create_agency(body: AgencyCreate, _: Dict = Depends(require_admin)):
    new = {
        "id": f"a{uuid.uuid4().hex[:8]}",
        **body.dict(),
        "campaigns":   0,
        "activeUsers": 1,
        "status":      "trial",
        "revenue":     0,
        "joinedAt":    datetime.now(timezone.utc).date().isoformat(),
    }
    await db.agencies.insert_one(new)
    await create_notification(
        "Agency onboarded",
        f"{new['name']} joined on the {new.get('plan', 'Growth')} plan",
        "info",
    )
    return _clean(new)


@router.get("/{aid}")
async def get_agency(aid: str, _: Dict = Depends(get_current_user)):
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")
    return _clean(doc)
