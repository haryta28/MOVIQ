"""Campaign CRUD + parallel detail fetch + PDF/Excel report downloads."""
import asyncio
import io
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean, _clean_many, create_notification
from reports import build_excel, build_pdf

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


class CampaignCreate(BaseModel):
    title: str
    brand: str
    brandId: Optional[str] = None
    mediaType: str
    city: str
    totalTasks: int = 0
    budget: int = 0
    startDate: str = ""
    endDate: str = ""


@router.get("")
async def list_campaigns(
    agency_id: Optional[str] = None,
    user: Dict = Depends(get_current_user),
):
    q: Dict[str, Any] = {}
    if agency_id:
        q["agencyId"] = agency_id
    elif user["role"] == "agency":
        q["agencyId"] = user.get("agencyId")
    return _clean_many(await db.campaigns.find(q).to_list(1000))


@router.get("/{cid}")
async def get_campaign(cid: str, user: Dict = Depends(get_current_user)):
    doc = await db.campaigns.find_one({"id": cid})
    if not doc:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if user["role"] == "agency" and doc.get("agencyId") != user.get("agencyId"):
        raise HTTPException(status_code=403, detail="Not your campaign")

    agency_id = doc.get("agencyId")

    # ⚡ Fetch tasks and field team in parallel (was sequential before)
    tasks_raw, field_raw = await asyncio.gather(
        db.tasks.find({"campaignId": cid}).to_list(500),
        db.field_executives.find({"agencyId": agency_id}).to_list(200),
    )

    # Fraud alerts depend on task codes — fetch after tasks are known
    task_codes = [t.get("taskCode") for t in tasks_raw]
    fraud_raw  = await db.fraud_alerts.find(
        {"taskCode": {"$in": task_codes}}
    ).to_list(200)

    activity: List[Dict[str, Any]] = []
    for t in tasks_raw[:12]:
        if t.get("submittedAt"):
            activity.append({
                "id":     t["id"],
                "kind":   "submission",
                "text":   f"{t.get('assignedTo', '')} submitted proof for {t.get('unitCode', '')}",
                "time":   t.get("submittedAt"),
                "status": t.get("status"),
            })
    for f in fraud_raw:
        activity.append({
            "id":     f["id"],
            "kind":   "fraud",
            "text":   f"Fraud alert: {f.get('type', '')} on {f.get('taskCode', '')}",
            "time":   f.get("detectedAt"),
            "status": "flagged",
        })

    tasks  = _clean_many(tasks_raw)
    status_counts = {
        s: sum(1 for t in tasks if t.get("status") == s)
        for s in ["pending", "in_progress", "submitted", "approved", "flagged"]
    }

    return {
        "campaign": _clean(doc),
        "tasks":    tasks,
        "team":     _clean_many(field_raw),
        "activity": activity,
        "stats":    {"byStatus": status_counts, "byCity": {}},
    }


@router.post("")
async def create_campaign(body: CampaignCreate, user: Dict = Depends(get_current_user)):
    if user["role"] != "agency":
        raise HTTPException(status_code=403, detail="Only agency users can create campaigns")
    new = {
        "id":       f"c{uuid.uuid4().hex[:8]}",
        **body.dict(),
        "agency":   user.get("agencyName", ""),
        "agencyId": user.get("agencyId"),
        "completed": 0,
        "flagged":   0,
        "status":    "ongoing",
        "spent":     0,
    }
    await db.campaigns.insert_one(new)
    await create_notification(
        "Campaign launched",
        f"{new['title']} for {new.get('brand', '')} is now live in {new.get('city', '')}",
        "success",
    )
    return _clean(new)


async def _campaign_with_tasks(cid: str, user: Dict[str, Any]):
    doc = await db.campaigns.find_one({"id": cid})
    if not doc:
        raise HTTPException(status_code=404, detail="Campaign not found")
    if user["role"] == "agency" and doc.get("agencyId") != user.get("agencyId"):
        raise HTTPException(status_code=403, detail="Not your campaign")
    tasks = await db.tasks.find({"campaignId": cid}).to_list(2000)
    return _clean(doc), _clean_many(tasks)


@router.get("/{cid}/report/pdf")
async def campaign_report_pdf(cid: str, user: Dict = Depends(get_current_user)):
    campaign, tasks = await _campaign_with_tasks(cid, user)
    pdf_bytes = build_pdf(campaign, tasks)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="moviq-report-{cid}.pdf"'},
    )


@router.get("/{cid}/report/excel")
async def campaign_report_excel(cid: str, user: Dict = Depends(get_current_user)):
    campaign, tasks = await _campaign_with_tasks(cid, user)
    xlsx_bytes = build_excel(campaign, tasks)
    return StreamingResponse(
        io.BytesIO(xlsx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="moviq-report-{cid}.xlsx"'},
    )
