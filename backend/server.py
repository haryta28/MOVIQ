"""MOVIQ API — entry point.

All business logic lives in routers/. This file only wires everything together.
Run with: uvicorn server:app --host 0.0.0.0 --port 8001 --reload
"""
import logging

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from core.config import ALLOWED_ORIGINS, ENV, JWT_SECRET
from core.db import client, create_indexes
from core.limiter import limiter
from seeder import seed_all

# ── Routers ────────────────────────────────────────────────────────────────────
from routers.auth_router          import router as auth_router
from routers.agencies             import router as agencies_router
from routers.brands               import router as brands_router
from routers.campaigns            import router as campaigns_router
from routers.tasks                import router as tasks_router
from routers.users                import router as users_router
from routers.fraud                import router as fraud_router
from routers.media_types          import router as media_types_router
from routers.vehicle_submissions  import router as vehicle_submissions_router
from routers.analytics            import router as analytics_router
from routers.notifications        import router as notifications_router
from routers.health               import router as health_router
from routers.whatsapp_webhook     import router as whatsapp_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)s  %(levelname)s  %(message)s",
)
logger = logging.getLogger(__name__)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Moviq API", version="2.0.0")

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS — restricted to configured origins (set ALLOWED_ORIGINS env var in production)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Route registration ─────────────────────────────────────────────────────────
P = "/api"
app.include_router(auth_router,               prefix=P)
app.include_router(agencies_router,           prefix=P)
app.include_router(brands_router,             prefix=P)
app.include_router(campaigns_router,          prefix=P)
app.include_router(tasks_router,              prefix=P)
app.include_router(users_router,              prefix=P)
app.include_router(fraud_router,              prefix=P)
app.include_router(media_types_router,        prefix=P)
app.include_router(vehicle_submissions_router, prefix=P)
app.include_router(analytics_router,          prefix=P)
app.include_router(notifications_router,      prefix=P)
app.include_router(health_router,             prefix=P)
app.include_router(whatsapp_router,           prefix=P)


@app.get("/api")
async def root():
    return {"message": "Moviq API", "status": "ok", "version": "2.0.0"}


# ── Lifecycle ──────────────────────────────────────────────────────────────────
_DEFAULT_SECRET = "moviq-dev-secret-key-UNSAFE-change-in-prod"


@app.on_event("startup")
async def on_startup():
    if ENV == "production" and JWT_SECRET == _DEFAULT_SECRET:
        raise RuntimeError(
            "FATAL: Default JWT_SECRET in production! "
            "Generate a strong secret: openssl rand -hex 32"
        )
    await create_indexes()   # Idempotent — skips existing indexes
    await seed_all()         # Idempotent — skips non-empty collections
    logger.info("🚀 Moviq API ready  ENV=%s", ENV)


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
    logger.info("💤 Moviq API shutdown complete")
