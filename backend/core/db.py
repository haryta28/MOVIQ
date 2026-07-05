"""Async MongoDB client, shared db handle, and startup index creation."""
import logging
import os
from pathlib import Path

import certifi
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent.parent / ".env")

logger = logging.getLogger(__name__)

client = AsyncIOMotorClient(os.environ["MONGO_URL"],tlsCAFile=certifi.where())
db = client[os.environ["DB_NAME"]]


async def create_indexes() -> None:
    """Create compound indexes for the most-queried fields.
    Safe to call on every startup — MongoDB skips already-existing indexes.
    """
    specs = [
        # tasks — most-queried collection, filter by agency + status or city
        ("tasks",               [("agencyId", 1), ("status", 1)]),
        ("tasks",               [("agencyId", 1), ("city", 1)]),
        ("tasks",               [("campaignId", 1)]),
        # campaigns
        ("campaigns",           [("agencyId", 1), ("status", 1)]),
        # fraud alerts — looked up by taskCode
        ("fraud_alerts",        [("taskCode", 1)]),
        # notifications — always fetched sorted newest-first
        ("notifications",       [("createdAt", -1)]),
        # vehicle submissions — always sorted by submittedAt desc
        ("vehicle_submissions", [("submittedAt", -1)]),
    ]
    for coll_name, keys in specs:
        await db[coll_name].create_index(keys)
    logger.info("✅ MongoDB indexes ensured")
