"""Shared utility helpers used across all routers."""
import uuid
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from .db import db


# ── MongoDB helpers ────────────────────────────────────────────────────────────

def _clean(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Strip MongoDB's internal _id field from a document dict."""
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def _clean_many(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return [_clean(d) for d in docs]


# ── Time helpers ───────────────────────────────────────────────────────────────

def _relative_time(iso_str: Optional[str]) -> str:
    if not iso_str:
        return "just now"
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
    except Exception:
        return iso_str
    delta = datetime.now(timezone.utc) - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return "just now"
    if secs < 3600:
        return f"{secs // 60}m ago"
    if secs < 86400:
        return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


# ── Notification helper ────────────────────────────────────────────────────────

async def create_notification(
    title: str, description: str, ntype: str = "info"
) -> Dict[str, Any]:
    """Insert a notification record. ntype: 'alert' | 'success' | 'info'"""
    doc: Dict[str, Any] = {
        "id": f"n_{uuid.uuid4().hex[:10]}",
        "title": title,
        "description": description,
        "type": ntype,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "time": "just now",
    }
    await db.notifications.insert_one({**doc})
    return doc
