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
