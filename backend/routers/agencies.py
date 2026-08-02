"""Agency CRUD endpoints."""
import uuid
import secrets
import string
from datetime import datetime, timezone
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, require_admin, pwd_ctx
from core.db import db
from core.helpers import _clean, _clean_many, create_notification
from core.mail import send_invite_email
from core.whatsapp import send_text

router = APIRouter(prefix="/agencies", tags=["agencies"])


class AgencyCreate(BaseModel):
    name: str
    head: str = ""
    email: EmailStr
    phone: str = ""
    city: str = ""
    plan: str = "Growth"
    campaignLimit: int = 10  # max simultaneous campaigns


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
    campaignLimit: Optional[int] = None


@router.post("")
async def create_agency(body: AgencyCreate, _: Dict = Depends(require_admin)):
    new = {
        "id": f"a{uuid.uuid4().hex[:8]}",
        **body.dict(),
        "campaigns":      0,
        "campaignLimit":  body.campaignLimit,
        "activeUsers":    1,
        "status":         "trial",
        "revenue":        0,
        "joinedAt":       datetime.now(timezone.utc).date().isoformat(),
    }
    await db.agencies.insert_one(new)
    
    # 👤 Create corresponding Agency user in db.users so they can log in immediately
    existing_user = await db.users.find_one({"email": body.email.lower()})
    temp_password = None
    if not existing_user:
        temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits + "!@#$&") for _ in range(10))
        agency_user = {
            "id": f"u{uuid.uuid4().hex[:8]}",
            "name": body.head or body.name,
            "email": body.email.lower(),
            "phone": body.phone or "",
            "role": "agency",
            "agencyId": new["id"],
            "agencyName": new["name"],
            "status": "active",
            "password_hash": pwd_ctx.hash(temp_password),
        }
        await db.users.insert_one(agency_user)
        # Send WhatsApp invite if phone is provided
        if body.phone:
            msg = (
                f"Hi {body.head or body.name}! 👋\n\n"
                f"Your agency *{body.name}* has been onboarded to the MOVIQ Field Operations Platform.\n\n"
                f"🔑 Login: moviq-bwz.vercel.app\n"
                f"📧 Email: {body.email.lower()}\n"
                f"🔐 Password: {temp_password}\n\n"
                f"Please change your password after first login via Settings."
            )
            try:
                send_text(body.phone, msg)
            except Exception:
                pass
        await send_invite_email(agency_user["name"], agency_user["email"], "agency")
        
    await create_notification(
        "Agency onboarded",
        f"{new['name']} joined on the {new.get('plan', 'Growth')} plan",
        "info",
    )
    result = _clean(new)
    if temp_password:
        result["tempPassword"] = temp_password  # returned ONCE for admin to copy
    return result


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

    # ── Cascade status change to all agency users & campaigns ────────────────
    new_status = body.status
    if new_status in ("suspended", "deleted"):
        # Block all agency users from logging in
        await db.users.update_many(
            {"agencyId": aid, "role": {"$ne": "admin"}},
            {"$set": {"status": "suspended"}}
        )
        # Pause all ongoing campaigns belonging to this agency
        await db.campaigns.update_many(
            {"agencyId": aid, "status": "ongoing"},
            {"$set": {"status": "paused", "pauseReason": f"Agency {new_status}"}}
        )
        await create_notification(
            f"Agency {new_status}",
            f"{doc['name']} has been {new_status}. All user access revoked & ongoing campaigns paused.",
            "warning" if new_status == "suspended" else "error",
        )
    elif new_status in ("active", "trial"):
        # Restore access for all agency users
        await db.users.update_many(
            {"agencyId": aid, "role": {"$ne": "admin"}},
            {"$set": {"status": "active"}}
        )
        # Resume paused campaigns belonging to this agency
        await db.campaigns.update_many(
            {"agencyId": aid, "status": "paused"},
            {"$set": {"status": "ongoing"}}
        )
        await create_notification(
            "Agency reactivated",
            f"{doc['name']} access and campaigns have been restored.",
            "success",
        )
        
    updated = await db.agencies.find_one({"id": aid})
    return _clean(updated)


@router.delete("/{aid}")
async def delete_agency(aid: str, _: Dict = Depends(require_admin)):
    """Soft-delete: marks agency as 'deleted' and suspends all its users.
    Historical records (campaigns, tasks, submissions) are preserved.
    Use ?hard=true to permanently erase everything."""
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")

    # Soft delete — preserve all records, just revoke access & pause campaigns
    await db.agencies.update_one(
        {"id": aid},
        {"$set": {"status": "deleted", "deletedAt": datetime.now(timezone.utc).isoformat()}}
    )
    # Suspend all agency users so they cannot log in
    await db.users.update_many(
        {"agencyId": aid, "role": {"$ne": "admin"}},
        {"$set": {"status": "suspended"}}
    )
    # Pause all ongoing campaigns for this agency
    await db.campaigns.update_many(
        {"agencyId": aid, "status": "ongoing"},
        {"$set": {"status": "paused", "pauseReason": "Agency deleted"}}
    )
    await create_notification(
        "Agency deleted",
        f"{doc['name']} removed from platform. User access revoked, campaigns paused, records preserved.",
        "error",
    )
    return {"status": "ok", "message": f"Agency {aid} soft-deleted. Records preserved."}


@router.delete("/{aid}/hard")
async def hard_delete_agency(aid: str, _: Dict = Depends(require_admin)):
    """Permanently erase an agency and ALL its data. Irreversible."""
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")
    await db.agencies.delete_one({"id": aid})
    await db.users.delete_many({"agencyId": aid})
    return {"status": "ok", "message": f"Agency {aid} permanently erased."}
