"""WhatsApp Client — supports both Meta Cloud API and WATI REST API."""
import httpx
import logging
from core.config import (
    WHATSAPP_TOKEN,
    WHATSAPP_API_URL,
    WATI_TOKEN,
    WATI_API_ENDPOINT,
)

logger = logging.getLogger(__name__)


def _meta_headers() -> dict:
    return {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }


def _wati_headers() -> dict:
    return {
        "Authorization": f"Bearer {WATI_TOKEN}",
        "Content-Type": "application/json",
    }


def send_text(to: str, text: str) -> None:
    """Send a plain text message via WATI or Meta Cloud API."""
    clean_to = "".join(filter(str.isdigit, to))
    
    # 1. Use WATI API if configured
    if WATI_TOKEN and WATI_API_ENDPOINT:
        try:
            url = f"{WATI_API_ENDPOINT}/api/v1/sendSessionMessage/{clean_to}?messageText={httpx.QueryParams({'t': text})['t']}"
            with httpx.Client(timeout=10) as client:
                resp = client.post(url, headers=_wati_headers())
                if resp.status_code not in (200, 201):
                    # Try JSON body post format
                    client.post(
                        f"{WATI_API_ENDPOINT}/api/v1/sendSessionMessage/{clean_to}",
                        headers=_wati_headers(),
                        json={"messageText": text},
                    )
            return
        except Exception as e:
            logger.error(f"Failed to send text via WATI: {e}")

    # 2. Fallback to Meta Cloud API
    if WHATSAPP_TOKEN:
        try:
            with httpx.Client(timeout=10) as client:
                client.post(WHATSAPP_API_URL, headers=_meta_headers(), json={
                    "messaging_product": "whatsapp",
                    "to": clean_to,
                    "type": "text",
                    "text": {"preview_url": False, "body": text},
                })
        except Exception as e:
            logger.error(f"Failed to send text via Meta Cloud API: {e}")


def send_buttons(to: str, body: str, buttons: list[dict]) -> None:
    """Send interactive reply buttons or text fallback."""
    clean_to = "".join(filter(str.isdigit, to))

    # 1. Use WATI API if configured
    if WATI_TOKEN and WATI_API_ENDPOINT:
        btn_text = "\n".join([f"• {b['title']}" for b in buttons])
        full_text = f"{body}\n\n{btn_text}"
        send_text(clean_to, full_text)
        return

    # 2. Fallback to Meta Cloud API
    if WHATSAPP_TOKEN:
        try:
            with httpx.Client(timeout=10) as client:
                client.post(WHATSAPP_API_URL, headers=_meta_headers(), json={
                    "messaging_product": "whatsapp",
                    "to": clean_to,
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
        except Exception as e:
            logger.error(f"Failed to send buttons via Meta Cloud API: {e}")


def download_media(media_ref: str) -> bytes:
    """Download a media object (image) from WATI URL or Meta Cloud API."""
    with httpx.Client(timeout=30) as client:
        # If media_ref is an absolute HTTP/HTTPS URL (supplied directly by WATI webhooks)
        if media_ref.startswith("http://") or media_ref.startswith("https://"):
            headers = _wati_headers() if WATI_TOKEN else {}
            resp = client.get(media_ref, headers=headers)
            return resp.content

        # Step 1: get the download URL from Meta Graph API
        info = client.get(
            f"https://graph.facebook.com/v19.0/{media_ref}",
            headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"},
        )
        url = info.json().get("url")
        if not url:
            raise ValueError(f"Unable to retrieve media URL for ID {media_ref}")

        # Step 2: download the actual bytes
        resp = client.get(url, headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"})
        return resp.content


def mark_read(message_id: str) -> None:
    """Mark an incoming message as read (shows blue ticks)."""
    if not WHATSAPP_TOKEN or not message_id:
        return
    try:
        with httpx.Client(timeout=10) as client:
            client.post(WHATSAPP_API_URL, headers=_meta_headers(), json={
                "messaging_product": "whatsapp",
                "status": "read",
                "message_id": message_id,
            })
    except Exception as e:
        logger.debug(f"mark_read skipped/failed: {e}")

