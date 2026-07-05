"""Fraud alert endpoints — list and admin-only resolve."""
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException

from core.auth import get_current_user, require_admin
from core.db import db
from core.helpers import _clean_many, create_notification

router = APIRouter(prefix="/fraud-alerts", tags=["fraud"])


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
