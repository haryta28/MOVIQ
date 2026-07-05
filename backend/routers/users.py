"""User list endpoints — filtered by role query param."""
from typing import Dict, Optional

from fastapi import APIRouter, Depends

from core.auth import get_current_user , require_admin
from core.db import db
from core.helpers import _clean_many

router = APIRouter(prefix="/users", tags=["users"])


@router.get("")
async def list_users(role: Optional[str] = None, _: Dict = Depends(require_admin)):
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
    # Default — all platform users (password_hash excluded)
    return _clean_many(
        await db.users.find({}, {"password_hash": 0}).to_list(1000)
    )
