"""Centralised configuration — all environment variables in one place."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / ".env")

# ── Environment ────────────────────────────────────────────────────────────────
ENV: str = os.environ.get("ENV", "development")

# ── Authentication ─────────────────────────────────────────────────────────────
JWT_SECRET: str = os.environ.get(
    "JWT_SECRET", "moviq-dev-secret-key-UNSAFE-change-in-prod"
)
JWT_ALGORITHM: str = "HS256"
JWT_EXPIRE_HOURS: int = 24 * 7  # 7-day token lifetime

# ── CORS ───────────────────────────────────────────────────────────────────────
ALLOWED_ORIGINS: list = [
    o.strip()
    for o in os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3001"
    ).split(",")
]

# ── Cloudinary ─────────────────────────────────────────────────────────────────
CLOUDINARY_CLOUD_NAME: str = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
CLOUDINARY_API_KEY: str    = os.environ.get("CLOUDINARY_API_KEY", "")
CLOUDINARY_API_SECRET: str = os.environ.get("CLOUDINARY_API_SECRET", "")

# ── WhatsApp Cloud API ─────────────────────────────────────────────────────────
WHATSAPP_TOKEN: str           = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_NUMBER_ID: str = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "1250205821505876")
WHATSAPP_API_URL: str         = f"https://graph.facebook.com/v19.0/{os.environ.get('WHATSAPP_PHONE_NUMBER_ID', '1250205821505876')}/messages"
WEBHOOK_VERIFY_TOKEN: str     = os.environ.get("WEBHOOK_VERIFY_TOKEN", "moviq_webhook_2024")
