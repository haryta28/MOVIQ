"""Task list (paginated) and update endpoints."""
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean, _clean_many

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    flagReason: Optional[str] = None


@router.get("")
async def list_tasks(
    agency_id:  Optional[str] = None,
    status_:    Optional[str] = None,
    city:       Optional[str] = None,
    limit:      int = 200,
    skip:       int = 0,
    user: Dict = Depends(get_current_user),
):
    q: Dict[str, Any] = {}
    if agency_id:
        q["agencyId"] = agency_id
    elif user["role"] == "agency":
        q["agencyId"] = user.get("agencyId")
    if status_:
        q["status"] = status_
    if city:
        q["city"] = city
    limit = min(max(limit, 1), 500)   # Clamp: 1 ≤ limit ≤ 500
    return _clean_many(
        await db.tasks.find(q).skip(skip).limit(limit).to_list(limit)
    )


@router.patch("/{tid}")
async def update_task(
    tid: str, body: TaskUpdate, user: Dict = Depends(get_current_user)
):
    task = await db.tasks.find_one({"id": tid})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user["role"] == "agency" and task.get("agencyId") != user.get("agencyId"):
        raise HTTPException(status_code=403, detail="Not your task")

    update: Dict[str, Any] = {}
    if body.status is not None:
        update["status"] = body.status
        if body.status == "flagged" and body.flagReason:
            update["flagReason"] = body.flagReason
        elif body.status != "flagged":
            update["flagReason"] = None
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")

    await db.tasks.update_one({"id": tid}, {"$set": update})
    return _clean(await db.tasks.find_one({"id": tid}))
