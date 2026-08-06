"""Fraud alert endpoints — list, resolve, and manual rule testing engine."""
import uuid
from datetime import datetime, timezone
from typing import Dict, Optional, List, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from core.auth import get_current_user, require_admin
from core.db import db
from core.helpers import _clean, _clean_many, create_notification

router = APIRouter(prefix="/fraud-alerts", tags=["fraud"])


class RuleTestRequest(BaseModel):
    ruleKey: str  # 'duplicatePhoto' | 'gpsDeviation' | 'backdatedUpload' | 'lowPhotoQuality'
    taskCode: Optional[str] = None
    agency: Optional[str] = None
    executive: Optional[str] = None


RULE_MAP = {
    "duplicatePhoto": {
        "type": "Duplicate Photo",
        "severity": "high",
        "description": "Same image signature detected across multiple vehicle submissions",
        "default_agency": "UrbanReach",
        "default_exec": "Manoj Yadav",
    },
    "gpsDeviation": {
        "type": "GPS Mismatch",
        "severity": "medium",
        "description": "Submission location was 620m away from assigned geo-fence coordinates",
        "default_agency": "BrightAds Media",
        "default_exec": "Suresh Patel",
    },
    "backdatedUpload": {
        "type": "Backdated Upload",
        "severity": "high",
        "description": "EXIF metadata timestamp (36h ago) does not match upload time",
        "default_agency": "Coastal Outdoor",
        "default_exec": "Ravi Menon",
    },
    "lowPhotoQuality": {
        "type": "Low Photo Quality",
        "severity": "low",
        "description": "Image blur index score below threshold (unable to verify branding)",
        "default_agency": "Metro Outdoor",
        "default_exec": "Deepika Rao",
    },
}


@router.get("")
async def list_fraud(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.fraud_alerts.find().to_list(1000))


@router.post("/{fid}/resolve")
async def resolve_fraud(fid: str, _: Dict = Depends(require_admin)):
    """Admin-only — agencies cannot resolve their own fraud alerts."""
    alert = await db.fraud_alerts.find_one({"id": fid})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.fraud_alerts.delete_one({"id": fid})
    await create_notification(
        "Fraud alert resolved",
        f"{alert.get('type', '')} on {alert.get('taskCode', '')} marked as reviewed",
        "success",
    )
    return {"ok": True}


@router.post("/test-rule")
async def test_fraud_rule(body: RuleTestRequest, _: Dict = Depends(require_admin)):
    """Manual testing endpoint — triggers evaluation of a specific fraud detection rule."""
    meta = RULE_MAP.get(body.ruleKey)
    if not meta:
        raise HTTPException(status_code=400, detail=f"Invalid ruleKey: {body.ruleKey}. Allowed: {list(RULE_MAP.keys())}")

    # Generate or reuse taskCode
    task_code = body.taskCode or f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
    agency = body.agency or meta["default_agency"]
    exec_name = body.executive or meta["default_exec"]

    alert_id = f"f_{uuid.uuid4().hex[:8]}"
    alert_doc = {
        "id": alert_id,
        "taskCode": task_code,
        "type": meta["type"],
        "severity": meta["severity"],
        "agency": agency,
        "executive": exec_name,
        "description": meta["description"],
        "detectedAt": "Just now",
        "status": "open",
        "ruleKey": body.ruleKey,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    await db.fraud_alerts.insert_one({**alert_doc})

    # Flag corresponding task if it exists
    await db.tasks.update_one(
        {"taskCode": task_code},
        {"$set": {"status": "flagged", "flagReason": meta["description"]}}
    )

    await create_notification(
        f"Fraud rule triggered: {meta['type']}",
        f"Rule [{meta['type']}] flagged task {task_code} ({exec_name} · {agency})",
        "alert",
    )

    return {
        "status": "flagged",
        "message": f"Rule evaluation completed. Flagged alert created for {meta['type']}.",
        "alert": _clean(alert_doc),
    }
