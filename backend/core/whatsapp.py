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
    token = WATI_TOKEN.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }



def send_wati_template(to: str, template_name: str, parameters: list[dict]) -> bool:
    """Send an approved WATI template message (outbound first contact)."""
    clean_to = "".join(filter(str.isdigit, to))
    if not clean_to:
        return False
        
    if WATI_TOKEN and WATI_API_ENDPOINT:
        try:
            with httpx.Client(timeout=10) as client:
                url = f"{WATI_API_ENDPOINT}/api/v1/sendTemplateMessage/{clean_to}"
                payload = {
                    "template_name": template_name,
                    "broadcast_name": f"invite_{template_name}",
                    "parameters": parameters,
                }
                resp = client.post(url, headers=_wati_headers(), json=payload)
                if resp.status_code in (200, 201, 202):
                    logger.info(f"✅ Sent WATI template '{template_name}' to {clean_to}")
                    return True
                else:
                    logger.warning(f"WATI template message failed ({resp.status_code}): {resp.text}")
        except Exception as e:
            logger.error(f"Failed sending WATI template: {e}")

    return False


def send_user_invite_whatsapp(to: str, name: str, role: str, email: str, password: str) -> None:
    """Send user invitation credentials via WATI template (with text fallback)."""
    role_labels = {"admin": "Platform Admin", "agency": "Agency Head", "supervisor": "Supervisor", "field": "Field Executive"}
    role_str = role_labels.get(role.lower(), role)
    
    # 1. Attempt template message (requires approved template 'moviq_user_invite')
    params = [
        {"name": "1", "value": name},
        {"name": "2", "value": role_str},
        {"name": "3", "value": "moviq-bwz.vercel.app"},
        {"name": "4", "value": email},
        {"name": "5", "value": password},
    ]
    sent_template = send_wati_template(to, "moviq_user_invite", params)
    
    # 2. Fallback to session text message if template is not yet approved
    if not sent_template:
        msg = (
            f"Hi {name}! 👋\n\n"
            f"You've been invited to the MOVIQ Field Operations Platform as *{role_str}*.\n\n"
            f"🔑 Login: moviq-bwz.vercel.app\n"
            f"📧 Email: {email}\n"
            f"🔐 Password: {password}\n\n"
            f"Please change your password after first login via Settings."
        )
        send_text(to, msg)


def send_text(to: str, text: str) -> None:
    """Send a plain text message via WATI or Meta Cloud API."""
    clean_to = "".join(filter(str.isdigit, to))
    
    # 1. Use WATI API if configured
    if WATI_TOKEN and WATI_API_ENDPOINT:
        try:
            with httpx.Client(timeout=10) as client:
                # Use params= so httpx handles URL encoding of special chars, newlines, emoji
                resp = client.post(
                    f"{WATI_API_ENDPOINT}/api/v1/sendSessionMessage/{clean_to}",
                    headers=_wati_headers(),
                    params={"messageText": text},
                )
                if resp.status_code not in (200, 201):
                    # Some WATI versions prefer JSON body — try that as fallback
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
    if not media_ref:
        raise ValueError("media_ref is empty — cannot download image")
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

