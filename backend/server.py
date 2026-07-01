from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Any, Dict
import uuid
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext

from seed_data import (
    AGENCIES, BRANDS, MEDIA_TYPES, CAMPAIGNS, TASKS, FRAUD_ALERTS,
    FIELD_EXECUTIVES, SUPERVISORS, MONTHLY_STATS, CITY_STATS, NOTIFICATIONS,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# ---------- Config ----------
JWT_SECRET = os.environ.get("JWT_SECRET", "moviq-super-secret-key-change-in-prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ---------- Mongo ----------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------- App ----------
app = FastAPI(title="Moviq API")
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ---------- Models ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AgencyCreate(BaseModel):
    name: str
    head: str = ""
    email: EmailStr
    phone: str = ""
    city: str = ""
    plan: str = "Growth"


class CampaignCreate(BaseModel):
    title: str
    brand: str
    brandId: Optional[str] = None
    mediaType: str
    city: str
    totalTasks: int = 0
    budget: int = 0
    startDate: str = ""
    endDate: str = ""


class MediaTypeCreate(BaseModel):
    label: str
    category: str = "Custom"


class VehicleSubmissionCreate(BaseModel):
    vehicle: str
    driver_name: str
    driver_phone: str
    photos: List[Dict[str, str]] = []
    gps: Optional[Dict[str, float]] = None


# ---------- Helpers ----------
def _clean(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


def _clean_many(docs):
    return [_clean(d) for d in docs]


def create_jwt(user: Dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("password_hash", None)
    return _clean(user)


async def require_admin(user: Dict = Depends(get_current_user)) -> Dict[str, Any]:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


# ---------- Seeding ----------
async def _seed_if_empty(coll_name: str, docs: List[Dict[str, Any]]):
    coll = db[coll_name]
    if await coll.count_documents({}) == 0 and docs:
        await coll.insert_many([{**d} for d in docs])
        logger.info(f"Seeded {coll_name}: {len(docs)} docs")


async def seed_all():
    await _seed_if_empty("agencies", AGENCIES)
    await _seed_if_empty("brands", BRANDS)
    await _seed_if_empty("media_types", MEDIA_TYPES)
    await _seed_if_empty("campaigns", CAMPAIGNS)
    await _seed_if_empty("tasks", TASKS)
    await _seed_if_empty("fraud_alerts", FRAUD_ALERTS)
    await _seed_if_empty("field_executives", FIELD_EXECUTIVES)
    await _seed_if_empty("supervisors", SUPERVISORS)
    await _seed_if_empty("monthly_stats", MONTHLY_STATS)
    await _seed_if_empty("city_stats", CITY_STATS)
    await _seed_if_empty("notifications", NOTIFICATIONS)

    if await db.users.count_documents({}) == 0:
        seed_users = [
            {"id": "u1", "name": "Deepak Bansal", "email": "admin@moviq.in", "role": "admin", "avatar": "DB",
             "password_hash": pwd_ctx.hash("demo1234")},
            {"id": "u2", "name": "Saurav Mehta", "email": "saurav@brightads.in", "role": "agency", "avatar": "SM",
             "agencyId": "a1", "agencyName": "BrightAds Media",
             "password_hash": pwd_ctx.hash("demo1234")},
        ]
        await db.users.insert_many(seed_users)
        logger.info(f"Seeded users: {len(seed_users)}")


@app.on_event("startup")
async def on_startup():
    await seed_all()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()


# ---------- Routes ----------
@api.get("/")
async def root():
    return {"message": "Moviq API", "status": "ok"}


# ---- Auth ----
@api.post("/auth/login")
async def auth_login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not pwd_ctx.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    user.pop("password_hash", None)
    user = _clean(user)
    return {"token": create_jwt(user), "user": user}


@api.get("/auth/me")
async def auth_me(user: Dict = Depends(get_current_user)):
    return user


# ---- Agencies ----
@api.get("/agencies")
async def list_agencies(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.agencies.find().to_list(1000))


@api.post("/agencies")
async def create_agency(body: AgencyCreate, _: Dict = Depends(require_admin)):
    new = {
        "id": f"a{uuid.uuid4().hex[:8]}",
        **body.dict(),
        "campaigns": 0, "activeUsers": 1, "status": "trial", "revenue": 0,
        "joinedAt": datetime.now(timezone.utc).date().isoformat(),
    }
    await db.agencies.insert_one(new)
    return _clean(new)


@api.get("/agencies/{aid}")
async def get_agency(aid: str, _: Dict = Depends(get_current_user)):
    doc = await db.agencies.find_one({"id": aid})
    if not doc:
        raise HTTPException(status_code=404, detail="Agency not found")
    return _clean(doc)


# ---- Brands ----
@api.get("/brands")
async def list_brands(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.brands.find().to_list(1000))


# ---- Campaigns ----
@api.get("/campaigns")
async def list_campaigns(agency_id: Optional[str] = None, user: Dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if agency_id:
        q["agencyId"] = agency_id
    elif user["role"] == "agency":
        q["agencyId"] = user.get("agencyId")
    return _clean_many(await db.campaigns.find(q).to_list(1000))


@api.post("/campaigns")
async def create_campaign(body: CampaignCreate, user: Dict = Depends(get_current_user)):
    if user["role"] != "agency":
        raise HTTPException(status_code=403, detail="Only agency users can create campaigns")
    new = {
        "id": f"c{uuid.uuid4().hex[:8]}",
        **body.dict(),
        "agency": user.get("agencyName", ""),
        "agencyId": user.get("agencyId"),
        "completed": 0, "flagged": 0, "status": "ongoing", "spent": 0,
    }
    await db.campaigns.insert_one(new)
    return _clean(new)


# ---- Tasks ----
@api.get("/tasks")
async def list_tasks(agency_id: Optional[str] = None, status_: Optional[str] = None, city: Optional[str] = None,
                     user: Dict = Depends(get_current_user)):
    q: Dict[str, Any] = {}
    if agency_id:
        q["agencyId"] = agency_id
    elif user["role"] == "agency":
        q["agencyId"] = user.get("agencyId")
    if status_:
        q["status"] = status_
    if city:
        q["city"] = city
    return _clean_many(await db.tasks.find(q).to_list(2000))


# ---- Users ----
@api.get("/users")
async def list_users(role: Optional[str] = None, _: Dict = Depends(get_current_user)):
    if role == "field":
        return _clean_many(await db.field_executives.find().to_list(1000))
    if role == "supervisor":
        return _clean_many(await db.supervisors.find().to_list(1000))
    if role == "agency":
        agencies = await db.agencies.find().to_list(1000)
        return [{"id": a["id"], "name": a["head"], "email": a["email"], "agency": a["name"], "status": a["status"]} for a in agencies]
    if role == "admin":
        return [
            {"id": "ad1", "name": "Deepak Bansal", "email": "admin@moviq.in", "role": "Super Admin", "status": "active"},
            {"id": "ad2", "name": "Anjali Sharma", "email": "anjali@moviq.in", "role": "Operations", "status": "active"},
            {"id": "ad3", "name": "Rohan Iyer", "email": "rohan@moviq.in", "role": "Support", "status": "active"},
        ]
    return _clean_many(await db.users.find({}, {"password_hash": 0}).to_list(1000))


# ---- Fraud alerts ----
@api.get("/fraud-alerts")
async def list_fraud(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.fraud_alerts.find().to_list(1000))


@api.post("/fraud-alerts/{fid}/resolve")
async def resolve_fraud(fid: str, _: Dict = Depends(get_current_user)):
    res = await db.fraud_alerts.delete_one({"id": fid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"ok": True}


# ---- Media types ----
@api.get("/media-types")
async def list_media_types(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.media_types.find().to_list(1000))


@api.post("/media-types")
async def create_media_type(body: MediaTypeCreate, _: Dict = Depends(require_admin)):
    key = body.label.lower().replace(" ", "_")
    if await db.media_types.find_one({"key": key}):
        raise HTTPException(status_code=409, detail="Media type already exists")
    doc = {"key": key, "label": body.label, "category": body.category}
    await db.media_types.insert_one(doc)
    return _clean(doc)


@api.delete("/media-types/{mkey}")
async def delete_media_type(mkey: str, _: Dict = Depends(require_admin)):
    res = await db.media_types.delete_one({"key": mkey})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Media type not found")
    return {"ok": True}


# ---- Vehicle Submissions (WhatsApp bot) ----
@api.post("/vehicle-submissions")
async def create_vehicle_submission(body: VehicleSubmissionCreate):
    """Public endpoint used by the WhatsApp bot simulator. No auth required."""
    doc = {
        "id": f"vs_{uuid.uuid4().hex[:10]}",
        "vehicle": body.vehicle.upper(),
        "driverName": body.driver_name,
        "driverPhone": body.driver_phone,
        "photos": body.photos,
        "gps": body.gps or {"lat": 12.9784, "lng": 77.5946},
        "submittedAt": datetime.now(timezone.utc).isoformat(),
        "status": "submitted",
        "fraudCheck": "passed",
    }
    await db.vehicle_submissions.insert_one({**doc})
    return _clean(doc)


@api.get("/vehicle-submissions")
async def list_vehicle_submissions(_: Dict = Depends(get_current_user)):
    docs = await db.vehicle_submissions.find().sort("submittedAt", -1).to_list(500)
    return _clean_many(docs)


# ---- Analytics ----
@api.get("/analytics/overview")
async def analytics_overview(user: Dict = Depends(get_current_user)):
    monthly = _clean_many(await db.monthly_stats.find().to_list(100))
    cities = _clean_many(await db.city_stats.find().to_list(100))

    agencies = await db.agencies.find().to_list(1000)
    campaigns = await db.campaigns.find().to_list(1000)

    if user["role"] == "agency":
        campaigns = [c for c in campaigns if c.get("agencyId") == user.get("agencyId")]

    total_revenue = sum(a.get("revenue", 0) for a in agencies)
    completed = sum(c.get("completed", 0) for c in campaigns)
    total = sum(c.get("totalTasks", 0) for c in campaigns)
    active_agencies = sum(1 for a in agencies if a.get("status") == "active")
    live_campaigns = sum(1 for c in campaigns if c.get("status") == "ongoing")

    return {
        "monthlyStats": monthly,
        "cityStats": cities,
        "kpis": {
            "activeAgencies": active_agencies,
            "liveCampaigns": live_campaigns,
            "tasksExecuted": completed,
            "totalTasks": total,
            "totalRevenue": total_revenue,
        },
    }


# ---- Notifications ----
@api.get("/notifications")
async def list_notifications(_: Dict = Depends(get_current_user)):
    return _clean_many(await db.notifications.find().to_list(100))


# ---------- Include & CORS ----------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
