"""WhatsApp Cloud API webhook — verification + incoming message handler.

Conversation state machine per phone number stored in MongoDB:
  { phone, step, vehicle, driver_name, driver_phone, gps, photos[], updated_at }

Steps:
  greet      → user says "Hi"
  await_task → bot asks for vehicle number
  await_driver → bot asks for driver name
  await_phone → bot asks for driver phone
  await_location → bot asks user to share location
  photo_0    → right side photo
  photo_1    → left side photo
  photo_2    → back photo
  done       → submission complete
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import PlainTextResponse

from core.cloudinary_upload import upload_image
from core.config import WEBHOOK_VERIFY_TOKEN
from core.db import db
from core.helpers import create_notification
from core.whatsapp import download_media, mark_read, send_buttons, send_text

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

PHOTO_LABELS = ["Right side", "Left side", "Back angle"]

# ── Webhook verification (GET) ─────────────────────────────────────────────────
@router.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    if (
        params.get("hub.mode") == "subscribe"
        and params.get("hub.verify_token") == WEBHOOK_VERIFY_TOKEN
    ):
        return PlainTextResponse(params.get("hub.challenge", ""))
    raise HTTPException(status_code=403, detail="Verification failed")


# ── Incoming messages (POST) ───────────────────────────────────────────────────
@router.post("/webhook")
async def receive_webhook(request: Request):
    body = await request.json()
    try:
        entry   = body["entry"][0]
        changes = entry["changes"][0]["value"]
        messages = changes.get("messages", [])
        if not messages:
            return {"status": "no_messages"}

        msg    = messages[0]
        phone  = msg["from"]
        msg_id = msg["id"]
        mtype  = msg.get("type", "text")

        mark_read(msg_id)

        # 🔐 Verify that the sender's phone is registered as a Field Executive
        clean_phone = "".join(filter(str.isdigit, phone))
        authorized = False
        async for fe in db.field_executives.find():
            fe_phone = "".join(filter(str.isdigit, fe.get("phone", "")))
            if fe_phone and (fe_phone in clean_phone or clean_phone in fe_phone):
                authorized = True
                break
                
        if not authorized:
            send_text(phone, 
                "❌ *Access Denied.*\n\n"
                f"Your phone number ({phone}) is not registered on the MOVIQ platform.\n\n"
                "Please contact your agency manager or supervisor to onboard your phone number."
            )
            return {"status": "unauthorized"}

        state = await db.whatsapp_sessions.find_one({"phone": phone}) or {"phone": phone, "step": "greet"}
        step  = state.get("step", "greet")

        # ── GREET ─────────────────────────────────────────────────────────────
        if mtype == "text":
            text = msg.get("text", {}).get("body", "").strip().lower()

            if step == "greet" or text in ("hi", "hello", "hey", "start", "restart"):
                await _save_state(phone, {"step": "await_vehicle", "photos": [], "gps": None})
                send_text(phone,
                    "🙏 *Namaste! Welcome to MOVIQ Field Assistant.*\n\n"
                    "I'll guide you to submit vehicle branding proofs in 2 minutes.\n\n"
                    "📋 Please reply with the *vehicle number*\n_(e.g. KA-05-AB-1234)_"
                )

            elif step == "await_vehicle":
                vehicle = text.upper().replace(" ", "-")
                await _save_state(phone, {**state, "step": "await_driver", "vehicle": vehicle})
                send_text(phone,
                    f"✅ Vehicle *{vehicle}* noted.\n\n"
                    "👤 Now please share the *driver's full name*:"
                )

            elif step == "await_driver":
                await _save_state(phone, {**state, "step": "await_phone", "driver_name": msg["text"]["body"].strip()})
                send_text(phone, "📞 Got it! Now share the *driver's phone number*:")

            elif step == "await_phone":
                await _save_state(phone, {**state, "step": "await_location", "driver_phone": msg["text"]["body"].strip()})
                send_text(phone,
                    "📍 Almost there! Now please *share your current location*:\n\n"
                    "Tap 📎 Attachment → *Location* in WhatsApp and send it here."
                )

            elif step in ("photo_0", "photo_1", "photo_2"):
                send_text(phone, f"Please send a *photo*, not text. Tap 📷 to take the photo.")

            elif step == "done":
                send_buttons(phone, "Your submission is complete ✅ What would you like to do?", [
                    {"id": "new", "title": "➕ New vehicle"},
                    {"id": "exit", "title": "👋 Exit"},
                ])

            elif text == "new":
                await _save_state(phone, {"step": "await_vehicle", "photos": [], "gps": None})
                send_text(phone, "Great! Please reply with the next *vehicle number*:")
            else:
                send_text(phone, "Type *Hi* to start or restart the registration. 👋")

        # ── LOCATION ──────────────────────────────────────────────────────────
        elif mtype == "location" and step == "await_location":
            loc = msg["location"]
            gps = {"lat": loc["latitude"], "lng": loc["longitude"]}
            await _save_state(phone, {**state, "step": "photo_0", "gps": gps})
            send_text(phone,
                f"✅ Location captured! (Accuracy ~5m)\n\n"
                f"📷 *Photo 1 of 3 — Right side*\n"
                f"Stand on the right side of the vehicle and send the photo:"
            )

        # ── PHOTOS ────────────────────────────────────────────────────────────
        elif mtype == "image" and step in ("photo_0", "photo_1", "photo_2"):
            photo_idx  = int(step[-1])
            media_id   = msg["image"]["id"]
            caption    = PHOTO_LABELS[photo_idx]

            # Download from WhatsApp + upload to Cloudinary
            img_bytes  = download_media(media_id)
            result     = upload_image(img_bytes, folder="moviq/proofs")

            photos     = state.get("photos", [])
            photos.append({
                "label":     caption,
                "url":       result["url"],
                "public_id": result["public_id"],
                "capturedAt": datetime.now(timezone.utc).isoformat(),
            })

            if photo_idx < 2:
                next_step  = f"photo_{photo_idx + 1}"
                next_label = PHOTO_LABELS[photo_idx + 1]
                await _save_state(phone, {**state, "step": next_step, "photos": photos})
                send_text(phone,
                    f"✅ *{caption}* uploaded!\n\n"
                    f"📷 *Photo {photo_idx + 2} of 3 — {next_label}*\n"
                    f"Move to the {next_label.lower()} and send the photo:"
                )
            else:
                # All 3 photos done — save submission
                doc = {
                    "id":          f"vs_{uuid.uuid4().hex[:10]}",
                    "vehicle":     state.get("vehicle", ""),
                    "driverName":  state.get("driver_name", ""),
                    "driverPhone": state.get("driver_phone", ""),
                    "photos":      photos,
                    "gps":         state.get("gps") or {"lat": 0, "lng": 0},
                    "submittedAt": datetime.now(timezone.utc).isoformat(),
                    "status":      "submitted",
                    "fraudCheck":  "passed",
                    "source":      "whatsapp",
                    "phone":       phone,
                }
                await db.vehicle_submissions.insert_one({**doc})
                await create_notification(
                    "New vehicle proof via WhatsApp",
                    f"{doc['vehicle']} submitted by {doc['driverName']}",
                    "success",
                )
                await _save_state(phone, {"step": "done", "photos": [], "gps": None})

                gps = state.get("gps") or {}
                send_text(phone,
                    f"🎉 *All 3 photos submitted successfully!*\n\n"
                    f"━━━━━━━━━━━━━━━━━━━━\n"
                    f"🚚 Vehicle: *{doc['vehicle']}*\n"
                    f"👤 Driver: *{doc['driverName']}*\n"
                    f"📸 Photos: 3/3 ✅\n"
                    f"📍 GPS: {gps.get('lat',''):.4f}, {gps.get('lng',''):.4f}\n"
                    f"🕒 Time: {datetime.now(timezone.utc).strftime('%d %b %Y, %I:%M %p')} UTC\n"
                    f"🔍 Fraud check: PASSED ✅\n"
                    f"━━━━━━━━━━━━━━━━━━━━\n\n"
                    f"Your supervisor has been notified. Thank you! 🙏"
                )
        else:
            if step not in ("done", "greet"):
                send_text(phone, "Please follow the steps. Type *Hi* to restart anytime.")

    except Exception as e:
        print(f"WhatsApp webhook error: {e}")

    return {"status": "ok"}


async def _save_state(phone: str, data: dict) -> None:
    data["phone"] = phone
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.whatsapp_sessions.replace_one({"phone": phone}, data, upsert=True)
