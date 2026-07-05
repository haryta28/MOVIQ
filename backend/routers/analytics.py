"""Analytics overview — all 4 DB queries run in parallel."""
import asyncio
from typing import Dict

from fastapi import APIRouter, Depends

from core.auth import get_current_user
from core.db import db
from core.helpers import _clean_many

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
async def analytics_overview(user: Dict = Depends(get_current_user)):
    # ⚡ All 4 collections fetched simultaneously (was sequential before — ~4x faster)
    monthly, cities, agencies, campaigns = await asyncio.gather(
        db.monthly_stats.find().to_list(100),
        db.city_stats.find().to_list(100),
        db.agencies.find().to_list(1000),
        db.campaigns.find().to_list(1000),
    )

    if user["role"] == "agency":
        campaigns = [c for c in campaigns if c.get("agencyId") == user.get("agencyId")]

    total_revenue  = sum(a.get("revenue",    0) for a in agencies)
    completed      = sum(c.get("completed",  0) for c in campaigns)
    total          = sum(c.get("totalTasks", 0) for c in campaigns)
    active_agencies = sum(1 for a in agencies if a.get("status") == "active")
    live_campaigns  = sum(1 for c in campaigns if c.get("status") == "ongoing")

    return {
        "monthlyStats": _clean_many(monthly),
        "cityStats":    _clean_many(cities),
        "kpis": {
            "activeAgencies": active_agencies,
            "liveCampaigns":  live_campaigns,
            "tasksExecuted":  completed,
            "totalTasks":     total,
            "totalRevenue":   total_revenue,
        },
    }
