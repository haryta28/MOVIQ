"""Agency CRUD endpoints."""
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, require_admin, pwd_ctx
from core.db import db
from core.helpers import _clean, _clean_many, create_notification
from core.mail import send_invite_email

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


class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    head: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    plan: Optional[str] = None
    status: Optional[str] = None


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
    
    # 👤 Create corresponding Agency user in db.users so they can log in immediately
    existing_user = await db.users.find_one({"email": body.email.lower()})
    if not existing_user:
        agency_user = {
            "id": f"u{uuid.uuid4().hex[:8]}",
            "name": body.head or body.name,
            "email": body.email.lower(),
            "role": "agency",
            "agencyId": new["id"],
            "agencyName": new["name"],
            "status": "active",
            "password_hash": pwd_ctx.hash("demo1234"),
        }
        await db.users.insert_one(agency_user)
        await send_invite_email(agency_user["name"], agency_user["email"], "agency")
        
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


@router.patch("/{aid}")
async def update_agency(aid: str, body: AgencyUpdate, _: Dict = Depends(require_admin)):
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")
    
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    if update_data:
        await db.agencies.update_one({"id": aid}, {"$set": update_data})
        
    updated = await db.agencies.find_one({"id": aid})
    return _clean(updated)


@router.delete("/{aid}")
async def delete_agency(aid: str, _: Dict = Depends(require_admin)):
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")
    await db.agencies.delete_one({"id": aid})
    return {"status": "ok", "message": f"Agency {aid} deleted"}
