"""WhatsApp Cloud API client — send messages and download media."""
import httpx
from core.config import WHATSAPP_TOKEN, WHATSAPP_API_URL


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }


def send_text(to: str, text: str) -> None:
    """Send a plain text WhatsApp message."""
    with httpx.Client(timeout=10) as client:
        client.post(WHATSAPP_API_URL, headers=_headers(), json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": text},
        })


def send_buttons(to: str, body: str, buttons: list[dict]) -> None:
    """Send interactive reply buttons (max 3)."""
    with httpx.Client(timeout=10) as client:
        client.post(WHATSAPP_API_URL, headers=_headers(), json={
            "messaging_product": "whatsapp",
            "to": to,
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body},
                "action": {"buttons": [
                    {"type": "reply", "reply": {"id": b["id"], "title": b["title"]}}
                    for b in buttons
                ]},
            },
        })


def download_media(media_id: str) -> bytes:
    """Download a media object (image) from WhatsApp servers."""
    with httpx.Client(timeout=30) as client:
        # Step 1: get the download URL
        info = client.get(
            f"https://graph.facebook.com/v19.0/{media_id}",
            headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"},
        )
        url = info.json()["url"]
        # Step 2: download the actual bytes
        resp = client.get(url, headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"})
        return resp.content


def mark_read(message_id: str) -> None:
    """Mark an incoming message as read (shows blue ticks)."""
    with httpx.Client(timeout=10) as client:
        client.post(WHATSAPP_API_URL.replace("/messages", "/messages"), headers=_headers(), json={
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": message_id,
        })
