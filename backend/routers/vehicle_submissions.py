"""Vehicle submission endpoint — used by WhatsApp bot (public POST, auth GET)."""
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean, _clean_many, create_notification

router = APIRouter(prefix="/vehicle-submissions", tags=["vehicle-submissions"])

# Indian vehicle number regex: KA-01-AB-1234, MH12AB1234, DL3CAB1234 …
_VEHICLE_RE = re.compile(
    r'^[A-Z]{2}[\-\s]?\d{1,2}[\-\s]?[A-Z]{1,3}[\-\s]?\d{1,4}$',
    re.IGNORECASE,
)


class VehicleSubmissionCreate(BaseModel):
    vehicle:      str
    driver_name:  str
    driver_phone: str
    photos:       List[Dict[str, str]] = []
    gps:          Optional[Dict[str, float]] = None


@router.post("")
async def create_vehicle_submission(body: VehicleSubmissionCreate):
    """Public endpoint — no auth required. Used by the WhatsApp bot."""
    vehicle_clean = body.vehicle.strip().upper()
    if not _VEHICLE_RE.match(vehicle_clean):
        raise HTTPException(
            status_code=422,
            detail="Invalid vehicle number. Use Indian format, e.g. KA-01-AB-1234",
        )
    doc: Dict[str, Any] = {
        "id":          f"vs_{uuid.uuid4().hex[:10]}",
        "vehicle":     vehicle_clean,
        "driverName":  body.driver_name,
        "driverPhone": body.driver_phone,
        "photos":      body.photos,
        "gps":         body.gps or {"lat": 12.9784, "lng": 77.5946},
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "status":      "submitted",
        "fraudCheck":  "passed",
    }
    await db.vehicle_submissions.insert_one({**doc})
    await create_notification(
        "New vehicle proof",
        f"{doc['vehicle']} registered by {doc['driverName']}",
        "info",
    )
    return _clean(doc)


@router.get("")
async def list_vehicle_submissions(_: Dict = Depends(get_current_user)):
    docs = await db.vehicle_submissions.find().sort("submittedAt", -1).to_list(500)
    return _clean_many(docs)
