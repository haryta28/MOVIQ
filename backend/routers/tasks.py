"""Task list (paginated) and update endpoints — merges db.tasks and db.vehicle_submissions."""
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
        
    limit = min(max(limit, 1), 500)
    tasks_raw = await db.tasks.find(q).skip(skip).limit(limit).to_list(limit)
    
    # Also fetch vehicle_submissions so all WhatsApp proofs appear in Tasks
    submissions_raw = await db.vehicle_submissions.find().to_list(500)
    existing_codes = set(t.get("taskCode") for t in tasks_raw if t.get("taskCode"))
    
    for sub in submissions_raw:
        tc = sub.get("taskCode") or f"TK-2026-{sub.get('id', '')[-4:].upper()}"
        if tc not in existing_codes:
            tasks_raw.append({
                "id": tc,
                "taskCode": tc,
                "unit": sub.get("vehicle", "-"),
                "vehicle": sub.get("vehicle", "-"),
                "executive": sub.get("driverName") or sub.get("phone") or "-",
                "assignedTo": sub.get("driverName") or sub.get("phone") or "-",
                "city": sub.get("city", "Bengaluru"),
                "status": sub.get("status", "completed"),
                "submittedAt": sub.get("submittedAt", ""),
                "photos": len(sub.get("photos", [])),
                "campaignTitle": "WhatsApp Proof",
                "mediaType": "Auto Branding",
                "agencyId": user.get("agencyId") or "a1"
            })
            existing_codes.add(tc)

    # Hydrate campaign title for each task dynamically
    campaign_ids = list(set(t.get("campaignId") for t in tasks_raw if t.get("campaignId")))
    campaigns = await db.campaigns.find({"id": {"$in": campaign_ids}}).to_list(100)
    campaign_map = {c["id"]: c["title"] for c in campaigns}
    
    for t in tasks_raw:
        cid = t.get("campaignId")
        if cid and cid in campaign_map:
            t["campaignTitle"] = campaign_map[cid]
        elif not t.get("campaignTitle"):
            t["campaignTitle"] = "General Execution"
        if not t.get("mediaType"):
            t["mediaType"] = "Auto Branding"
        if not t.get("unit"):
            t["unit"] = t.get("vehicle", "-")
        if not t.get("assignedTo"):
            t["assignedTo"] = t.get("executive") or t.get("driverName") or "-"
        
    return _clean_many(tasks_raw)


@router.patch("/{tid}")
async def update_task(
    tid: str, body: TaskUpdate, user: Dict = Depends(get_current_user)
):
    task = await db.tasks.find_one({"id": tid})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if user["role"] == "agency" and task.get("agencyId") != user.get("agencyId"):
        raise HTTPException(status_code=403, detail="Not your task")
        
    update_data = {k: v for k, v in body.dict().items() if v is not None}
    if update_data:
        await db.tasks.update_one({"id": tid}, {"$set": update_data})
        
    updated = await db.tasks.find_one({"id": tid})
    return _clean(updated)
