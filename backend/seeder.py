"""Database seeder — populates empty collections with demo data at startup."""
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List

from core.auth import pwd_ctx
from core.config import ENV
from core.db import db
from seed_data import (
    AGENCIES, BRANDS, CAMPAIGNS, CITY_STATS, FIELD_EXECUTIVES,
    FRAUD_ALERTS, MEDIA_TYPES, MONTHLY_STATS, NOTIFICATIONS,
    SUPERVISORS, TASKS,
)

logger = logging.getLogger(__name__)


async def _seed_if_empty(coll_name: str, docs: List[Dict[str, Any]]) -> None:
    """Insert docs into collection only if it has zero documents."""
    coll = db[coll_name]
    if await coll.count_documents({}) == 0 and docs:
        await coll.insert_many([{**d} for d in docs])
        logger.info(f"Seeded {coll_name}: {len(docs)} docs")


async def seed_all() -> None:
    """Idempotent seeder — skips any collection that already has data."""
    await _seed_if_empty("agencies",          AGENCIES)
    await _seed_if_empty("brands",            BRANDS)
    await _seed_if_empty("media_types",       MEDIA_TYPES)
    await _seed_if_empty("campaigns",         CAMPAIGNS)
    await _seed_if_empty("tasks",             TASKS)
    await _seed_if_empty("fraud_alerts",      FRAUD_ALERTS)
    await _seed_if_empty("field_executives",  FIELD_EXECUTIVES)
    await _seed_if_empty("supervisors",       SUPERVISORS)
    await _seed_if_empty("monthly_stats",     MONTHLY_STATS)
    await _seed_if_empty("city_stats",        CITY_STATS)
    await _seed_if_empty("notifications",     NOTIFICATIONS)

    # Back-fill createdAt on any old notifications that are missing it
    now = datetime.now(timezone.utc)
    async for n in db.notifications.find({"createdAt": {"$exists": False}}):
        await db.notifications.update_one(
            {"id": n["id"]},
            {"$set": {"createdAt": (now - timedelta(hours=1)).isoformat()}},
        )

    # Demo users — development only, never in production
    if await db.users.count_documents({}) == 0:
        if ENV == "production":
            logger.warning(
                "No users found in production DB. "
                "Demo accounts are disabled in production — add users directly in MongoDB."
            )
        else:
            demo_users = [
                {
                    "id": "u1", "name": "Deepak Bansal", "email": "admin@moviq.in",
                    "role": "admin", "avatar": "DB",
                    "password_hash": pwd_ctx.hash("demo1234"),
                },
                {
                    "id": "u2", "name": "Saurav Mehta", "email": "saurav@brightads.in",
                    "role": "agency", "avatar": "SM",
                    "agencyId": "a1", "agencyName": "BrightAds Media",
                    "password_hash": pwd_ctx.hash("demo1234"),
                },
            ]
            await db.users.insert_many(demo_users)
            logger.info(f"Seeded {len(demo_users)} demo users (development mode)")
