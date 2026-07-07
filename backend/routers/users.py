"""User list and CRUD endpoints — filtered by role query param and agencyId constraints."""
import uuid
from typing import Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from core.auth import get_current_user, pwd_ctx
from core.db import db
from core.helpers import _clean, _clean_many
from core.mail import send_invite_email

router = APIRouter(prefix="/users", tags=["users"])


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
            return _clean_many(await db.field_executives.find().to_list(1000))
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
            return [
                {"id": "ad1", "name": "Deepak Bansal", "email": "admin@moviq.in",    "role": "Super Admin", "status": "active"},
                {"id": "ad2", "name": "Anjali Sharma",  "email": "anjali@moviq.in",  "role": "Operations",  "status": "active"},
                {"id": "ad3", "name": "Rohan Iyer",     "email": "rohan@moviq.in",   "role": "Support",     "status": "active"},
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
        doc = {
            "id": new_id,
            "name": body.name,
            "email": body.email.lower(),
            "role": role,
            "status": "active",
            "password_hash": pwd_ctx.hash("demo1234"),
        }
        if role == "agency":
            doc["agencyId"] = body.agencyId
        await db.users.insert_one(doc)
        if body.email:
            await send_invite_email(body.name, body.email, role)
        return _clean(doc)
        
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
