"""Field Upload API — public, no auth required.

Used by the chat-like mobile PWA at /field-upload.
Accepts multipart form data with photos and submission details,
uploads to Cloudinary, and creates the submission + task records.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from core.cloudinary_upload import upload_image
from core.db import db
from core.helpers import _clean, create_notification

router = APIRouter(prefix="/field-upload", tags=["field-upload"])


@router.get("/ping")
async def ping():
    """Public health check — verifies Cloudinary env vars are present."""
    import os
    return {
        "status": "ok",
        "cloudinary_cloud": bool(os.environ.get("CLOUDINARY_CLOUD_NAME")),
        "cloudinary_key":   bool(os.environ.get("CLOUDINARY_API_KEY")),
        "cloudinary_secret": bool(os.environ.get("CLOUDINARY_API_SECRET")),
    }


@router.post("/upload-photo")
async def upload_photo(
    photo: UploadFile = File(...),
    label: str = Form(...),  # "Right side" | "Left side" | "Back angle"
):
    """Upload a single photo to Cloudinary. Returns the URL. Called per-photo during the chat flow."""
    img_bytes = await photo.read()
    if not img_bytes:
        raise HTTPException(status_code=400, detail="Empty photo file")

    try:
        result = upload_image(img_bytes, folder="moviq/field-proofs")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo upload failed: {e}")

    return {
        "url": result["url"],
        "public_id": result["public_id"],
        "label": label,
        "capturedAt": datetime.now(timezone.utc).isoformat(),
    }


@router.post("/submit")
async def submit_field_proof(
    vehicle: str = Form(...),
    driver_name: str = Form(...),
    driver_phone: str = Form(...),
    gps_lat: Optional[float] = Form(None),
    gps_lng: Optional[float] = Form(None),
    campaign_id: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    photo_urls: str = Form(...),  # JSON string: [{"url":..., "label":..., "public_id":...}]
):
    """Final submission — creates vehicle submission + task record in DB."""
    import json

    try:
        photos = json.loads(photo_urls)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid photo_urls JSON")

    if len(photos) < 3:
        raise HTTPException(status_code=400, detail="All 3 photos are required")

    task_code = f"TK-2026-{uuid.uuid4().hex[:4].upper()}"
    gps = {"lat": gps_lat or 0.0, "lng": gps_lng or 0.0}
    phone_clean = "".join(filter(str.isdigit, driver_phone))

    doc = {
        "id":          f"vs_{uuid.uuid4().hex[:10]}",
        "taskCode":    task_code,
        "vehicle":     vehicle.strip().upper(),
        "driverName":  driver_name.strip(),
        "driverPhone": phone_clean,
        "photos":      photos,
        "gps":         gps,
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "status":      "completed",
        "fraudCheck":  "passed",
        "source":      "web-chat",
        "phone":       phone_clean,
    }

    await db.vehicle_submissions.insert_one({**doc})

    # Sync into tasks collection for task tracking + reports
    task_doc = {
        "id":          task_code,
        "taskCode":    task_code,
        "unit":        doc["vehicle"],
        "vehicle":     doc["vehicle"],
        "executive":   doc["driverName"],
        "phone":       phone_clean,
        "campaignId":  campaign_id or "c1",
        "city":        city or "Bengaluru",
        "status":      "completed",
        "submittedAt": doc["submittedAt"],
    }
    await db.tasks.insert_one(task_doc)

    # Increment tasksDone for field executive
    await db.field_executives.update_many(
        {"$or": [{"phone": phone_clean}, {"name": doc["driverName"]}]},
        {"$inc": {"tasksDone": 1}}
    )
    await db.users.update_many(
        {"$or": [{"phone": phone_clean}, {"name": doc["driverName"]}]},
        {"$inc": {"tasksDone": 1}}
    )

    await create_notification(
        "New vehicle proof via Web Portal",
        f"[{task_code}] {doc['vehicle']} submitted by {doc['driverName']} (web chat)",
        "success",
    )

    return _clean({**doc, "taskCode": task_code})


@router.get("/campaigns")
async def list_active_campaigns():
    """Public endpoint — list active campaigns for the campaign selector in the chat."""
    docs = await db.campaigns.find({"status": {"$ne": "completed"}}).to_list(100)
    return [
        {
            "id": d.get("id", str(d.get("_id", ""))),
            "title": d.get("title", ""),
            "brand": d.get("brand", ""),
            "city": d.get("city", ""),
            "mediaType": d.get("mediaType", ""),
        }
        for d in docs
    ]
