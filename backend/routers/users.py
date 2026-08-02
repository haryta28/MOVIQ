"""User list and CRUD endpoints — filtered by role query param and agencyId constraints."""
import uuid
import secrets
import string
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, pwd_ctx
from core.db import db
from core.helpers import _clean, _clean_many
from core.mail import send_invite_email
from core.whatsapp import send_text, send_user_invite_whatsapp

router = APIRouter(prefix="/users", tags=["users"])


def _generate_temp_password(length: int = 10) -> str:
    """Generate a secure random password with letters, digits, and a symbol."""
    alphabet = string.ascii_letters + string.digits + "!@#$&"
    while True:
        pwd = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Ensure at least one uppercase, one digit, one symbol
        if (any(c.isupper() for c in pwd)
                and any(c.isdigit() for c in pwd)
                and any(c in '!@#$&' for c in pwd)):
            return pwd


class UserCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str  # "field", "supervisor", "admin", "agency"
    city: str = ""
    supervisor: Optional[str] = None
    agencyId: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    supervisor: Optional[str] = None
    status: Optional[str] = None
    agencyId: Optional[str] = None


@router.get("")
async def list_users(role: Optional[str] = None, user: Dict = Depends(get_current_user)):
    # 1. Admin user: global access
    if user["role"] == "admin":
        if role == "field":
            execs = await db.field_executives.find().to_list(1000)
            field_users = await db.users.find({"role": "field"}).to_list(1000)
            all_field = {}
            for e in execs:
                all_field[e.get("phone") or e.get("id")] = e
            for u in field_users:
                key = u.get("phone") or u.get("id")
                if key not in all_field:
                    all_field[key] = u

            res = []
            for e in all_field.values():
                phone = e.get("phone", "")
                name = e.get("name", "")
                sub_count = 0
                if phone:
                    sub_count += await db.vehicle_submissions.count_documents({"$or": [{"phone": phone}, {"driverPhone": phone}]})
                if sub_count == 0 and name:
                    sub_count = await db.vehicle_submissions.count_documents({"driverName": name})
                
                cleaned = _clean(e)
                cleaned["tasksDone"] = max(e.get("tasksDone", 0), sub_count)
                cleaned["avgQuality"] = e.get("avgQuality") if (e.get("avgQuality") is not None and str(e.get("avgQuality")) != "undefined") else 100
                res.append(cleaned)
            return res
        if role == "supervisor":
            return _clean_many(await db.supervisors.find().to_list(1000))
        if role == "agency":
            agencies = await db.agencies.find().to_list(1000)
            return [
                {"id": a["id"], "name": a["head"], "email": a["email"],
                 "agency": a["name"], "status": a["status"]}
                for a in agencies
            ]
        if role == "admin":
            admins = await db.users.find({"role": "admin"}).to_list(100)
            return [
                {
                    "id": a["id"],
                    "name": a["name"],
                    "email": a["email"],
                    "role": a.get("subRole", "Super Admin"),
                    "status": a.get("status", "active")
                }
                for a in admins
            ]
        # Default - all users (excluding password hashes)
        return _clean_many(await db.users.find({}, {"password_hash": 0}).to_list(1000))

    # 2. Agency user: restricted access to their own agency's team members
    if user["role"] == "agency":
        agency_id = user.get("agencyId")
        if not agency_id:
            raise HTTPException(status_code=403, detail="Agency ID missing from session")

        if role == "field":
            return _clean_many(await db.field_executives.find({"agencyId": agency_id}).to_list(1000))
        if role == "supervisor":
            return _clean_many(await db.supervisors.find({"agencyId": agency_id}).to_list(1000))
        
        # Agencies cannot access other roles (admin, agency, or list all)
        raise HTTPException(status_code=403, detail="Access denied for this role query")

    raise HTTPException(status_code=403, detail="Unauthorized role")


@router.post("")
async def create_user(body: UserCreate, user: Dict = Depends(get_current_user)):
    role = body.role.lower()
    
    # Permission checks
    if role in ("admin", "agency"):
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can create platform admins/agencies")
        
    if role in ("field", "supervisor"):
        # Both admin and agency can create. If agency, lock the agencyId to their own.
        if user["role"] == "agency":
            body.agencyId = user.get("agencyId")
        elif user["role"] == "admin" and not body.agencyId:
            raise HTTPException(status_code=400, detail="agencyId is required for field/supervisor when created by admin")

    new_id = f"{role[:2]}_{uuid.uuid4().hex[:6]}"
    
    if role == "field":
        doc = {
            "id": new_id,
            "name": body.name,
            "phone": body.phone or "",
            "city": body.city,
            "supervisor": body.supervisor or "",
            "agencyId": body.agencyId,
            "tasksDone": 0,
            "tasksToday": 0,
            "avgQuality": 100,
            "status": "active"
        }
        await db.field_executives.insert_one(doc)
        return _clean(doc)
        
    elif role == "supervisor":
        doc = {
            "id": new_id,
            "name": body.name,
            "email": body.email or "",
            "city": body.city,
            "agencyId": body.agencyId,
            "teamSize": 0,
            "campaigns": 0
        }
        await db.supervisors.insert_one(doc)
        if body.email:
            await send_invite_email(body.name, body.email, role)
        return _clean(doc)
        
    elif role in ("admin", "agency"):
        temp_password = _generate_temp_password()
        doc = {
            "id": new_id,
            "name": body.name,
            "email": body.email.lower(),
            "phone": body.phone or "",
            "role": role,
            "status": "active",
            "password_hash": pwd_ctx.hash(temp_password),
        }
        if role == "agency":
            doc["agencyId"] = body.agencyId
        await db.users.insert_one(doc)
        # Send WhatsApp invite if phone number is provided and WATI is configured
        if body.phone:
            try:
                send_user_invite_whatsapp(
                    to=body.phone,
                    name=body.name,
                    role=role,
                    email=body.email.lower(),
                    password=temp_password,
                )
            except Exception:
                pass  # Non-fatal: credentials are shown in the UI
        if body.email:
            await send_invite_email(body.name, body.email, role)
        cleaned = _clean(doc)
        cleaned["tempPassword"] = temp_password  # returned ONCE for admin to copy
        return cleaned
        
    raise HTTPException(status_code=400, detail="Invalid role specified")


@router.patch("/{uid}")
async def update_user(uid: str, body: UserUpdate, user: Dict = Depends(get_current_user)):
    fe_doc = await db.field_executives.find_one({"id": uid})
    sup_doc = await db.supervisors.find_one({"id": uid})
    user_doc = await db.users.find_one({"id": uid})
    
    if not fe_doc and not sup_doc and not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    
    if fe_doc:
        if user["role"] == "agency" and fe_doc["agencyId"] != user.get("agencyId"):
            raise HTTPException(status_code=403, detail="Cannot modify team members of other agencies")
        update_data.pop("role", None)
        await db.field_executives.update_one({"id": uid}, {"$set": update_data})
        updated = await db.field_executives.find_one({"id": uid})
        return _clean(updated)
        
    elif sup_doc:
        if user["role"] == "agency" and sup_doc["agencyId"] != user.get("agencyId"):
            raise HTTPException(status_code=403, detail="Cannot modify supervisors of other agencies")
        update_data.pop("role", None)
        await db.supervisors.update_one({"id": uid}, {"$set": update_data})
        updated = await db.supervisors.find_one({"id": uid})
        return _clean(updated)
        
    elif user_doc:
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can modify platform accounts")
        await db.users.update_one({"id": uid}, {"$set": update_data})
        updated = await db.users.find_one({"id": uid})
        return _clean(updated)


@router.delete("/{uid}")
async def delete_user(uid: str, user: Dict = Depends(get_current_user)):
    fe_doc = await db.field_executives.find_one({"id": uid})
    sup_doc = await db.supervisors.find_one({"id": uid})
    user_doc = await db.users.find_one({"id": uid})
    
    if not fe_doc and not sup_doc and not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
        
    if fe_doc:
        if user["role"] == "agency" and fe_doc["agencyId"] != user.get("agencyId"):
            raise HTTPException(status_code=403, detail="Cannot delete team members of other agencies")
        await db.field_executives.delete_one({"id": uid})
        return {"status": "ok", "message": f"Field executive {uid} deleted"}
        
    elif sup_doc:
        if user["role"] == "agency" and sup_doc["agencyId"] != user.get("agencyId"):
            raise HTTPException(status_code=403, detail="Cannot delete supervisors of other agencies")
        await db.supervisors.delete_one({"id": uid})
        return {"status": "ok", "message": f"Supervisor {uid} deleted"}
        
    elif user_doc:
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete platform accounts")
        await db.users.delete_one({"id": uid})
        return {"status": "ok", "message": f"Platform user {uid} deleted"}
