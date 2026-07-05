"""Notification list endpoint — newest first with relative timestamps."""
from typing import Dict

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean_many, _relative_time

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(_: Dict = Depends(get_current_user)):
    docs = await db.notifications.find().sort("createdAt", -1).to_list(50)
    out  = _clean_many(docs)
    for n in out:
        if n.get("createdAt"):
            n["time"] = _relative_time(n["createdAt"])
    return out
