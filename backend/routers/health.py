"""Health check endpoint — used for uptime monitoring and deployment verification."""
from fastapi import APIRouter

from core.db import db

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health_check():
    """Returns ok when server is up and MongoDB is reachable."""
    try:
        await db.command("ping")
        db_status = "connected"
    except Exception:
        db_status = "unreachable"
    return {"status": "ok", "db": db_status, "service": "moviq-api"}


@router.get("/test-wati")
async def test_wati(phone: str = "917899003666"):
    import httpx
    from core.config import WATI_TOKEN, WATI_API_ENDPOINT
    token = WATI_TOKEN.strip()
    if token.lower().startswith("bearer "):
        token = token[7:].strip()
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }

    url = f"{WATI_API_ENDPOINT}/api/v1/sendSessionMessage/{phone}"
    try:
        with httpx.Client(timeout=10) as client:
            resp1 = client.post(url, headers=headers, params={"messageText": "Test from Moviq"})
            resp2 = client.post(url, headers=headers, json={"messageText": "Test from Moviq"})
            return {
                "url": url,
                "token_preview": WATI_TOKEN[:10] + "..." if WATI_TOKEN else None,
                "resp1_status": resp1.status_code,
                "resp1_body": resp1.text,
                "resp2_status": resp2.status_code,
                "resp2_body": resp2.text,
            }
    except Exception as e:
        return {"error": str(e)}

